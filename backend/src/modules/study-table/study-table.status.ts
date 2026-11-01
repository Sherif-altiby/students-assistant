import { dateKey, localDateKey } from './date-time';

export type StudySessionStatus = 'COMPLETED' | 'UPCOMING' | 'IN_PROGRESS' | 'LATE';

export function getStudySessionStatus(
  session: { completedAt?: Date | null },
  dayDate: Date | string,
  timezone: string,
  now = new Date(),
): StudySessionStatus {
  if (session.completedAt) return 'COMPLETED';
  const sessionDate = dateKey(dayDate);
  const today = localDateKey(now, timezone);
  if (sessionDate > today) return 'UPCOMING';
  if (sessionDate === today) return 'IN_PROGRESS';
  return 'LATE';
}
