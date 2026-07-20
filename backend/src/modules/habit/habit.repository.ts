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

    const firstHabit = habits[0];
    if (!firstHabit) {
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

    // Build date filter with proper timezone handling
    let dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      // Set to start of day in local timezone
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      // Set to end of day in local timezone
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Get all distinct dates with completion counts
    const dateGroups = await prisma.completedHabit.groupBy({
      by: ['date'],
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      _count: {
        habitId: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Get total number of distinct days
    const totalDays = dateGroups.length;

    // Apply pagination to dates
    const paginatedDateGroups = dateGroups.slice(skip, skip + limit);

    // Get completions for the paginated dates
    const paginatedDates = paginatedDateGroups.map((group) => group.date);

    let completions: any[] = [];
    if (paginatedDates.length > 0) {
      completions = await prisma.completedHabit.findMany({
        where: {
          userId,
          date: {
            in: paginatedDates,
          },
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
        select: {
          habitId: true,
          date: true,
          completedAt: true, // Include the original timestamp
        },
        orderBy: { date: 'desc' },
      });
    }

    // Group completions by date (using the date field directly)
    const completionMap = new Map<string, Set<string>>();
    const dateKeys = new Set<string>();

    for (const comp of completions) {
      // Use the date field as is (it should be stored as a date without time)
      const dateObj = new Date(comp.date);
      const dateKey = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(dateObj.getUTCDate()).padStart(2, '0')}`;

      dateKeys.add(dateKey);
      if (!completionMap.has(dateKey)) {
        completionMap.set(dateKey, new Set());
      }
      completionMap.get(dateKey)!.add(comp.habitId);
    }

    // Build history for paginated dates
    const history = paginatedDateGroups.map((group) => {
      const date = new Date(group.date);
      const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

      return {
        date: dateKey,
        completedHabitIds: Array.from(completionMap.get(dateKey) || []),
        totalCompletions: group._count.habitId,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalDays / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get date range for the response
    const firstHabitDate = new Date(firstHabit.createdAt);
    firstHabitDate.setHours(0, 0, 0, 0);

    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return {
      habits: habits.map((h) => ({ id: h.id, title: h.title })),
      history: history,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalDays,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        dateRange: {
          start: firstHabitDate.toISOString().split('T')[0],
          end: todayLocal.toISOString().split('T')[0],
        },
      },
    };
  },

  findFirstHabitDate(userId: string) {
    return prisma.habit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
  },

  getProgressCompletions(userId: string, fromDate: Date) {
    return prisma.completedHabit.findMany({
      where: {
        userId,
        date: { gte: fromDate },
      },
      select: {
        date: true,
      },
    });
  },

  getDistinctCompletionDates(userId: string) {
    return prisma.completedHabit.findMany({
      where: { userId },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'asc' },
    });
  },
};
