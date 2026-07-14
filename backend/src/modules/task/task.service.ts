import { taskRepository } from './task.repository';

import { CreateTaskInput, UpdateTaskInput } from './task.schema';

import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';

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

    const completion = await taskRepository.findCompletion(taskId, today);

    if (completion) {
      throw new ConflictError('Task already completed today');
    }

    return taskRepository.createCompletion({
      userId,
      taskId,
      date: today,
    });
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

    await taskRepository.delete(taskId);
  },
};
