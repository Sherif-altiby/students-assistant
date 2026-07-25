import { Prisma, Role, User } from '@prisma/client';
import { prisma } from '../../config/prisma';
interface FindManyParams {
  skip?: number;
  take?: number;
  search?: string;
  role?: Role;
}
function buildWhere(params: Pick<FindManyParams, 'search' | 'role'>): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (params.role) {
    where.role = params.role;
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  return where;
}
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

  findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } });
  },

  findByInvitationToken(token: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { invitationToken: token } });
  },

   findMany(params: FindManyParams): Promise<User[]> {
    return prisma.user.findMany({
      where: buildWhere(params),
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  },

  count(params: Pick<FindManyParams, "search" | "role"> = {}): Promise<number> {
    return prisma.user.count({ where: buildWhere(params) });
  },


  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },

  delete(id: string): Promise<User> {
    return prisma.user.delete({ where: { id } });
  },
};
