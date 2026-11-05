"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { ADMIN_USERS_QUERY_KEY } from "@/constants";
import { createDoctor, type AdminUser } from "@/lib/admin";

export function DoctorCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const createMutation = useMutation({
    mutationFn: createDoctor,
    onSuccess: async () => {
      toast.success("تم إنشاء حساب الطبيب بنجاح.");
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
    onError: () =>
      toast.error("تعذر إنشاء حساب الطبيب. تحقق من البيانات وحاول مرة أخرى."),
  });

  useEffect(() => {
    if (open) setValues({ name: "", email: "", password: "" });
  }, [open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!createMutation.isPending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent closeButtonClassName="right-auto left-2">
        <DialogHeader>
          <DialogTitle>إنشاء حساب طبيب</DialogTitle>
          <DialogDescription>
            أدخل بيانات الحساب وكلمة المرور. سيتم إنشاء الحساب نشطًا دون إرسال
            رسالة تفعيل.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          <FormInput
            label="اسم الطبيب"
            autoComplete="name"
            required
            minLength={2}
            value={values.name}
            onChange={(event) =>
              setValues({ ...values, name: event.target.value })
            }
          />
          <FormInput
            label="البريد الإلكتروني"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            value={values.email}
            onChange={(event) =>
              setValues({ ...values, email: event.target.value })
            }
          />
          <FormInput
            label="كلمة المرور"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            required
            minLength={8}
            value={values.password}
            onChange={(event) =>
              setValues({ ...values, password: event.target.value })
            }
          />
          <DialogFooter>
            <MainButton
              type="button"
              variant="outline"
              title="إلغاء"
              disabled={createMutation.isPending}
              onClick={() => onOpenChange(false)}
              className="h-10 sm:w-36"
            />
            <MainButton
              type="submit"
              title="إنشاء الحساب"
              loading={createMutation.isPending}
              loadingTitle="جارٍ الإنشاء..."
              className="h-10 sm:w-36"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DoctorDeleteDialog({
  doctor,
  pending,
  onConfirm,
  onCancel,
}: {
  doctor: AdminUser | null;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={!!doctor}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onCancel();
      }}
    >
      <DialogContent closeButtonClassName="right-auto left-2">
        <DialogHeader>
          <DialogTitle>حذف حساب الطبيب</DialogTitle>
          <DialogDescription>
            سيتم حذف حساب «{doctor?.name}» نهائيًا ولا يمكن التراجع عن ذلك.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <MainButton
            type="button"
            variant="outline"
            title="إلغاء"
            disabled={pending}
            onClick={onCancel}
            className="h-10 sm:w-36"
          />
          <MainButton
            type="button"
            variant="destructive"
            title="حذف الحساب"
            loading={pending}
            loadingTitle="جارٍ الحذف..."
            onClick={onConfirm}
            className="h-10 sm:w-36"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
