"use client";

import { useState } from "react";
import Link from "next/link";
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

// Track options depend on the selected level.
const TRACK_OPTIONS_BY_LEVEL: Record<
  RegisterPayload["level"],
  { value: RegisterPayload["track"]; label: string }[]
> = {
  SECONDARY_AZHARI: [
    { value: "LITERARY", label: "أدبي" },
    { value: "SCIENCE", label: "علمي" },
  ],
  SECONDARY_GENERAL: [
    { value: "SCIENCE_MATH", label: "علمي رياضة" },
    { value: "SCIENCE_SCIENCE", label: "علمي علوم" },
    { value: "LITERARY", label: "أدبي" },
  ],
};

const initialForm: RegisterPayload = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "MALE",
  level: "SECONDARY_AZHARI",
  track: TRACK_OPTIONS_BY_LEVEL.SECONDARY_AZHARI[0].value,
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

  const trackOptions = TRACK_OPTIONS_BY_LEVEL[form.level];

  function update<K extends keyof RegisterPayload>(
    key: K,
    value: RegisterPayload[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // When the level changes, the previous track may no longer be valid
      // for the new level — fall back to that level's first option.
      if (key === "level") {
        const validTracks =
          TRACK_OPTIONS_BY_LEVEL[value as RegisterPayload["level"]];
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
          ? (err.response?.data?.message ??
            "تعذّر إنشاء الحساب، تحقق من البيانات")
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
            <span className="text-lg font-semibold text-foreground">
              مُذاكرة
            </span>
          </div>

          <h2 className="  text-2xl font-medium text-foreground text-center">
            أنشئ حسابك
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-center border-b pb-3">
            ابدأ في متابعة مذاكرتك من اليوم
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 flex flex-col gap-5"
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

            <div className="grid grid-cols-2 gap-4">
              <FormCustomSelect
                id="level"
                label="المرحلة الدراسية"
                value={form.level}
                onChange={(value) => update("level", value)}
                required
                error={fieldErrors.level}
                options={[
                  { value: "SECONDARY_AZHARI", label: "الثانوية الأزهرية" },
                  { value: "SECONDARY_GENERAL", label: "الثانوية العامة" },
                ]}
              />
              <FormCustomSelect
                id="track"
                label="الشعبة"
                value={form.track}
                onChange={(value) => update("track", value)}
                required
                error={fieldErrors.track}
                options={trackOptions}
              />
            </div>

            {formError && (
              <p className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
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

          <p className="mt-8 text-center text-sm text-muted-foreground">
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
        </div>
      </div>
    </div>
  );
}
