"use client";

import { useState, type ReactElement } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";

interface RatingDialogProps {
  trigger: ReactElement;
  isSubmitting?: boolean;
  onSubmit: (score: number, comment: string) => void;
}

export function RatingDialog({
  trigger,
  isSubmitting,
  onSubmit,
}: RatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setScore(0);
      setHovered(0);
      setComment("");
    }
  }

  function handleSubmit() {
    if (score === 0 || isSubmitting) return;
    onSubmit(score, comment.trim());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
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

        <div className="grid gap-2">
          <Label htmlFor="session-rating-comment">رأيك (اختياري)</Label>
          <Textarea
            id="session-rating-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            placeholder="شاركنا تجربتك مع الطبيب"
            className="min-h-24 resize-y py-3"
          />
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
