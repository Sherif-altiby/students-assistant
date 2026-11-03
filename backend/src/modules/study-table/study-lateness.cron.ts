import { NotificationType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { addCalendarDays, dateKey, localDateKey } from './date-time';

const PAGE_SIZE = 200;
const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 15_000 } as const;
const CRON_LOCK_NAMESPACE = 1_398_039_876;
const CRON_LOCK_ID = 1;
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

const lateNoticeSessionSchema = z.object({
  id: z.string(),
  date: z.string(),
  subject: z.string(),
  unit: z.string(),
  lesson: z.string(),
});
const lateNoticeDataSchema = z.object({
  sessions: z.array(lateNoticeSessionSchema),
});

export function groupLateSessions(candidates: OverdueCandidate[], now: Date): LateTableNotice[] {
  const grouped = new Map<string, LateTableNotice>();
  const todayByTimezone = new Map<string, string>();
  for (const session of candidates) {
    const timezone = session.user.timezone;
    const localDate = todayByTimezone.get(timezone) ?? localDateKey(now, timezone);
    todayByTimezone.set(timezone, localDate);
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

async function saveLateNotices(
  tx: Prisma.TransactionClient,
  groups: LateTableNotice[]
): Promise<void> {
  if (!groups.length) return;
  const keyedGroups = groups.map((group) => ({
    group,
    dedupeKey: `late-study:${group.userId}:${group.tableId}:${group.localDate}`,
  }));
  const existing = await tx.notification.findMany({
    where: { dedupeKey: { in: keyedGroups.map(({ dedupeKey }) => dedupeKey) } },
    select: { dedupeKey: true, data: true },
  });
  const existingByKey = new Map(existing.map((notice) => [notice.dedupeKey, notice.data]));
  const values = keyedGroups.map(({ group, dedupeKey }) => {
    const sessionsById = new Map<string, LateSessionNotice>();
    const oldData = existingByKey.get(dedupeKey);
    if (oldData !== undefined && oldData !== null) {
      for (const session of lateNoticeDataSchema.parse(oldData).sessions) {
        sessionsById.set(session.id, session);
      }
    }
    for (const session of group.sessions) sessionsById.set(session.id, session);
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
    return Prisma.sql`(
      ${randomUUID()},
      ${group.userId},
      CAST(${NotificationType.LATE_STUDY} AS "NotificationType"),
      ${'جلسات مذاكرة متأخرة'},
      ${body},
      CAST(${JSON.stringify(data)} AS jsonb),
      ${dedupeKey}
    )`;
  });

  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "notifications"
      ("id", "user_id", "type", "title", "body", "data", "dedupe_key")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("dedupe_key") DO UPDATE SET
      "title" = EXCLUDED."title",
      "body" = EXCLUDED."body",
      "data" = EXCLUDED."data",
      "read_at" = NULL
  `);
}

export async function runLateStudyScan(now = new Date()): Promise<number> {
  const lockClient = new Client({ connectionString: process.env.DATABASE_URL });
  await lockClient.connect();
  let lockAcquired = false;
  try {
    const lockResult = await lockClient.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock($1, $2) AS locked',
      [CRON_LOCK_NAMESPACE, CRON_LOCK_ID]
    );
    lockAcquired = lockResult.rows[0]?.locked === true;
    if (!lockAcquired) return 0;

    const dedupeKeys = new Set<string>();
    const upperBound = addCalendarDays(dateKey(now), 1);
    let cursor: string | undefined;

    while (true) {
      const page = await prisma.studySession.findMany({
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
      await prisma.$transaction(async (tx) => {
        await saveLateNotices(tx, groups);
        const notifiedIds = groups.flatMap((group) => group.sessions.map(({ id }) => id));
        if (notifiedIds.length) {
          await tx.studySession.updateMany({
            where: { id: { in: notifiedIds }, lateNotifiedAt: null },
            data: { lateNotifiedAt: now },
          });
        }
      }, TRANSACTION_OPTIONS);
      for (const group of groups) {
        dedupeKeys.add(`${group.userId}:${group.tableId}:${group.localDate}`);
      }
      const last = page.at(-1);
      if (!last) break;
      cursor = last.id;
      if (page.length < PAGE_SIZE) break;
    }

    return dedupeKeys.size;
  } finally {
    try {
      if (lockAcquired) {
        await lockClient.query('SELECT pg_advisory_unlock($1, $2)', [
          CRON_LOCK_NAMESPACE,
          CRON_LOCK_ID,
        ]);
      }
    } finally {
      await lockClient.end();
    }
  }
}
