"use client";

import { useEffect, useRef } from "react";

interface ConfirmSubmitDialogProps {
  open: boolean;
  total: number;
  unansweredNumbers: number[];
  onCancel: () => void;
  onConfirm: () => void;
}

// Native <dialog>: the browser handles focus trapping and the Escape key
export function ConfirmSubmitDialog({
  open,
  total,
  unansweredNumbers,
  onCancel,
  onConfirm,
}: ConfirmSubmitDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const unanswered = unansweredNumbers.length;

  return (
    <dialog
      ref={ref}
      dir="rtl"
      aria-labelledby="confirm-submit-title"
      onClose={onCancel}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-border bg-card p-5 text-foreground backdrop:bg-black/50"
    >
      <h2 id="confirm-submit-title" className="text-base font-bold">
        تسليم الكويز؟
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {unanswered === 0
          ? `أجبت عن كل الأسئلة (${total}). بعد التسليم تظهر نتيجتك فورًا.`
          : `ما زال عندك ${unanswered} من ${total} بدون إجابة (سؤال ${unansweredNumbers.join("، ")}). الأسئلة التي لم تجب عنها تُحسب خطأ.`}
      </p>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
        >
          العودة للأسئلة
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
        >
          تسليم الآن
        </button>
      </div>
    </dialog>
  );
}