import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { assignSyllabusOrder, moveIdToOrder, reorderIds } from './subject.order';

const ordered = [{ order: 'asc' as const }, { id: 'asc' as const }];
const graphInclude = {
  units: {
    orderBy: ordered,
    include: { lessons: { orderBy: ordered } },
  },
} satisfies Prisma.StudySubjectInclude;

async function setOrderedIds(
  ids: string[],
  existing: Array<{ id: string; order: number }>,
  updateAll: (offset: number) => Promise<unknown>,
  updateOne: (id: string, order: number) => Promise<unknown>,
) {
  const positions = reorderIds(existing, ids);
  if (!positions) return false;
  if (!positions.length) return true;

  const maxOrder = Math.max(...existing.map(({ order }) => order));
  const minOrder = Math.min(...existing.map(({ order }) => order));
  const offset = maxOrder - minOrder + existing.length + 1;
  await updateAll(offset);
  await Promise.all(positions.map(({ id, order }) => updateOne(id, order)));
  return true;
}

async function setUnitOrder(tx: Prisma.TransactionClient, subjectId: string, ids: string[]) {
  const where = { subjectId };
  const existing = await tx.studyUnit.findMany({
    where,
    orderBy: ordered,
    select: { id: true, order: true },
  });
  return setOrderedIds(
    ids,
    existing,
    (offset) => tx.studyUnit.updateMany({ where, data: { order: { increment: offset } } }),
    (id, order) => tx.studyUnit.update({ where: { id }, data: { order } }),
  );
}

async function setLessonOrder(tx: Prisma.TransactionClient, unitId: string, ids: string[]) {
  const where = { unitId };
  const existing = await tx.studyLesson.findMany({
    where,
    orderBy: ordered,
    select: { id: true, order: true },
  });
  return setOrderedIds(
    ids,
    existing,
    (offset) => tx.studyLesson.updateMany({ where, data: { order: { increment: offset } } }),
    (id, order) => tx.studyLesson.update({ where: { id }, data: { order } }),
  );
}

export const subjectRepository = {
  async findAllSubjects(page: number, limit: number, userId: string) {
    const [subjects, totalItems] = await Promise.all([
      prisma.studySubject.findMany({
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          units: { select: { _count: { select: { lessons: true } } } },
        },
      }),
      prisma.studySubject.count(),
    ]);
    const subjectIds = subjects.map(({ id }) => id);
    const completionRows = subjectIds.length
      ? await prisma.studyLessonCompletion.findMany({
        where: {
          userId,
          lesson: { unit: { subjectId: { in: subjectIds } } },
        },
        select: { lesson: { select: { unit: { select: { subjectId: true } } } } },
      })
      : [];
    const completedBySubject = new Map<string, number>();
    for (const { lesson } of completionRows) {
      const subjectId = lesson.unit.subjectId;
      completedBySubject.set(subjectId, (completedBySubject.get(subjectId) ?? 0) + 1);
    }
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: subjects.map(({ id, title, units }) => {
        const lessonsCount = units.reduce((total, unit) => total + unit._count.lessons, 0);
        const completedLessonsCount = completedBySubject.get(id) ?? 0;
        return {
          id,
          title,
          unitsCount: units.length,
          lessonsCount,
          completedLessonsCount,
          progressPercent: lessonsCount
            ? Math.round((completedLessonsCount / lessonsCount) * 100)
            : 0,
        };
      }),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  findSubjectById(id: string) {
    return prisma.studySubject.findUnique({ where: { id } });
  },

  findSubjectByTitle(title: string) {
    return prisma.studySubject.findUnique({ where: { title } });
  },

  findSubjectGraph(id: string) {
    return prisma.studySubject.findUnique({
      where: { id },
      include: graphInclude,
    });
  },

  async findCompletedLessonIds(userId: string, lessonIds: string[]) {
    const completions = await prisma.studyLessonCompletion.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true },
    });
    return completions.map(({ lessonId }) => lessonId);
  },

  async createSubject(
    title: string,
    units: Array<{ title: string; lessons?: Array<{ title: string }> }>,
  ) {
    return prisma.$transaction(async (tx) => {
      const subject = await tx.studySubject.create({ data: { title } });
      for (const unit of assignSyllabusOrder(units)) {
        await tx.studyUnit.create({
          data: {
            subjectId: subject.id,
            title: unit.title,
            order: unit.order,
            lessons: {
              create: unit.lessons,
            },
          },
        });
      }
      return tx.studySubject.findUniqueOrThrow({
        where: { id: subject.id },
        include: graphInclude,
      });
    });
  },

  updateSubject(id: string, title: string) {
    return prisma.studySubject.update({ where: { id }, data: { title } });
  },

  deleteSubject(id: string) {
    return prisma.studySubject.delete({ where: { id } });
  },

  findUnitById(id: string) {
    return prisma.studyUnit.findUnique({ where: { id } });
  },

  async createUnit(
    subjectId: string,
    title: string,
    lessons: Array<{ title: string }> = [],
  ) {
    return prisma.$transaction(async (tx) => {
      const subject = await tx.studySubject.findUnique({
        where: { id: subjectId },
        select: { id: true },
      });
      if (!subject) return null;
      const aggregate = await tx.studyUnit.aggregate({
        where: { subjectId },
        _max: { order: true },
      });
      return tx.studyUnit.create({
        data: {
          subjectId,
          title,
          order: (aggregate._max.order ?? 0) + 1,
          lessons: {
            create: lessons.map((lesson, index) => ({ title: lesson.title, order: index + 1 })),
          },
        },
        include: { lessons: { orderBy: ordered } },
      });
    });
  },

  async updateUnit(id: string, input: { title?: string; order?: number }) {
    return prisma.$transaction(async (tx) => {
      const unit = await tx.studyUnit.findUnique({ where: { id } });
      if (!unit) return null;
      if (input.order === undefined) {
        return tx.studyUnit.update({ where: { id }, data: { title: input.title } });
      }
      const siblings = await tx.studyUnit.findMany({
        where: { subjectId: unit.subjectId },
        orderBy: ordered,
        select: { id: true },
      });
      const ids = moveIdToOrder(siblings, id, input.order).map(({ id: siblingId }) => siblingId);
      await setUnitOrder(tx, unit.subjectId, ids);
      return tx.studyUnit.update({ where: { id }, data: { title: input.title } });
    });
  },

  async reorderUnits(subjectId: string, unitIds: string[]) {
    return prisma.$transaction((tx) => setUnitOrder(tx, subjectId, unitIds));
  },

  deleteUnit(id: string) {
    return prisma.$transaction(async (tx) => {
      const unit = await tx.studyUnit.findUnique({ where: { id } });
      if (!unit) return null;
      await tx.studyUnit.delete({ where: { id } });
      const remaining = await tx.studyUnit.findMany({
        where: { subjectId: unit.subjectId },
        orderBy: ordered,
        select: { id: true },
      });
      await setUnitOrder(tx, unit.subjectId, remaining.map(({ id: unitId }) => unitId));
      return unit;
    });
  },

  findLessonById(id: string) {
    return prisma.studyLesson.findUnique({ where: { id } });
  },

  async createLesson(unitId: string, title: string) {
    return prisma.$transaction(async (tx) => {
      const unit = await tx.studyUnit.findUnique({
        where: { id: unitId },
        select: { id: true },
      });
      if (!unit) return null;
      const aggregate = await tx.studyLesson.aggregate({
        where: { unitId },
        _max: { order: true },
      });
      return tx.studyLesson.create({
        data: { unitId, title, order: (aggregate._max.order ?? 0) + 1 },
      });
    });
  },

  async updateLesson(id: string, input: { title?: string; unitId?: string; order?: number }) {
    return prisma.$transaction(async (tx) => {
      const lesson = await tx.studyLesson.findUnique({ where: { id } });
      if (!lesson) return null;
      const targetUnitId = input.unitId ?? lesson.unitId;
      if (targetUnitId !== lesson.unitId) {
        const unit = await tx.studyUnit.findUnique({
          where: { id: targetUnitId },
          select: { id: true },
        });
        if (!unit) return null;
        const aggregate = await tx.studyLesson.aggregate({
          where: { unitId: targetUnitId },
          _max: { order: true },
        });
        const moved = await tx.studyLesson.update({
          where: { id },
          data: {
            title: input.title,
            unitId: targetUnitId,
            order: input.order ?? (aggregate._max.order ?? 0) + 1,
          },
        });
        const remaining = await tx.studyLesson.findMany({
          where: { unitId: lesson.unitId },
          orderBy: ordered,
          select: { id: true },
        });
        await setLessonOrder(tx, lesson.unitId, remaining.map(({ id: remainingId }) => remainingId));
        if (input.order !== undefined) {
          const targetLessons = await tx.studyLesson.findMany({
            where: { unitId: targetUnitId },
            orderBy: ordered,
            select: { id: true },
          });
          const targetIds = moveIdToOrder(targetLessons, id, input.order)
            .map(({ id: targetId }) => targetId);
          await setLessonOrder(tx, targetUnitId, targetIds);
        }
        return moved;
      }

      if (input.order === undefined) {
        return tx.studyLesson.update({ where: { id }, data: { title: input.title } });
      }
      const siblings = await tx.studyLesson.findMany({
        where: { unitId: lesson.unitId },
        orderBy: ordered,
        select: { id: true },
      });
      const ids = moveIdToOrder(siblings, id, input.order).map(({ id: siblingId }) => siblingId);
      await setLessonOrder(tx, lesson.unitId, ids);
      return tx.studyLesson.update({ where: { id }, data: { title: input.title } });
    });
  },

  async reorderLessons(unitId: string, lessonIds: string[]) {
    return prisma.$transaction((tx) => setLessonOrder(tx, unitId, lessonIds));
  },

  deleteLesson(id: string) {
    return prisma.$transaction(async (tx) => {
      const lesson = await tx.studyLesson.findUnique({ where: { id } });
      if (!lesson) return null;
      await tx.studyLesson.delete({ where: { id } });
      const remaining = await tx.studyLesson.findMany({
        where: { unitId: lesson.unitId },
        orderBy: ordered,
        select: { id: true },
      });
      await setLessonOrder(tx, lesson.unitId, remaining.map(({ id: lessonId }) => lessonId));
      return lesson;
    });
  },
};
