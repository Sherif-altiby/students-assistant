import { Prisma } from '@prisma/client';
import { Scope } from './study-table.types';

export function getSubjectScopeWhere(
  scope: Scope,
  subjectTitles?: readonly string[],
): Prisma.StudySubjectWhereInput {
  const scopeWhere = scope === 'ALL' ? {} : { id: { in: scope } };
  if (subjectTitles === undefined) return scopeWhere;
  return {
    AND: [
      scopeWhere,
      { title: { in: [...subjectTitles] } },
    ],
  };
}
