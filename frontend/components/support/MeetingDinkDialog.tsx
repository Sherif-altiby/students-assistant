"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2 } from "lucide-react";

interface MeetingLinkDialogProps {
  trigger: ReactNode;
  currentLink?: string | null;
  isSubmitting?: boolean;
  onSubmit: (meetingLink: string) => void;
}

export function MeetingLinkDialog({
  trigger,
  currentLink,
  isSubmitting,
  onSubmit,
}: MeetingLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(currentLink ?? "");

  useEffect(() => {
    if (open) setLink(currentLink ?? "");
  }, [open, currentLink]);

  const canSubmit = link.trim().length > 0 && !isSubmitting;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(link.trim());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>رابط الجلسة</DialogTitle>
          <DialogDescription>
            أضف رابط الاجتماع الذي سيستخدمه المريض للانضمام إلى الجلسة.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="meeting-link">الرابط</Label>
          <Input
            id="meeting-link"
            type="url"
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="me-2 h-4 w-4" />
            )}
            حفظ الرابط
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}