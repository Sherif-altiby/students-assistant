// study-table.service.ts

import { addDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { studyTableRepository } from './study-table.repository';
import { prisma } from '../../config/prisma';
import { CreateStudyTableInput } from './study-table.schema';

interface GetMyTablesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export const studyTableService = {
  // Create table with days
  async create(userId: string, input: CreateStudyTableInput) {
    let startDate: Date, endDate: Date;
    if (input.type === 'DATE_RANGE') {
      startDate = new Date(input.startDate!);
      endDate = new Date(input.endDate!);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      if (startDate > endDate) {
        throw new Error('startDate must be before endDate');
      }
    } else {
      // NUMBER_OF_DAYS
      startDate = startOfDay(new Date());
      endDate = addDays(startDate, input.numberOfDays! - 1);
    }

    // Create table and days in a transaction
    return prisma.$transaction(async (tx) => {
      const table = await tx.studyTable.create({
        data: {
          title: input.title,
          type: input.type,
          startDate,
          endDate,
          userId,
        },
      });

      // Generate days
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      await tx.studyDay.createMany({
        data: days.map((date) => ({
          date,
          studyTableId: table.id,
        })),
      });

      // Return the table with days
      return tx.studyTable.findUnique({
        where: { id: table.id },
        include: {
          days: {
            orderBy: { date: 'asc' },
          },
        },
      });
    });
  },

  // Get one table (existing)
  async getById(userId: string, tableId: string) {
    const table = await studyTableRepository.findById(tableId);
    if (!table) throw new Error('Table not found');
    if (table.userId !== userId) throw new Error('Unauthorized');
    return table;
  },

  // Get all tables (existing)
  async getMyTables(userId: string, options?: GetMyTablesOptions) {
    return studyTableRepository.findByUserId(userId, options);
  },

  // Update table title
  async updateTitle(userId: string, tableId: string, title: string) {
    const table = await studyTableRepository.findById(tableId);
    if (!table) throw new Error('Table not found');
    if (table.userId !== userId) throw new Error('Unauthorized');
    return studyTableRepository.updateTitle(tableId, title);
  },

  // Add content to a day
  async addDayContent(userId: string, dayId: string, subjects: any[]) {
    const day = await studyTableRepository.findDayById(dayId);
    if (!day) throw new Error('Day not found');
    if (day.studyTable.userId !== userId) throw new Error('Unauthorized');
    return studyTableRepository.addDayContent(dayId, subjects);
  },

  // Replace all content of a day
  async replaceDayContent(userId: string, dayId: string, subjects: any[]) {
    const day = await studyTableRepository.findDayById(dayId);
    if (!day) throw new Error('Day not found');
    if (day.studyTable.userId !== userId) throw new Error('Unauthorized');
    return studyTableRepository.replaceDayContent(dayId, subjects);
  },

  // Complete lesson (existing)
  async completeLesson(userId: string, lessonId: string) {
    // Check if lesson exists and belongs to user's table
    const lesson = await prisma.studyLesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            subject: {
              include: {
                day: {
                  include: {
                    studyTable: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!lesson) throw new Error('Lesson not found');
    if (lesson.chapter.subject.day.studyTable.userId !== userId) {
      throw new Error('Unauthorized');
    }
    return studyTableRepository.createLessonCompletion({
      lessonId,
      userId,
    });
  },

  // Delete table (existing)
  async delete(userId: string, tableId: string) {
    const table = await studyTableRepository.findById(tableId);
    if (!table) throw new Error('Table not found');
    if (table.userId !== userId) throw new Error('Unauthorized');
    return studyTableRepository.delete(tableId);
  },
};
