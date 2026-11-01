import { BadRequestError, ConflictError, NotFoundError } from '../../utils/AppError';
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

function mapSubjectGraph(subject: NonNullable<Awaited<ReturnType<typeof subjectRepository.findSubjectGraph>>>) {
  return {
    id: subject.id,
    title: subject.title,
    units: subject.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      order: unit.order,
      lessons: unit.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
      })),
    })),
  };
}

export const subjectService = {
  async listSubjects({ page, limit }: ListSubjectsQuery) {
    return subjectRepository.findAllSubjects(page, limit);
  },

  async getSubject(id: string) {
    const subject = await subjectRepository.findSubjectGraph(id);
    if (!subject) subjectNotFound();
    return mapSubjectGraph(subject);
  },

  async createSubject(input: CreateSubjectInput) {
    if (await subjectRepository.findSubjectByTitle(input.title)) {
      throw new ConflictError('توجد مادة بهذا الاسم بالفعل');
    }
    const subject = await subjectRepository.createSubject(input.title, input.units ?? []);
    return mapSubjectGraph(subject);
  },

  async updateSubject(id: string, input: UpdateSubjectInput) {
    const existing = await subjectRepository.findSubjectById(id);
    if (!existing) subjectNotFound();
    if (existing.title !== input.title && await subjectRepository.findSubjectByTitle(input.title)) {
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
