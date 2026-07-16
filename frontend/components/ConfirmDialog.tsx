"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  onConfirm,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger >{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm rounded-2xl border-none shadow-2xl p-6">
        <AlertDialogHeader className="flex flex-col items-center text-center gap-3 sm:text-center">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              destructive
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            {destructive ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Info className="h-6 w-6" />
            )}
          </div>

          <AlertDialogTitle className="text-lg font-semibold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground text-right leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex flex-row-reverse gap-2 sm:flex-row-reverse">
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "flex-1 rounded-lg font-medium",
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/50"
                : ""
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel className="flex-1 rounded-lg font-medium mt-0">
            {cancelLabel}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}