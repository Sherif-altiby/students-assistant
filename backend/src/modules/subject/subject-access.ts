import { Prisma } from '@prisma/client';

export function getSubjectAccessWhere(
  ownerId?: string,
): Prisma.StudySubjectWhereInput | undefined {
  return ownerId === undefined
    ? undefined
    : { OR: [{ ownerId: null }, { ownerId }] };
}
