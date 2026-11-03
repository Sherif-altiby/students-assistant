import type { StudySubjectDetails } from "@/types/study-table";

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

export function getLessons(subject: StudySubjectDetails) {
  return subject.units
    .slice()
    .sort(
      (left, right) =>
        left.order - right.order || left.id.localeCompare(right.id),
    )
    .flatMap((unit) =>
      unit.lessons
        .slice()
        .sort(
          (left, right) =>
            left.order - right.order || left.id.localeCompare(right.id),
        )
        .map((lesson) => ({
          id: lesson.id,
          title: `${unit.title} — ${lesson.title}`,
        })),
    );
}
