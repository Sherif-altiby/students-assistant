import { prisma } from '../../config/prisma';

export const habitRepository = {
  create(data: { title: string; userId: string }) {
    return prisma.habit.create({
      data,
    });
  },

  findById(id: string) {
    return prisma.habit.findUnique({
      where: {
        id,
      },
    });
  },

  findByUserId(userId: string) {
    return prisma.habit.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  update(
    id: string,
    data: {
      title?: string;
    }
  ) {
    return prisma.habit.update({
      where: {
        id,
      },
      data,
    });
  },

  delete(id: string) {
    return prisma.habit.delete({
      where: {
        id,
      },
    });
  },

  // In your habit repository
  async findCompletion(habitId: string, date: Date) {
    // Ensure we're comparing dates properly
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return prisma.completedHabit.findFirst({
      where: {
        habitId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  },

  async createCompletion(data: { userId: string; habitId: string; date: Date }) {
    // Ensure the date is stored in UTC
    const utcDate = new Date(data.date);
    utcDate.setUTCHours(0, 0, 0, 0);

    return prisma.completedHabit.create({
      data: {
        ...data,
        date: utcDate,
      },
    });
  },

  getCompletionsForDate(userId: string, date: Date) {
    return prisma.completedHabit.findMany({
      where: {
        userId,
        date,
      },
      select: {
        habitId: true,
      },
    });
  },

  async getCompletionsHistory(userId: string) {
    const completions = await prisma.completedHabit.findMany({
      where: { userId },
      include: {
        habit: {
          select: { title: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Group by date using a Map
    const grouped = new Map<
      string,
      Array<{ habitId: string; habitTitle: string; completedAt: Date }>
    >();

    for (const comp of completions) {
      // Convert Date to YYYY-MM-DD
      const dateKey = comp.date.toISOString().split('T')[0] as string; // always a string
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push({
        habitId: comp.habitId,
        habitTitle: comp.habit.title,
        completedAt: comp.completedAt,
      });
    }

    // Convert Map to array and sort by date descending
    return Array.from(grouped.entries())
      .map(([date, completions]) => ({
        date,
        completions,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  // habit.repository.ts

  // habit.repository.ts
async getHistoryData(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }
) {
  const { page = 1, limit = 30, startDate, endDate } = options || {};
  const skip = (page - 1) * limit;

  // Get all habits for this user
  const habits = await prisma.habit.findMany({
    where: { userId },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Get the first habit creation date
  const firstHabit = habits[0];
  if (!firstHabit) {
    // No habits found, return empty data
    return {
      habits: [],
      history: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPrevPage: false,
        dateRange: null,
      },
    };
  }

  // Build date filter
  let dateFilter: any = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    dateFilter.gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  // Get total count for pagination
  const totalCompletions = await prisma.completedHabit.count({
    where: {
      userId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
  });

  // Get paginated completions
  const completions = await prisma.completedHabit.findMany({
    where: {
      userId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
    select: {
      habitId: true,
      date: true,
    },
    orderBy: { date: 'desc' },
    skip,
    take: limit,
  });

  // Group completions by date using UTC
  const completionMap = new Map<string, Set<string>>();
  for (const comp of completions) {
    const date = new Date(comp.date);
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

    if (!completionMap.has(dateKey)) {
      completionMap.set(dateKey, new Set());
    }
    completionMap.get(dateKey)!.add(comp.habitId);
  }

  // Get date range: from first habit creation to today
  const firstHabitDate = new Date(firstHabit.createdAt);
  firstHabitDate.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  // Generate all dates from first habit to today
  const allDates = [];
  const currentDate = new Date(firstHabitDate);

  while (currentDate <= todayUTC) {
    const dateKey = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDate.getUTCDate()).padStart(2, '0')}`;

    allDates.push({
      date: dateKey,
      completedHabitIds: Array.from(completionMap.get(dateKey) || []),
    });

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  // Sort by date descending (most recent first)
  allDates.sort((a, b) => b.date.localeCompare(a.date));

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCompletions / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    habits: habits.map((h) => ({ id: h.id, title: h.title })),
    history: allDates,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCompletions,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      dateRange: {
        start: firstHabitDate.toISOString().split('T')[0],
        end: todayUTC.toISOString().split('T')[0],
      },
    },
  };
}
};
