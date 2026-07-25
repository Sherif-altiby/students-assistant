"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { register } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type { RegisterPayload } from "@/types";
import { registerSchema } from "@/validations/auth";
import { ARAB_COUNTRIES } from "@/data/auth";
import { CustomSelect } from "@/components/ui/CustomSelect";

type RegisterFormErrors = Partial<Record<keyof RegisterPayload, string>>;

// Track options depend on the selected level.
const TRACK_OPTIONS_BY_LEVEL: Record<
  RegisterPayload["level"],
  { value: RegisterPayload["track"]; label: string }[]
> = {
  AZHARI_SECONDARY: [
    { value: "LITERATURE", label: "أدبي" },
    { value: "SCIENCE", label: "علمي" },
  ],
  GENERAL_SECONDARY: [
    { value: "SCIENCE_MATH", label: "علمي رياضة" },
    { value: "SCIENCE_SCIENCE", label: "علمي علوم" },
    { value: "LITERATURE", label: "أدبي" },
  ],
};

const initialForm: RegisterPayload = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "MALE",
  level: "AZHARI_SECONDARY",
  track: TRACK_OPTIONS_BY_LEVEL.AZHARI_SECONDARY[0].value,
  parentPhone: "",
  country: "egypt",
};

const inputClass = (hasError: boolean) =>
  `h-11 w-full rounded-[var(--radius-md)] border bg-input/30 px-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 ${hasError
    ? "border-destructive focus:ring-destructive/30"
    : "border-border focus:border-ring focus:ring-ring/30"
  }`;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [form, setForm] = useState<RegisterPayload>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const trackOptions = TRACK_OPTIONS_BY_LEVEL[form.level];

  function update<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // When the level changes, the previous track may no longer be valid
      // for the new level — fall back to that level's first option.
      if (key === "level") {
        const validTracks = TRACK_OPTIONS_BY_LEVEL[value as RegisterPayload["level"]];
        if (!validTracks.some((t) => t.value === prev.track)) {
          next.track = validTracks[0].value;
        }
      }

      return next;
    });

    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      if (key === "level") delete next.track;
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
          ? err.response?.data?.message ?? "تعذّر إنشاء الحساب، تحقق من البيانات"
          : "حدث خطأ غير متوقع، حاول مرة أخرى";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl rounded-lg border border-border p-4">
          {/* logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground   text-lg font-semibold">
              م
            </div>
            <span className="text-lg font-semibold text-foreground">مُذاكرة</span>
          </div>

          <h2 className="  text-2xl font-medium text-foreground text-center">
            أنشئ حسابك
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-center border-b pb-3">
            ابدأ في متابعة مذاكرتك من اليوم
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                الاسم بالكامل
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={!!fieldErrors.name}
                className={inputClass(!!fieldErrors.name)}
              />
              {fieldErrors.name && (
                <p className="text-xs text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@example.com"
                aria-invalid={!!fieldErrors.email}
                className={inputClass(!!fieldErrors.email)}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                aria-invalid={!!fieldErrors.password}
                className={inputClass(!!fieldErrors.password)}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  رقم الهاتف
                </label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  aria-invalid={!!fieldErrors.phone}
                  className={inputClass(!!fieldErrors.phone)}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="parentPhone" className="text-sm font-medium text-foreground">
                  هاتف ولي الأمر
                </label>
                <input
                  id="parentPhone"
                  value={form.parentPhone}
                  onChange={(e) => update("parentPhone", e.target.value)}
                  aria-invalid={!!fieldErrors.parentPhone}
                  className={inputClass(!!fieldErrors.parentPhone)}
                />
                {fieldErrors.parentPhone && (
                  <p className="text-xs text-destructive">{fieldErrors.parentPhone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="gender" className="text-sm font-medium text-foreground">
                  النوع
                </label>
                <CustomSelect
                  id="gender"
                  value={form.gender}
                  onChange={(v) => update("gender", v as RegisterPayload["gender"])}
                  hasError={!!fieldErrors.gender}
                  options={[
                    { value: "MALE", label: "ذكر" },
                    { value: "FEMALE", label: "أنثى" },
                  ]}
                />
                {fieldErrors.gender && (
                  <p className="text-xs text-destructive">{fieldErrors.gender}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="country" className="text-sm font-medium text-foreground">
                  الدولة
                </label>
                <CustomSelect
                  id="country"
                  value={form.country}
                  onChange={(v) => update("country", v)}
                  hasError={!!fieldErrors.country}
                  options={ARAB_COUNTRIES.map((c) => ({ value: c.value, label: c.label }))}
                />
                {fieldErrors.country && (
                  <p className="text-xs text-destructive">{fieldErrors.country}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="level" className="text-sm font-medium text-foreground">
                  المرحلة الدراسية
                </label>
                <CustomSelect
                  id="level"
                  value={form.level}
                  onChange={(v) => update("level", v as RegisterPayload["level"])}
                  hasError={!!fieldErrors.level}
                  options={[
                    { value: "AZHARI_SECONDARY", label: "الثانوية الأزهرية" },
                    { value: "GENERAL_SECONDARY", label: "الثانوية العامة" },
                  ]}
                />
                {fieldErrors.level && (
                  <p className="text-xs text-destructive">{fieldErrors.level}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="track" className="text-sm font-medium text-foreground">
                  الشعبة
                </label>
                <CustomSelect
                  id="track"
                  value={form.track}
                  onChange={(v) => update("track", v as RegisterPayload["track"])}
                  hasError={!!fieldErrors.track}
                  options={trackOptions}
                />
                {fieldErrors.track && (
                  <p className="text-xs text-destructive">{fieldErrors.track}</p>
                )}
              </div>
            </div>

            {formError && (
              <p className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isLoading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              إنشاء الحساب
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              سجّل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}