export function formatShortDate(dateIso: string): string {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short" }).format(
    new Date(dateIso),
  );
}

export function formatDayHeading(dateIso: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(dateIso));
}