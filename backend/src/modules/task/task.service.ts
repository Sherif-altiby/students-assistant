import { taskRepository } from './task.repository';
import { CreateTaskInput, UpdateTaskInput } from './task.schema';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';

// Helper function to format date to YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format datetime to YYYY-MM-DD HH:MM:SS (without timezone)
const formatDateTime = (date: Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Helper to get today's date in UTC
const getTodayUTC = (): Date => {
  const now = new Date();
  // Create date in UTC
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

type ProgressPeriod = 'day' | 'week' | 'month';

interface ProgressPoint {
  period: string;
  everyDayCompleted: number;
  todayCompleted: number;
}

const getPeriodKey = (date: Date, period: ProgressPeriod): string => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (period === 'day') {
    return formatDateToYYYYMMDD(d);
  }

  if (period === 'week') {
    const dayOfWeek = d.getUTCDay() || 7; // Sunday(0) -> 7
    d.setUTCDate(d.getUTCDate() - dayOfWeek + 1); // back to Monday
    return formatDateToYYYYMMDD(d);
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

    // Use UTC date instead of local date
    const today = getTodayUTC();

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

    // Format the response
    return {
      ...history,
      date: formatDateToYYYYMMDD(history.date),
      completedAt: formatDateTime(history.completedAt),
    };
  },

  async getHistoryDays(userId: string, page: number = 1, limit: number = 10) {
    const [days, total] = await Promise.all([
      taskRepository.getHistoryDays(userId, page, limit),
      taskRepository.getHistoryDaysCount(userId),
    ]);

    const daysWithDetails = await Promise.all(
      days.map(async (day) => {
        const histories = await taskRepository.getHistoryDayWithTasks(userId, day.date);

        return {
          date: formatDateToYYYYMMDD(day.date),
          totalTasks: day._count.taskId,
          tasks: histories.map((h) => ({
            id: h.task.id,
            title: h.task.title,
            frequency: h.task.frequency,
            completedAt: formatDateTime(h.completedAt),
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
      date: formatDateToYYYYMMDD(startOfDay),
      totalTasks: histories.length,
      tasks: histories.map((h) => ({
        id: h.task.id,
        title: h.task.title,
        frequency: h.task.frequency,
        completedAt: formatDateTime(h.completedAt),
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

    await taskRepository.deleteHistoryByTaskId(taskId);
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

    const histories = await taskRepository.getTaskHistory(taskId);

    return histories.map((h) => ({
      ...h,
      date: formatDateToYYYYMMDD(h.date),
      completedAt: h.completedAt ? formatDateTime(h.completedAt) : null,
    }));
  },

  async getProgress(userId: string, period: ProgressPeriod = 'day') {
    const firstTask = await taskRepository.findFirstTaskDate(userId);

    if (!firstTask) {
      return { period, data: [] as ProgressPoint[] };
    }

    const startDate = firstTask.createdAt;
    const endDate = new Date();

    const history = await taskRepository.getProgressHistory(userId, startDate);

    const buckets = new Map<string, { everyDayCompleted: number; todayCompleted: number }>();

    for (const key of buildEmptyBuckets(startDate, endDate, period)) {
      buckets.set(key, { everyDayCompleted: 0, todayCompleted: 0 });
    }

    for (const entry of history) {
      const key = getPeriodKey(entry.date, period);
      const bucket = buckets.get(key) ?? { everyDayCompleted: 0, todayCompleted: 0 };

      if (entry.taskFrequency === 'EVERY_DAY') {
        bucket.everyDayCompleted += 1;
      } else {
        bucket.todayCompleted += 1;
      }

      buckets.set(key, bucket);
    }

    const data: ProgressPoint[] = Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([periodKey, counts]) => ({
        period: periodKey,
        everyDayCompleted: counts.everyDayCompleted,
        todayCompleted: counts.todayCompleted,
      }));

    return { period, data };
  },
};
