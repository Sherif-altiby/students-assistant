import { Prisma, User } from '@prisma/client';
import { prisma } from '../../config/prisma';

/**
 * Repository layer: the only place that talks to Prisma directly for the
 * User model. Keeping data access here means the service layer (business
 * logic) stays testable and storage-agnostic.
 */
export const userRepository = {
  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findMany(params: { skip?: number; take?: number }): Promise<User[]> {
    return prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });
  },

  count(): Promise<number> {
    return prisma.user.count();
  },

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  },
};
