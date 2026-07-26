"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";

interface RatingDialogProps {
  trigger: ReactNode;
  isSubmitting?: boolean;
  onSubmit: (score: number) => void;
}

export function RatingDialog({
  trigger,
  isSubmitting,
  onSubmit,
}: RatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setScore(0);
      setHovered(0);
    }
  }

  function handleSubmit() {
    if (score === 0 || isSubmitting) return;
    onSubmit(score);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>قيّم الجلسة</DialogTitle>
          <DialogDescription>
            ساعدنا في تحسين الخدمة بتقييم جلستك مع الطبيب.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1 py-4" dir="ltr">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} من 5`}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setScore(value)}
              className="p-1"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hovered || score) >= value
                    ? "fill-primary text-primary"
                    : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={score === 0 || isSubmitting}
          >
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            إرسال التقييم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
