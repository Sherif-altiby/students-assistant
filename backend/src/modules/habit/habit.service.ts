import { habitRepository } from './habit.repository';

import { CreateHabitInput, UpdateHabitInput } from './habit.schema';

import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';

type ProgressPeriod = 'day' | 'week' | 'month';

interface HabitProgressPoint {
  period: string;
  completedCount: number;
}

const getPeriodKey = (date: Date, period: ProgressPeriod): string => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (period === 'day') {
    return d.toISOString().split('T')[0] as string;
  }

  if (period === 'week') {
    const dayOfWeek = d.getUTCDay() || 7; // Sunday(0) -> 7
    d.setUTCDate(d.getUTCDate() - dayOfWeek + 1); // back to Monday
    return d.toISOString().split('T')[0] as string;
  }

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const buildEmptyBuckets = (startDate: Date, endDate: Date, period: ProgressPeriod): string[] => {
  const keys: string[] = [];
  const seen = new Set<string>();

  let cursor = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  );
  const end = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())
  );

  while (cursor <= end) {
    const key = getPeriodKey(cursor, period);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }

    if (period === 'day') {
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    } else if (period === 'week') {
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }
  }

  return keys;
};

// Given a sorted (ascending), deduplicated list of completion dates, find the
// longest run of consecutive calendar days.
const calculateLongestStreak = (dates: Date[]): number => {
  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = dates[i - 1] as Date;
    const curr = dates[i] as Date;

    const diffInDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

    if (diffInDays === 1) {
      current += 1;
    } else if (diffInDays > 1) {
      current = 1;
    }

    if (current > longest) {
      longest = current;
    }
  }

  return longest;
};

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

    // Use UTC date to avoid timezone issues
    const today = new Date();
    const utcToday = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );

    const completion = await habitRepository.findCompletion(habitId, utcToday);

    if (completion) {
      throw new ConflictError('Habit already completed today');
    }

    return habitRepository.createCompletion({
      userId,
      habitId,
      date: utcToday,
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

  // habit.service.ts
  async getHistoryData(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ) {
    return habitRepository.getHistoryData(userId, options);
  },

  async getProgress(userId: string, period: ProgressPeriod = 'day') {
    const firstHabit = await habitRepository.findFirstHabitDate(userId);

    if (!firstHabit) {
      return { period, data: [] as HabitProgressPoint[] };
    }

    const startDate = firstHabit.createdAt;
    const endDate = new Date();

    const completions = await habitRepository.getProgressCompletions(userId, startDate);

    const buckets = new Map<string, number>();
    for (const key of buildEmptyBuckets(startDate, endDate, period)) {
      buckets.set(key, 0);
    }

    for (const completion of completions) {
      const key = getPeriodKey(completion.date, period);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const data: HabitProgressPoint[] = Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([periodKey, completedCount]) => ({ period: periodKey, completedCount }));

    return { period, data };
  },

  async getStats(userId: string) {
    const habits = await habitRepository.findByUserId(userId);
    const total = habits.length;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todaysCompletions = await habitRepository.getCompletionsForDate(userId, today);
    const completed = todaysCompletions.length;
    const notCompleted = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const completionDates = await habitRepository.getDistinctCompletionDates(userId);
    const longestStreak = calculateLongestStreak(completionDates.map((c) => c.date));

    return {
      habits: habits.map((h) => ({ id: h.id, title: h.title })),
      total,
      completed,
      notCompleted,
      completionRate,
      longestStreak,
    };
  },
};
