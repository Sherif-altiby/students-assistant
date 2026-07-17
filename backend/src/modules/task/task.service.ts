// src/modules/task/task.service.ts

import { taskRepository } from './task.repository';
import { CreateTaskInput, UpdateTaskInput } from './task.schema';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';
import { TaskFrequency } from '@prisma/client';

export const taskService = {
  async create(userId: string, input: CreateTaskInput) {
    return taskRepository.create({
      title: input.title,
      frequency: input.frequency,
      userId,
    });
  },

  async getMyTasks(userId: string) {
    return taskRepository.findByUserId(userId);
  },

  async complete(userId: string, taskId: string) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenError('You cannot complete this task');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if task already completed today
    const existingHistory = await taskRepository.findHistoryByTaskAndDate(taskId, today);

    if (existingHistory) {
      throw new ConflictError('Task already completed today');
    }

    // Create history entry
    const history = await taskRepository.createHistory({
      userId,
      taskId,
      date: today,
      taskTitle: task.title,
      taskFrequency: task.frequency,
    });

    return history;
  },

  async getHistoryDays(userId: string, page: number = 1, limit: number = 10) {
    const [days, total] = await Promise.all([
      taskRepository.getHistoryDays(userId, page, limit),
      taskRepository.getHistoryDaysCount(userId),
    ]);

    // Process the grouped results
    const daysWithDetails = await Promise.all(
      days.map(async (day) => {
        // Get all history entries for this day
        const histories = await taskRepository.getHistoryDayWithTasks(
          userId, 
          day.date
        );

        return {
          date: day.date,
          totalTasks: day._count.taskId,
          tasks: histories.map(h => ({
            id: h.task.id,
            title: h.task.title,
            frequency: h.task.frequency,
            completedAt: h.completedAt,
            // Include the snapshot values
            completedTitle: h.taskTitle,
            completedFrequency: h.taskFrequency,
          })),
        };
      })
    );

    return {
      data: daysWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  },

  async getHistoryDayDetails(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const histories = await taskRepository.getHistoryByDate(userId, startOfDay);
    
    if (histories.length === 0) {
      throw new NotFoundError('No history found for this date');
    }

    return {
      date: startOfDay,
      totalTasks: histories.length,
      tasks: histories.map(h => ({
        id: h.task.id,
        title: h.task.title,
        frequency: h.task.frequency,
        completedAt: h.completedAt,
        // Include the snapshot values
        completedTitle: h.taskTitle,
        completedFrequency: h.taskFrequency,
      })),
    };
  },

  async update(userId: string, taskId: string, input: UpdateTaskInput['body']) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenError('You cannot update this task');
    }

    return taskRepository.update(taskId, input);
  },

  async delete(userId: string, taskId: string) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenError('You cannot delete this task');
    }

    // Delete all history entries for this task
    await taskRepository.deleteHistoryByTaskId(taskId);
    
    // Delete the task
    await taskRepository.delete(taskId);
  },

  async getTaskHistory(userId: string, taskId: string) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenError('You cannot view this task history');
    }

    return taskRepository.getTaskHistory(taskId);
  },
};