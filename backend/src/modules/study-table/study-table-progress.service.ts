import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { localDateKey } from './date-time';
import { getUserContext, percentage } from './study-table.helpers';
import { StudyTableProgress } from './study-table.types';

interface ProgressAggregate {
  subjectId: string;
  subjectTitle: string;
  unitId: string;
  unitTitle: string;
  total: number;
  completed: number;
  upcoming: number;
  inProgress: number;
  late: number;
}

function getSubjectScope(subjectOwnerId: string | undefined) {
  if (subjectOwnerId === undefined) return Prisma.empty;
  return Prisma.sql`AND (subject.owner_id IS NULL OR subject.owner_id = ${subjectOwnerId})`;
}

export const studyTableProgressService = {
  async getProgress(userId: string, tableId: string): Promise<StudyTableProgress> {
    const [table, userContext] = await Promise.all([
      prisma.studyTable.findFirst({
        where: { id: tableId, userId },
        select: { id: true },
      }),
      getUserContext(userId),
    ]);
    if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');

    const today = localDateKey(new Date(), userContext.timezone);
    const subjectScope = getSubjectScope(userContext.subjectOwnerId);
    const rows = await prisma.$queryRaw<ProgressAggregate[]>(Prisma.sql`
      SELECT
        session.subject_id AS "subjectId",
        subject.title AS "subjectTitle",
        unit.id AS "unitId",
        unit.title AS "unitTitle",
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE session.completed_at IS NOT NULL
        )::int AS completed,
        COUNT(*) FILTER (
          WHERE session.completed_at IS NULL
            AND day.date::text > ${today}
        )::int AS upcoming,
        COUNT(*) FILTER (
          WHERE session.completed_at IS NULL
            AND day.date::text = ${today}
        )::int AS "inProgress",
        COUNT(*) FILTER (
          WHERE session.completed_at IS NULL
            AND day.date::text < ${today}
        )::int AS late
      FROM "study_sessions" AS session
      INNER JOIN "study_days" AS day ON day.id = session.day_id
      INNER JOIN "study_subjects" AS subject ON subject.id = session.subject_id
      INNER JOIN "study_lessons" AS lesson ON lesson.id = session.lesson_id
      INNER JOIN "study_units" AS unit ON unit.id = lesson.unit_id
      WHERE session.study_table_id = ${tableId}
        AND session.user_id = ${userId}
        ${subjectScope}
      GROUP BY session.subject_id, subject.title, unit.id, unit.title
      ORDER BY subject.title, unit.title, unit.id
    `);

    let total = 0;
    let completed = 0;
    let upcoming = 0;
    let inProgress = 0;
    let late = 0;
    const subjects = new Map<string, StudyTableProgress['subjects'][number]>();

    for (const row of rows) {
      total += row.total;
      completed += row.completed;
      upcoming += row.upcoming;
      inProgress += row.inProgress;
      late += row.late;

      const subject = subjects.get(row.subjectId) ?? {
        subjectId: row.subjectId,
        subjectTitle: row.subjectTitle,
        total: 0,
        completed: 0,
        upcoming: 0,
        inProgress: 0,
        late: 0,
        percent: 0,
        units: [],
      };
      subject.total += row.total;
      subject.completed += row.completed;
      subject.upcoming += row.upcoming;
      subject.inProgress += row.inProgress;
      subject.late += row.late;
      subject.units.push({
        unitId: row.unitId,
        unitTitle: row.unitTitle,
        total: row.total,
        completed: row.completed,
        upcoming: row.upcoming,
        inProgress: row.inProgress,
        late: row.late,
        percent: percentage(row.completed, row.total),
      });
      subjects.set(row.subjectId, subject);
    }

    return {
      total,
      completed,
      upcoming,
      inProgress,
      late,
      percent: percentage(completed, total),
      byStatus: { COMPLETED: completed, UPCOMING: upcoming, IN_PROGRESS: inProgress, LATE: late },
      asOfDate: today,
      subjects: [...subjects.values()].map((subject) => ({
        ...subject,
        percent: percentage(subject.completed, subject.total),
      })),
    };
  },
};
