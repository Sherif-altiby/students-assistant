import { Prisma } from '@prisma/client';
import { Scope } from './study-table.types';

export function getSubjectScopeWhere(scope: Scope): Prisma.StudySubjectWhereInput {
  return scope === 'ALL' ? {} : { id: { in: scope } };
}
