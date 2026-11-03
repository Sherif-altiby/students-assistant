import { UnprocessableEntityError } from '../../utils/AppError';

const MILLISECONDS_PER_DAY = 86_400_000;
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const validTimezones = new Map<string, boolean>();

function getDateFormatter(timezone: string): Intl.DateTimeFormat {
  const cached = dateFormatters.get(timezone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  dateFormatters.set(timezone, formatter);
  return formatter;
}

export function dateKey(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function addCalendarDays(value: string, count: number): string {
  const date = utcDate(value);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function calendarDays(start: string, end: string): string[] {
  const result: string[] = [];
  for (let value = start; value <= end; value = addCalendarDays(value, 1)) result.push(value);
  return result;
}

export function dayCount(start: string, end: string): number {
  const startTime = Date.parse(`${start}T00:00:00.000Z`);
  const endTime = Date.parse(`${end}T00:00:00.000Z`);
  return Math.round((endTime - startTime) / MILLISECONDS_PER_DAY) + 1;
}

export function localDateKey(value: Date, timezone: string): string {
  const parts = getDateFormatter(timezone).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export interface MonthlyRange {
  startDate: string;
  endDate: string;
  month: number;
  year: number;
  monthStartDate: string;
  startsFromToday: boolean;
}

export function monthlyRange({
  month,
  year,
  timezone,
  now,
}: {
  month: number;
  year?: number;
  timezone: string;
  now: Date;
}): MonthlyRange {
  const today = localDateKey(now, timezone);
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const selectedYear = year ?? currentYear;
  const monthStartDate = `${selectedYear}-${String(month).padStart(2, '0')}-01`;

  if (selectedYear < currentYear || (selectedYear === currentYear && month < currentMonth)) {
    throw new UnprocessableEntityError('لا يمكن إنشاء جدول لشهر سابق', {
      code: 'PAST_MONTH',
      details: { month, year: selectedYear, currentMonth, currentYear },
    });
  }

  const nextMonthStart =
    month === 12
      ? `${selectedYear + 1}-01-01`
      : `${selectedYear}-${String(month + 1).padStart(2, '0')}-01`;
  const startsFromToday = selectedYear === currentYear && month === currentMonth;

  return {
    startDate: startsFromToday ? today : monthStartDate,
    endDate: addCalendarDays(nextMonthStart, -1),
    month,
    year: selectedYear,
    monthStartDate,
    startsFromToday,
  };
}

export function localWeekday(value: string): number {
  return utcDate(value).getUTCDay();
}

function utcDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }
  return date;
}

export function validateTimezone(timezone: string): boolean {
  const cached = validTimezones.get(timezone);
  if (cached !== undefined) return cached;

  try {
    getDateFormatter(timezone);
    validTimezones.set(timezone, true);
    return true;
  } catch {
    validTimezones.set(timezone, false);
    return false;
  }
}
