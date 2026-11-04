const arabicRelativeTime = new Intl.RelativeTimeFormat("ar-EG", {
  numeric: "auto",
});

export function formatArabicNumber(value: number) {
  return value.toLocaleString("ar-EG");
}

export function getLocalDayDifference(value: string | Date) {
  const date = new Date(value);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - date.getTime()) / 86_400_000);
}

export function isSameLocalDay(value: string | Date) {
  return getLocalDayDifference(value) === 0;
}

export function isBeforeLocalToday(value: string | Date) {
  return getLocalDayDifference(value) > 0;
}

export function formatArabicRelativeDate(value: string | Date) {
  const days = getLocalDayDifference(value);
  if (days <= 0) return "اليوم";
  if (days < 30) return arabicRelativeTime.format(-days, "day");
  if (days < 365) return arabicRelativeTime.format(-Math.floor(days / 30), "month");
  return arabicRelativeTime.format(-Math.floor(days / 365), "year");
}

export function formatArabicDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
) {
  return new Date(value).toLocaleDateString("ar-EG", options);
}

export function getSubjectColor(name: string) {
  let hue = 0;
  for (const char of name) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hue} 55% 48%)`;
}
