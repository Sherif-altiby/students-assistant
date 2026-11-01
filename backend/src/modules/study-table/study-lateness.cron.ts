import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { addCalendarDays, dateKey, localDateKey } from './date-time';

const PAGE_SIZE = 200;
const sessionSelect = {
  id: true,
  userId: true,
  studyTableId: true,
  dayId: true,
  completedAt: true,
  lateNotifiedAt: true,
  day: { select: { date: true } },
  subject: { select: { title: true } },
  lesson: { select: { title: true, unit: { select: { title: true } } } },
  studyTable: { select: { title: true } },
  user: { select: { timezone: true } },
} satisfies Prisma.StudySessionSelect;

type OverdueCandidate = Prisma.StudySessionGetPayload<{ select: typeof sessionSelect }>;

interface LateSessionNotice {
  id: string;
  date: string;
  subject: string;
  unit: string;
  lesson: string;
}

interface LateTableNotice {
  userId: string;
  tableId: string;
  tableTitle: string;
  localDate: string;
  sessions: LateSessionNotice[];
}

export function groupLateSessions(
  candidates: OverdueCandidate[],
  now: Date,
): LateTableNotice[] {
  const grouped = new Map<string, LateTableNotice>();
  for (const session of candidates) {
    const timezone = session.user.timezone;
    const localDate = localDateKey(now, timezone);
    const date = dateKey(session.day.date);
    if (date >= localDate || session.completedAt || session.lateNotifiedAt) continue;

    const key = `${session.userId}:${session.studyTableId}:${localDate}`;
    const group = grouped.get(key) ?? {
      userId: session.userId,
      tableId: session.studyTableId,
      tableTitle: session.studyTable.title,
      localDate,
      sessions: [],
    };
    group.sessions.push({
      id: session.id,
      date,
      subject: session.subject.title,
      unit: session.lesson.unit.title,
      lesson: session.lesson.title,
    });
    grouped.set(key, group);
  }
  return [...grouped.values()];
}

async function acquireCronLock(tx: Prisma.TransactionClient) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('late-study-cron')::bigint)::text`;
}

async function saveLateNotices(
  tx: Prisma.TransactionClient,
  groups: LateTableNotice[],
): Promise<void> {
  for (const group of groups) {
    const dedupeKey = `late-study:${group.userId}:${group.tableId}:${group.localDate}`;
    const existing = await tx.notification.findUnique({ where: { dedupeKey } });
    const sessionsById = new Map<string, LateSessionNotice>();
    const existingSessions: LateSessionNotice[] = [];
    if (existing?.data && typeof existing.data === 'object' && !Array.isArray(existing.data)
      && 'sessions' in existing.data && Array.isArray(existing.data.sessions)) {
      for (const value of existing.data.sessions) {
        if (value && typeof value === 'object' && !Array.isArray(value)
          && typeof value.id === 'string'
          && typeof value.date === 'string'
          && typeof value.subject === 'string'
          && typeof value.lesson === 'string') {
          existingSessions.push({
            id: value.id,
            date: value.date,
            subject: value.subject,
            unit: typeof value.unit === 'string' ? value.unit : '—',
            lesson: value.lesson,
          });
        }
      }
    }
    for (const session of [...existingSessions, ...group.sessions]) {
      sessionsById.set(session.id, session);
    }
    const sessions = [...sessionsById.values()];
    const body = `لديك ${sessions.length} جلسة مذاكرة متأخرة في جدول ${group.tableTitle}`;
    const data: Prisma.InputJsonObject = {
      tableId: group.tableId,
      tableTitle: group.tableTitle,
      localDate: group.localDate,
      sessions: sessions.map((session) => ({
        id: session.id,
        date: session.date,
        subject: session.subject,
        unit: session.unit,
        lesson: session.lesson,
      })),
    };

    if (existing) {
      await tx.notification.update({
        where: { id: existing.id },
        data: { title: 'جلسات مذاكرة متأخرة', body, data, readAt: null },
      });
    } else {
      await tx.notification.create({
        data: {
          userId: group.userId,
          type: NotificationType.LATE_STUDY,
          title: 'جلسات مذاكرة متأخرة',
          body,
          data,
          dedupeKey,
        },
      });
    }
  }
}

export async function runLateStudyScan(now = new Date()): Promise<number> {
  return prisma.$transaction(async (tx) => {
    await acquireCronLock(tx);
    const dedupeKeys = new Set<string>();
    const upperBound = addCalendarDays(dateKey(now), 1);
    let cursor: string | undefined;

    while (true) {
      const page = await tx.studySession.findMany({
        where: {
          completedAt: null,
          lateNotifiedAt: null,
          day: { date: { lt: new Date(`${upperBound}T00:00:00.000Z`) } },
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        orderBy: { id: 'asc' },
        take: PAGE_SIZE,
        select: sessionSelect,
      });
      if (!page.length) break;
      const groups = groupLateSessions(page, now);
      await saveLateNotices(tx, groups);
      for (const group of groups) {
        dedupeKeys.add(`${group.userId}:${group.tableId}:${group.localDate}`);
      }
      const notifiedIds = groups.flatMap((group) => group.sessions.map(({ id }) => id));
      if (notifiedIds.length) {
        await tx.studySession.updateMany({
          where: { id: { in: notifiedIds }, lateNotifiedAt: null },
          data: { lateNotifiedAt: now },
        });
      }
      cursor = page[page.length - 1]!.id;
      if (page.length < PAGE_SIZE) break;
    }

    return dedupeKeys.size;
  });
}
