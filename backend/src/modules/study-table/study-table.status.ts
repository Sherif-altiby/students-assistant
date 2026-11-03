export type StudySessionStatus = 'COMPLETED' | 'UPCOMING' | 'IN_PROGRESS' | 'LATE';

export function getStudySessionStatus(
  completedAt: Date | null | undefined,
  sessionDateKey: string,
  todayKey: string
): StudySessionStatus {
  if (completedAt) return 'COMPLETED';
  if (sessionDateKey > todayKey) return 'UPCOMING';
  if (sessionDateKey === todayKey) return 'IN_PROGRESS';
  return 'LATE';
}
