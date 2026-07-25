"use client";

import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface Rating {
  id: string;
  name: string;
  score: number; // 1-5
  comment: string;
}

interface RatingsMarqueeProps {
  ratings: Rating[];
  /** Seconds for one full loop. Lower = faster. Default 35s. */
  speed?: number;
}

function initials(name: string) {
  return name.trim().split(" ")[0]?.charAt(0) ?? "؟";
}

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < score
              ? "h-3.5 w-3.5 fill-primary text-primary"
              : "h-3.5 w-3.5 text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

function RatingCard({ rating }: { rating: Rating }) {
  return (
    <Card className="h-full w-80 shrink-0 border-border bg-muted/40 shadow-none">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarFallback className="bg-card text-foreground text-xs">
            {initials(rating.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-sm font-medium text-foreground">
            {rating.name}
          </CardTitle>
          <StarRow score={rating.score} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {rating.comment}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Auto-scrolling, infinite ratings ticker.
 * - RTL-aware: track slides from left to right (natural reading direction in RTL).
 * - Pauses on hover/focus so comments stay readable.
 * - Content is duplicated once to create a seamless loop (translate -50% of a
 *   double-width track lands exactly back on the start of the first copy).
 * - Respects prefers-reduced-motion by disabling the animation entirely.
 */
export function RatingsMarquee({ ratings, speed = 35 }: RatingsMarqueeProps) {
  if (ratings.length === 0) return null;

  return (
    <div
      className="group relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      dir="rtl"
    >
      <div
        className="flex w-max gap-4 motion-safe:animate-[marquee_var(--marquee-duration)_linear_infinite] motion-safe:group-hover:[animation-play-state:paused] motion-safe:group-focus-within:[animation-play-state:paused]"
        style={{ ["--marquee-duration" as string]: `${speed}s` }}
      >
        {[...ratings, ...ratings].map((rating, i) => (
          <RatingCard key={`${rating.id}-${i}`} rating={rating} />
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(50%);
          }
        }
      `}</style>
    </div>
  );
}