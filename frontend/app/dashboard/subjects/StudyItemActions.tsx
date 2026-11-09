"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormInput } from "@/components/FormInput";
import MainButton from "@/components/ui/MainButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteStudyLesson,
  deleteStudySubject,
  deleteStudyUnit,
  updateStudyLesson,
  updateStudySubject,
  updateStudyUnit,
} from "@/lib/study-table";

type StudyItemType = "subject" | "unit" | "lesson";

const itemLabels: Record<StudyItemType, string> = {
  subject: "المادة",
  unit: "الوحدة",
  lesson: "الدرس",
};

interface StudyItemActionsProps {
  type: StudyItemType;
  id: string;
  title: string;
  subjectId: string;
}

export function StudyItemActions({
  type,
  id,
  title,
  subjectId,
}: StudyItemActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const label = itemLabels[type];
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(title);
  const [isPending, setIsPending] = useState(false);

  async function refreshSubjectData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["study-subjects"] }),
      queryClient.invalidateQueries({ queryKey: ["study-subject", subjectId] }),
      queryClient.invalidateQueries({ queryKey: ["study-subject-catalog"] }),
      queryClient.invalidateQueries({ queryKey: ["study-tables"] }),
      queryClient.invalidateQueries({ queryKey: ["study-table-progress"] }),
    ]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = value.trim();
    if (!nextTitle || nextTitle === title) return;

    setIsPending(true);
    try {
      if (type === "subject") await updateStudySubject(id, nextTitle);
      else if (type === "unit") await updateStudyUnit(id, nextTitle);
      else await updateStudyLesson(id, nextTitle);

      await refreshSubjectData();
      toast.success(`تم تعديل اسم ${label}`);
      setOpen(false);
    } catch {
      toast.error(`تعذر تعديل ${label}. حاول مرة أخرى.`);
    } finally {
      setIsPending(false);
    }
  }

  async function remove() {
    try {
      if (type === "subject") await deleteStudySubject(id);
      else if (type === "unit") await deleteStudyUnit(id);
      else await deleteStudyLesson(id);

      await refreshSubjectData();
      toast.success(`تم حذف ${label}`);
      if (type === "subject") router.push("/dashboard/subjects");
    } catch {
      toast.error(`تعذر حذف ${label}. حاول مرة أخرى.`);
    }
  }

  const deleteDescription =
    type === "subject"
      ? "سيؤدي حذف المادة إلى حذف وحداتها ودروسها وسجلات التقدم والجلسات المرتبطة بها."
      : type === "unit"
        ? "سيؤدي حذف الوحدة إلى حذف جميع دروسها وسجلات التقدم والجلسات المرتبطة بها."
        : "سيؤدي حذف الدرس إلى حذف سجلات التقدم والجلسات المرتبطة به.";

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (isPending) return;
          setOpen(nextOpen);
          if (nextOpen) setValue(title);
        }}
      >
        <MainButton
          title={`تعديل ${label}`}
          icon={<Pencil aria-hidden="true" />}
          iconOnly
          variant="outline"
          size="icon-sm"
          aria-label={`تعديل ${label} ${title}`}
          onClick={() => {
            setValue(title);
            setOpen(true);
          }}
        />
        <DialogContent dir="rtl" closeButtonClassName="right-auto left-2">
          <DialogHeader>
            <DialogTitle>تعديل اسم {label}</DialogTitle>
            <DialogDescription>
              أدخل الاسم الجديد ثم احفظ التغييرات.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <FormInput
              label={`اسم ${label}`}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={type === "lesson" ? 500 : 255}
              required
              autoFocus
            />
            <DialogFooter>
              <MainButton
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
                title="إلغاء"
              />
              <MainButton
                type="submit"
                title="حفظ التغييرات"
                loading={isPending}
                disabled={!value.trim() || value.trim() === title}
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        trigger={
          <MainButton
            title={`حذف ${label}`}
            icon={<Trash2 aria-hidden="true" />}
            iconOnly
            variant="destructive"
            size="icon-sm"
            aria-label={`حذف ${label} ${title}`}
          />
        }
        title={`حذف ${label}؟`}
        description={deleteDescription}
        confirmLabel="حذف"
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}
