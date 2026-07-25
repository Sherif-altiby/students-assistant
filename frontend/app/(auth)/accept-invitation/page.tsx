// app/accept-invitation/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { z } from "zod";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { acceptInvitationSchema } from "@/validations/auth";

type AcceptInvitationFormValues = z.infer<typeof acceptInvitationSchema>;
type AcceptInvitationFormErrors = Partial<Record<keyof AcceptInvitationFormValues, string>>;

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AcceptInvitationFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function clearFieldError(key: keyof AcceptInvitationFormValues) {
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

    // Validate with Zod
    const result = acceptInvitationSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const errors: AcceptInvitationFormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof AcceptInvitationFormValues;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      // Make POST request to /accept-invitation with token and password
      await api.post("users/accept-invitation", {
        token,
        password,
      });

      // Redirect to login page after successful password setup
      router.push("/login?invitation=accepted");
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message ?? "حدث خطأ، حاول مرة أخرى"
          : "حدث خطأ غير متوقع، حاول مرة أخرى";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // Show error if token is missing
  if (!token) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center px-6">
        <div className="w-full max-w-md rounded-lg border border-border p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 8v5M12 16v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">رابط الدعوة غير صالح</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            رابط الدعوة غير صالح أو منتهي الصلاحية. يرجى التواصل مع المرسل.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            العودة إلى تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-lg border border-border p-4">
          {/* logo */}
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-serif text-lg font-semibold">
              م
            </div>
            <span className="text-lg font-semibold text-foreground">مُذاكرة</span>
          </div>

          <h2 className="  text-2xl font-medium text-foreground text-center">
            تعيين كلمة المرور
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-center border-b pb-3">
            تمت دعوتك للانضمام إلى منصة مُذاكرة. يرجى تعيين كلمة مرور لحسابك.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                كلمة المرور
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  className={`h-11 w-full rounded-[var(--radius-md)] border bg-input/30 px-3.5 pl-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 ${
                    fieldErrors.password
                      ? "border-destructive focus:ring-destructive/30"
                      : "border-input focus:border-ring focus:ring-ring/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.3A10.7 10.7 0 0112 5c5.5 0 9.3 4 10.5 7-.4 1-1 2-1.8 2.9M6.6 6.6C4.5 8 3 10 2 12c1.2 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12c1.2-3.5 5-7 10-7s8.8 3.5 10 7c-1.2 3.5-5 7-10 7s-8.8-3.5-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError("confirmPassword");
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.confirmPassword}
                  className={`h-11 w-full rounded-[var(--radius-md)] border bg-input/30 px-3.5 pl-11 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 ${
                    fieldErrors.confirmPassword
                      ? "border-destructive focus:ring-destructive/30"
                      : "border-input focus:border-ring focus:ring-ring/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.3A10.7 10.7 0 0112 5c5.5 0 9.3 4 10.5 7-.4 1-1 2-1.8 2.9M6.6 6.6C4.5 8 3 10 2 12c1.2 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12c1.2-3.5 5-7 10-7s8.8 3.5 10 7c-1.2 3.5-5 7-10 7s-8.8-3.5-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Form Error */}
            {formError && (
              <p className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {formError}
              </p>
            )}

            {/* Submit Button */}
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
              تعيين كلمة المرور
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <a href="/login" className="font-medium text-primary hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}