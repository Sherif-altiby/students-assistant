import { habitRepository } from './habit.repository';

import { CreateHabitInput, UpdateHabitInput } from './habit.schema';

import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';

export const habitService = {
  async create(userId: string, input: CreateHabitInput) {
    return habitRepository.create({
      title: input.title,
      userId,
    });
  },

  async getMyHabits(userId: string) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const [habits, completions] = await Promise.all([
      habitRepository.findByUserId(userId),
      habitRepository.getCompletionsForDate(userId, today),
    ]);

    const completedHabitIds = new Set(completions.map((completion) => completion.habitId));

    return {
      date: today.toISOString().split('T')[0],

      habits: habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        completed: completedHabitIds.has(habit.id),
      })),
    };
  },

  async complete(userId: string, habitId: string) {
    const habit = await habitRepository.findById(habitId);

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenError('You cannot complete this habit');
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const completion = await habitRepository.findCompletion(habitId, today);

    if (completion) {
      throw new ConflictError('Habit already completed today');
    }

    return habitRepository.createCompletion({
      userId,
      habitId,
      date: today,
    });
  },

  async update(userId: string, habitId: string, input: UpdateHabitInput['body']) {
    const habit = await habitRepository.findById(habitId);

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenError('You cannot update this habit');
    }

    return habitRepository.update(habitId, input);
  },

  async delete(userId: string, habitId: string) {
    const habit = await habitRepository.findById(habitId);

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenError('You cannot delete this habit');
    }

    await habitRepository.delete(habitId);
  },

  async getHistory(userId: string) {
    return habitRepository.getCompletionsHistory(userId);
  },

  async getHistoryData(userId: string) {
  return habitRepository.getHistoryData(userId);
}
};
