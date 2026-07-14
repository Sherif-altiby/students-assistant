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

  findCompletion(habitId: string, date: Date) {
    return prisma.completedHabit.findUnique({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
    });
  },

  createCompletion(data: { userId: string; habitId: string; date: Date }) {
    return prisma.completedHabit.create({
      data,
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

  async getHistoryData(userId: string) {
    // Get all habits for this user
    const habits = await prisma.habit.findMany({
      where: { userId },
      select: { id: true, title: true },
    });

    // Get all completions grouped by date
    const completions = await prisma.completedHabit.findMany({
      where: { userId },
      select: {
        habitId: true,
        date: true,
      },
      orderBy: { date: 'desc' },
    });

    // Group completions by date
    const completionMap = new Map<string, Set<string>>();
    for (const comp of completions) {
      const dateKey = comp.date.toISOString().split('T')[0] as string;
      if (!completionMap.has(dateKey)) {
        completionMap.set(dateKey, new Set());
      }
      completionMap.get(dateKey)!.add(comp.habitId);
    }

    // Get date range (user creation date to today)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) throw new Error('User not found');

    const startDate = new Date(user.createdAt);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate all dates from start to today
    const allDates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0] as string;
      allDates.push({
        date: dateKey,
        completedHabitIds: Array.from(completionMap.get(dateKey) || []),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      habits: habits.map((h) => ({ id: h.id, title: h.title })),
      history: allDates.reverse(), // Most recent first
    };
  },
};
