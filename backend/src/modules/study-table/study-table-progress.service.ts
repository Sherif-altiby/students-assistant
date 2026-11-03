import { NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { localDateKey } from './date-time';
import { getStudySessionStatus } from './study-table.status';
import { getTimezone, percentage } from './study-table.helpers';
import { StudyTableProgress } from './study-table.types';

export const studyTableProgressService = {
  async getProgress(userId: string, tableId: string): Promise<StudyTableProgress> {
    const [table, timezone] = await Promise.all([
      prisma.studyTable.findFirst({
        where: { id: tableId, userId },
        include: {
          days: {
            include: {
              sessions: {
                include: { subject: true, lesson: { include: { unit: true } } },
              },
            },
          },
        },
      }),
      getTimezone(userId),
    ]);
    if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
    const today = localDateKey(new Date(), timezone);
    const subjects = new Map<string, StudyTableProgress['subjects'][number]>();
    let completed = 0;
    let upcoming = 0;
    let inProgress = 0;
    let late = 0;
    let total = 0;

    for (const day of table.days) {
      for (const session of day.sessions) {
        total += 1;
        const status = getStudySessionStatus(session, day.date, timezone);
        const subject = subjects.get(session.subjectId) ?? {
          subjectId: session.subjectId,
          subjectTitle: session.subject.title,
          total: 0,
          completed: 0,
          upcoming: 0,
          inProgress: 0,
          late: 0,
          percent: 0,
          units: [],
        };
        const unit = subject.units.find(({ unitId }) => unitId === session.lesson.unitId) ?? {
          unitId: session.lesson.unitId,
          unitTitle: session.lesson.unit.title,
          total: 0,
          completed: 0,
          upcoming: 0,
          inProgress: 0,
          late: 0,
          percent: 0,
        };
        if (!subject.units.some(({ unitId }) => unitId === unit.unitId)) subject.units.push(unit);
        subject.total += 1;
        unit.total += 1;
        if (status === 'COMPLETED') {
          completed += 1;
          subject.completed += 1;
          unit.completed += 1;
        } else if (status === 'UPCOMING') {
          upcoming += 1;
          subject.upcoming += 1;
          unit.upcoming += 1;
        } else if (status === 'IN_PROGRESS') {
          inProgress += 1;
          subject.inProgress += 1;
          unit.inProgress += 1;
        } else {
          late += 1;
          subject.late += 1;
          unit.late += 1;
        }
        subjects.set(session.subjectId, subject);
      }
    }
    const subjectProgress = [...subjects.values()].map((subject) => ({
      ...subject,
      percent: percentage(subject.completed, subject.total),
      units: subject.units.map((unit) => ({
        ...unit,
        percent: percentage(unit.completed, unit.total),
      })),
    }));
    return {
      total,
      completed,
      upcoming,
      inProgress,
      late,
      percent: percentage(completed, total),
      byStatus: {
        COMPLETED: completed,
        UPCOMING: upcoming,
        IN_PROGRESS: inProgress,
        LATE: late,
      },
      asOfDate: today,
      subjects: subjectProgress,
    };
  },
};
