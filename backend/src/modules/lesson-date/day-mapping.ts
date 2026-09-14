// src/modules/lesson-date/day-mapping.ts
//
// The DB/enum layer speaks English (DayOfWeek), the UI speaks Arabic day
// names. This is the single source of truth for translating between them
// so the mapping never drifts between the schema, service, and frontend.

import { DayOfWeek } from '@prisma/client';

export const DAY_AR_TO_EN: Record<string, DayOfWeek> = {
  'الأحد': DayOfWeek.SUNDAY,
  'الإثنين': DayOfWeek.MONDAY,
  'الثلاثاء': DayOfWeek.TUESDAY,
  'الأربعاء': DayOfWeek.WEDNESDAY,
  'الخميس': DayOfWeek.THURSDAY,
  'الجمعة': DayOfWeek.FRIDAY,
  'السبت': DayOfWeek.SATURDAY,
};

export const DAY_EN_TO_AR: Record<DayOfWeek, string> = {
  [DayOfWeek.SUNDAY]: 'الأحد',
  [DayOfWeek.MONDAY]: 'الإثنين',
  [DayOfWeek.TUESDAY]: 'الثلاثاء',
  [DayOfWeek.WEDNESDAY]: 'الأربعاء',
  [DayOfWeek.THURSDAY]: 'الخميس',
  [DayOfWeek.FRIDAY]: 'الجمعة',
  [DayOfWeek.SATURDAY]: 'السبت',
};

// Order used for sorting a weekly schedule Sunday -> Saturday
// (matches the Egyptian/Arabic week, same as the existing UI's <select>).
export const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export const ARABIC_DAY_NAMES = Object.keys(DAY_AR_TO_EN);