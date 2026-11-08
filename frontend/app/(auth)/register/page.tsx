"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { register } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type { RegisterPayload } from "@/types";
import { registerSchema } from "@/validations/auth";
import { ARAB_COUNTRIES } from "@/data/auth";
import { FormInput } from "@/components/FormInput";
import { FormCustomSelect } from "@/components/FormCustomSelect";
import MainButton from "@/components/ui/MainButton";
import { Button } from "@/components/ui/button";

type RegisterFormErrors = Partial<Record<keyof RegisterPayload, string>>;

const initialForm: RegisterPayload = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "MALE",
  parentPhone: "",
  country: "egypt",
};

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [form, setForm] = useState<RegisterPayload>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function update<K extends keyof RegisterPayload>(
    key: K,
    value: RegisterPayload[K],
  ) {
    setForm((prev) => {
      return { ...prev, [key]: value };
    });

    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const errors: RegisterFormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RegisterPayload;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    try {
      const { user, accessToken } = await register(result.data);
      setSession(user, accessToken);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ??
            "تعذّر إنشاء الحساب، تحقق من البيانات")
          : "حدث خطأ غير متوقع، حاول مرة أخرى";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
        <Link
          href="/"
          className="mb-8 flex w-fit items-center gap-3"
          aria-label="مُذاكرة - الصفحة الرئيسية"
        >
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            priority
            className="h-11 w-11 rounded-xl object-contain"
          />
          <span className="text-lg font-bold text-foreground">مُذاكرة</span>
        </Link>

        <h1 className="text-center text-2xl font-bold text-foreground">
          أنشئ حسابك
        </h1>
        <p className="mt-2 border-b border-border pb-4 text-center text-sm leading-6 text-muted-foreground">
          ابدأ في متابعة مذاكرتك من اليوم
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
            <FormInput
              id="name"
              label="الاسم بالكامل"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              startIcon={<UserRound />}
              autoComplete="name"
              required
              error={fieldErrors.name}
            />

            <FormInput
              id="email"
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              startIcon={<Mail />}
              dir="ltr"
              required
              error={fieldErrors.email}
            />

            <FormInput
              id="password"
              label="كلمة المرور"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              startIcon={<LockKeyhole />}
              dir="ltr"
              required
              error={fieldErrors.password}
              endAdornment={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </Button>
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="phone"
                label="رقم الهاتف"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                startIcon={<Phone />}
                dir="ltr"
                autoComplete="tel"
                required
                error={fieldErrors.phone}
              />
              <FormInput
                id="parentPhone"
                label="هاتف ولي الأمر"
                type="tel"
                value={form.parentPhone}
                onChange={(e) => update("parentPhone", e.target.value)}
                startIcon={<Phone />}
                dir="ltr"
                required
                error={fieldErrors.parentPhone}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormCustomSelect
                id="gender"
                label="النوع"
                value={form.gender}
                onChange={(value) => update("gender", value)}
                required
                error={fieldErrors.gender}
                options={[
                  { value: "MALE", label: "ذكر" },
                  { value: "FEMALE", label: "أنثى" },
                ]}
              />
              <FormCustomSelect
                id="country"
                label="الدولة"
                value={form.country}
                onChange={(value) => update("country", value)}
                required
                error={fieldErrors.country}
                options={ARAB_COUNTRIES.map((country) => ({
                  value: country.value,
                  label: country.label,
                }))}
              />
            </div>

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          <MainButton
            type="submit"
            title="إنشاء الحساب"
            loading={isLoading}
            loadingTitle="جارٍ إنشاء الحساب..."
            fullWidth
            className="mt-2"
          />
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            سجّل الدخول
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          ولي أمر؟{" "}
          <Link
            href="/register/parent"
            className="font-medium text-primary hover:underline"
          >
            إنشاء حساب ولي أمر
          </Link>
        </p>
      </section>
    </main>
  );
}
