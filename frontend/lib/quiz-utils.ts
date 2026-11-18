export function toPercent(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export type ScoreTone = "low" | "mid" | "high";

export function scoreTone(percent: number): ScoreTone {
  if (percent < 50) return "low";
  if (percent < 80) return "mid";
  return "high";
}

// The label is shown next to the number, so the meaning never depends on color alone
export const TONE_LABEL: Record<ScoreTone, string> = {
  low: "يحتاج مراجعة",
  mid: "جيد",
  high: "ممتاز",
};

export const TONE_STYLE: Record<ScoreTone, string> = {
  low: "bg-destructive/10 text-destructive",
  mid: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "bg-green-500/10 text-green-700 dark:text-green-400",
};

export function formatQuizDate(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
  }).format(new Date(value));
}