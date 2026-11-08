import { Role } from '@prisma/client';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { getSubjectAccessWhere } from './subject-access';
import { subjectRepository } from './subject.repository';
import {
  CreateSubjectInput,
  CreateUnitInput,
  ListSubjectsQuery,
  UpdateLessonInput,
  UpdateSubjectInput,
  UpdateUnitInput,
} from './subject.schema';

function subjectNotFound(): never {
  throw new NotFoundError('المادة غير موجودة');
}

function unitNotFound(): never {
  throw new NotFoundError('الوحدة غير موجودة');
}

function lessonNotFound(): never {
  throw new NotFoundError('الدرس غير موجود');
}

async function getVisibleSubjectWhere(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new NotFoundError('المستخدم غير موجود');
  return getSubjectAccessWhere(user.role === Role.ADMIN ? undefined : userId);
}

function mapSubjectGraph(
  subject: NonNullable<Awaited<ReturnType<typeof subjectRepository.findSubjectGraph>>>,
  completedLessonIds: Set<string>,
) {
  const lessonsCount = subject.units.reduce((total, unit) => total + unit.lessons.length, 0);
  const completedLessonsCount = subject.units.reduce(
    (total, unit) => total + unit.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length,
    0,
  );
  return {
    id: subject.id,
    title: subject.title,
    unitsCount: subject.units.length,
    lessonsCount,
    completedLessonsCount,
    progressPercent: lessonsCount ? Math.round((completedLessonsCount / lessonsCount) * 100) : 0,
    units: subject.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      order: unit.order,
      lessons: unit.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        isCompleted: completedLessonIds.has(lesson.id),
      })),
    })),
  };
}

export const subjectService = {
  async listSubjects({ page, limit }: ListSubjectsQuery, userId: string) {
    const accessWhere = await getVisibleSubjectWhere(userId);
    return subjectRepository.findAllSubjects(page, limit, userId, accessWhere);
  },

  async getSubject(id: string, userId: string) {
    const accessWhere = await getVisibleSubjectWhere(userId);
    const subject = await subjectRepository.findSubjectGraph(id, accessWhere);
    if (!subject) subjectNotFound();
    const lessonIds = subject.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
    const completionRows = lessonIds.length
      ? await subjectRepository.findCompletedLessonIds(userId, lessonIds)
      : [];
    return mapSubjectGraph(subject, new Set(completionRows));
  },

  async createSubject(input: CreateSubjectInput, userId: string, role: Role) {
    const ownerId = role === Role.USER ? userId : null;
    if (await subjectRepository.findSubjectByTitle(input.title, ownerId)) {
      throw new ConflictError('توجد مادة بهذا الاسم بالفعل');
    }
    const subject = await subjectRepository.createSubject(input.title, input.units ?? [], ownerId);
    return mapSubjectGraph(subject, new Set());
  },

  async updateSubject(id: string, input: UpdateSubjectInput) {
    const existing = await subjectRepository.findSubjectById(id);
    if (!existing) subjectNotFound();
    if (
      existing.title !== input.title &&
      await subjectRepository.findSubjectByTitle(input.title, existing.ownerId)
    ) {
      throw new ConflictError('توجد مادة بهذا الاسم بالفعل');
    }
    return subjectRepository.updateSubject(id, input.title);
  },

  async deleteSubject(id: string) {
    if (!(await subjectRepository.findSubjectById(id))) subjectNotFound();
    await subjectRepository.deleteSubject(id);
    return { deleted: true };
  },

  async createUnit(subjectId: string, input: CreateUnitInput) {
    const unit = await subjectRepository.createUnit(subjectId, input.title, input.lessons);
    if (!unit) subjectNotFound();
    return unit;
  },

  async updateUnit(id: string, input: UpdateUnitInput) {
    if (!(await subjectRepository.findUnitById(id))) unitNotFound();
    const unit = await subjectRepository.updateUnit(id, input);
    if (!unit) unitNotFound();
    return unit;
  },

  async deleteUnit(id: string) {
    if (!(await subjectRepository.deleteUnit(id))) unitNotFound();
    return { deleted: true };
  },

  async reorderUnits(subjectId: string, unitIds: string[]) {
    if (!(await subjectRepository.findSubjectById(subjectId))) subjectNotFound();
    if (!(await subjectRepository.reorderUnits(subjectId, unitIds))) {
      throw new BadRequestError('يجب أن تتضمن القائمة جميع وحدات المادة مرة واحدة');
    }
    return { unitIds };
  },

  async createLesson(unitId: string, title: string) {
    const lesson = await subjectRepository.createLesson(unitId, title);
    if (!lesson) unitNotFound();
    return lesson;
  },

  async updateLesson(id: string, input: UpdateLessonInput) {
    if (!(await subjectRepository.findLessonById(id))) lessonNotFound();
    const lesson = await subjectRepository.updateLesson(id, input);
    if (!lesson) unitNotFound();
    return lesson;
  },

  async deleteLesson(id: string) {
    if (!(await subjectRepository.deleteLesson(id))) lessonNotFound();
    return { deleted: true };
  },

  async reorderLessons(unitId: string, lessonIds: string[]) {
    if (!(await subjectRepository.findUnitById(unitId))) unitNotFound();
    if (!(await subjectRepository.reorderLessons(unitId, lessonIds))) {
      throw new BadRequestError('يجب أن تتضمن القائمة جميع دروس الوحدة مرة واحدة');
    }
    return { lessonIds };
  },
};
