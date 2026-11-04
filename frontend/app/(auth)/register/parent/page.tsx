"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { registerParent } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { parentRegisterSchema, type ParentRegisterValues } from "@/validations/parent-auth";
import { FormInput } from "@/components/FormInput";
import MainButton from "@/components/ui/MainButton";

const INITIAL_VALUES: ParentRegisterValues = {
  name: "",
  email: "",
  password: "",
  phone: "",
};

export default function ParentRegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof ParentRegisterValues, string>>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof ParentRegisterValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const parsed = parentRegisterSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ParentRegisterValues;
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const { user, accessToken } = await registerParent(parsed.data);
      setSession(user, accessToken);
      router.replace("/parent");
    } catch (error) {
      setFormError(
        error instanceof AxiosError
          ? error.response?.data?.message ?? "تعذر إنشاء الحساب"
          : "حدث خطأ غير متوقع، حاول مرة أخرى",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8">
        <Link href="/login" className="text-sm font-bold text-primary">
          مُذاكرة
        </Link>
        <h1 className="mt-6 text-center text-2xl font-bold text-foreground">
          إنشاء حساب ولي أمر
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
          بعد التسجيل أرسل طلب ربط باستخدام بريد الطالب. لن يظهر تقدمه لك إلا
          بعد موافقته.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <FormInput
            label="الاسم بالكامل"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            error={errors.name}
            required
            autoComplete="name"
          />
          <FormInput
            label="البريد الإلكتروني"
            type="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            error={errors.email}
            required
            autoComplete="email"
            dir="ltr"
          />
          <FormInput
            label="رقم الهاتف المسجل لدى الطالب"
            type="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            error={errors.phone}
            hint="يجب أن يطابق رقم ولي الأمر الموجود في حساب الطالب."
            required
            autoComplete="tel"
            dir="ltr"
          />
          <FormInput
            label="كلمة المرور"
            type="password"
            value={values.password}
            onChange={(event) => updateField("password", event.target.value)}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          {formError && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </p>
          )}
          <MainButton
            type="submit"
            title="إنشاء حساب ولي أمر"
            loading={isSubmitting}
            loadingTitle="جارٍ إنشاء الحساب..."
            fullWidth
          />
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          لديك حساب؟{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            سجّل الدخول
          </Link>
        </p>
      </section>
    </main>
  );
}
