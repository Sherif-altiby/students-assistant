import { NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';

export const notificationService = {
  async list(userId: string, page: number, limit: number) {
    const where = { userId };
    const [notifications, totalItems, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return {
      notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  },

  async markRead(userId: string, id: string) {
    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (!updated.count) throw new NotFoundError('الإشعار غير موجود');
    return prisma.notification.findFirst({ where: { id, userId } });
  },

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updatedCount: result.count };
  },
};
