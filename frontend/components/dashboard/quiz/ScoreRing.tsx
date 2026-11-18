import type { ScoreTone } from "@/lib/quiz-utils";

const STROKE: Record<ScoreTone, string> = {
  low: "stroke-destructive",
  mid: "stroke-amber-500",
  high: "stroke-green-500",
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreRing({
  percentage,
  tone,
}: {
  percentage: number;
  tone: ScoreTone;
}) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={`النتيجة ${clamped}%`}
      >
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
          className={`${STROKE[tone]} transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-foreground">
        {clamped}%
      </span>
    </div>
  );
}