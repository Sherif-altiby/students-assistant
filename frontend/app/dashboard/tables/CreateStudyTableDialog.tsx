"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateStudyTablePayload, StudyTableType } from "@/types/study-table";

interface CreateStudyTableDialogProps {
  onCreate: (payload: CreateStudyTablePayload) => void;
  isCreating: boolean;
}

export function CreateStudyTableDialog({ onCreate, isCreating }: CreateStudyTableDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudyTableType>("DATE_RANGE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numberOfDays, setNumberOfDays] = useState("7");

  function reset() {
    setTitle("");
    setType("DATE_RANGE");
    setStartDate("");
    setEndDate("");
    setNumberOfDays("7");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateStudyTablePayload =
      type === "DATE_RANGE"
        ? { title: title.trim(), type, startDate, endDate }
        : { title: title.trim(), type, numberOfDays: Number(numberOfDays) };

    onCreate(payload);
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger  >
        <Button>
          <Plus className="h-4 w-4" />
          جدول مذاكرة جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء جدول مذاكرة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label htmlFor="table-title" className="text-sm font-medium text-foreground">
              عنوان الجدول
            </label>
            <Input
              id="table-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: جدول مراجعة الفصل الدراسي"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">نوع الجدول</label>
            <Select value={type} onValueChange={(v) => setType(v as StudyTableType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DATE_RANGE">فترة زمنية (تاريخ البداية والنهاية)</SelectItem>
                <SelectItem value="NUMBER_OF_DAYS">عدد أيام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "DATE_RANGE" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="start-date" className="text-sm font-medium text-foreground">
                  تاريخ البداية
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="end-date" className="text-sm font-medium text-foreground">
                  تاريخ النهاية
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="number-of-days" className="text-sm font-medium text-foreground">
                عدد الأيام
              </label>
              <Input
                id="number-of-days"
                type="number"
                min={1}
                value={numberOfDays}
                onChange={(e) => setNumberOfDays(e.target.value)}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isCreating || !title.trim()}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء الجدول
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}