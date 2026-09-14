// lib/day-mapping.ts
//
// Frontend mirror of the backend's day-mapping.ts. Keep the Arabic labels
// identical on both sides — the API round-trips them as plain strings.

export const ARABIC_DAYS_ORDERED = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

export type ArabicDayName = (typeof ARABIC_DAYS_ORDERED)[number];

export function dayIndex(dayName: string): number {
  const idx = ARABIC_DAYS_ORDERED.indexOf(dayName as ArabicDayName);
  return idx === -1 ? ARABIC_DAYS_ORDERED.length : idx;
}