import {
  DOCTOR_RATING_EMPTY_INITIAL,
  DOCTOR_SESSION_LABELS,
} from "@/constants";

const SESSION_DATE_FORMATTER = new Intl.DateTimeFormat("ar-EG", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const SESSION_TIME_FORMATTER = new Intl.DateTimeFormat("ar-EG", {
  hour: "numeric",
  minute: "2-digit",
});

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getDoctorInitial(name: string) {
  return name.trim().split(/\s+/)[0]?.charAt(0) || DOCTOR_RATING_EMPTY_INITIAL;
}

export function formatDoctorSessionDate(startTime: string) {
  const date = new Date(startTime);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (localDateKey(date) === localDateKey(today)) {
    return DOCTOR_SESSION_LABELS.today;
  }
  if (localDateKey(date) === localDateKey(tomorrow)) {
    return DOCTOR_SESSION_LABELS.tomorrow;
  }

  return SESSION_DATE_FORMATTER.format(date);
}

export function formatDoctorSessionTime(startTime: string, endTime: string) {
  return `${SESSION_TIME_FORMATTER.format(new Date(startTime))} - ${SESSION_TIME_FORMATTER.format(new Date(endTime))}`;
}
