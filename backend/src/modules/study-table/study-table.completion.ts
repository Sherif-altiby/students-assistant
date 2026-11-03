import { Prisma } from '@prisma/client';

export function getForgettableLessonIds(
  lessonIds: readonly string[],
  stillCompletedLessonIds: readonly string[]
): string[] {
  const stillCompleted = new Set(stillCompletedLessonIds);
  return [...new Set(lessonIds)].filter((lessonId) => !stillCompleted.has(lessonId));
}

export async function forgetLessonCompletions(
  tx: Prisma.TransactionClient,
  userId: string,
  lessonIds: readonly string[]
): Promise<void> {
  const uniqueLessonIds = [...new Set(lessonIds)];
  if (!uniqueLessonIds.length) return;

  const completedLessons = await tx.studySession.findMany({
    where: {
      userId,
      lessonId: { in: uniqueLessonIds },
      completedAt: { not: null },
    },
    select: { lessonId: true },
    distinct: ['lessonId'],
  });
  const forgettableLessonIds = getForgettableLessonIds(
    uniqueLessonIds,
    completedLessons.map(({ lessonId }) => lessonId)
  );
  if (!forgettableLessonIds.length) return;

  await tx.studyLessonCompletion.deleteMany({
    where: {
      userId,
      lessonId: { in: forgettableLessonIds },
    },
  });
}
