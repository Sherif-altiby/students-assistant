// src/modules/lesson-date/lesson-date.service.ts

import { lessonDateRepository } from './lesson-date.repository';
import { DAY_AR_TO_EN, DAY_EN_TO_AR } from './day-mapping';
import { ConflictError, ForbiddenError, NotFoundError, BadRequestError } from '../../utils/AppError';
import { CreateLessonDateInput, UpdateLessonDateInput } from './lesson-date.schema';
import { lessonDatePdfService } from './lesson-date-pdf.service';

const toResponse = (lesson: {
  id: string;
  subject: string;
  teacher: string;
  dayOfWeek: keyof typeof DAY_EN_TO_AR;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: lesson.id,
  subject: lesson.subject,
  teacher: lesson.teacher,
  dayName: DAY_EN_TO_AR[lesson.dayOfWeek],
  startTime: lesson.startTime,
  endTime: lesson.endTime,
  createdAt: lesson.createdAt,
  updatedAt: lesson.updatedAt,
});

export const lessonDateService = {
  async create(userId: string, input: CreateLessonDateInput) {
    const dayOfWeek = DAY_AR_TO_EN[input.dayName];
    if (!dayOfWeek) {
      throw new BadRequestError('اسم اليوم غير صحيح');
    }

    const conflict = await lessonDateRepository.findConflicting({
      userId,
      dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    if (conflict) {
      throw new ConflictError(
        `يوجد تعارض مع موعد "${conflict.subject}" (${conflict.startTime} - ${conflict.endTime}) في نفس اليوم`
      );
    }

    const lesson = await lessonDateRepository.create({
      subject: input.subject,
      teacher: input.teacher,
      dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      userId,
    });

    return toResponse(lesson);
  },

  async getMyLessonDates(userId: string) {
    const lessons = await lessonDateRepository.findByUserId(userId);
    return lessons.map(toResponse);
  },

  async update(userId: string, id: string, input: UpdateLessonDateInput) {
    const existing = await lessonDateRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('الموعد غير موجود');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('لا يمكنك تعديل هذا الموعد');
    }

    const parsedDay = input.dayName ? DAY_AR_TO_EN[input.dayName] : undefined;
    if (input.dayName && !parsedDay) {
      throw new BadRequestError('اسم اليوم غير صحيح');
    }

    const nextDayOfWeek = input.dayName ? (parsedDay as typeof existing.dayOfWeek) : existing.dayOfWeek;

    const nextStartTime = input.startTime ?? existing.startTime;
    const nextEndTime = input.endTime ?? existing.endTime;

    // Cross-field order check that the schema layer can't do on its own
    // when only one of startTime/endTime is present in a partial update.
    if (nextStartTime >= nextEndTime) {
      throw new BadRequestError('وقت النهاية يجب أن يكون بعد وقت البداية');
    }

    const conflict = await lessonDateRepository.findConflicting({
      userId,
      dayOfWeek: nextDayOfWeek,
      startTime: nextStartTime,
      endTime: nextEndTime,
      excludeId: id,
    });

    if (conflict) {
      throw new ConflictError(
        `يوجد تعارض مع موعد "${conflict.subject}" (${conflict.startTime} - ${conflict.endTime}) في نفس اليوم`
      );
    }

    const updated = await lessonDateRepository.update(id, {
      subject: input.subject,
      teacher: input.teacher,
      dayOfWeek: input.dayName ? nextDayOfWeek : undefined,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    return toResponse(updated);
  },

  async delete(userId: string, id: string) {
    const existing = await lessonDateRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('الموعد غير موجود');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('لا يمكنك حذف هذا الموعد');
    }

    await lessonDateRepository.delete(id);
  },

  async generatePDF(userId: string): Promise<Buffer> {
    const lessons = await lessonDateRepository.findByUserId(userId);

    return lessonDatePdfService.generateLessonDatesPdf(
      lessons.map((lesson) => ({
        id: lesson.id,
        subject: lesson.subject,
        teacher: lesson.teacher,
        dayName: DAY_EN_TO_AR[lesson.dayOfWeek],
        startTime: lesson.startTime,
        endTime: lesson.endTime,
      }))
    );
  },
};