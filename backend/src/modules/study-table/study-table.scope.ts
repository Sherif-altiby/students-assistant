import { Prisma } from '@prisma/client';
import { getSubjectAccessWhere } from '../subject/subject-access';
import type { Scope } from './study-table.schema';

export function getSubjectScopeWhere(
  scope: Scope,
  subjectOwnerId?: string
): Prisma.StudySubjectWhereInput {
  const scopeWhere = scope === 'ALL' ? {} : { id: { in: scope } };
  const accessWhere = getSubjectAccessWhere(subjectOwnerId);
  if (!accessWhere) return scopeWhere;
  return {
    AND: [scopeWhere, accessWhere],
  };
}
