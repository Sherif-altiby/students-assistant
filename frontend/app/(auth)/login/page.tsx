"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { z } from "zod";
import { login } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { loginSchema } from "@/validations/auth";
import { FormInput } from "@/components/FormInput";
import MainButton from "@/components/ui/MainButton";
import { Button } from "@/components/ui/button";

const roleRoutes = {
  USER: "/dashboard",
  ADMIN: "/admin",
  DOCTOR: "/doctor",
  PARENT: "/parent",
};

type LoginFormValues = z.infer<typeof loginSchema>;
type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function clearFieldError(key: keyof LoginFormValues) {
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

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: LoginFormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoginFormValues;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    try {
      const { user, accessToken } = await login(result.data);
      setSession(user, accessToken);
      const redirectPath =
        roleRoutes[user.role as keyof typeof roleRoutes] || "/dashboard";
      router.push(redirectPath);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "بيانات الدخول غير صحيحة")
          : "حدث خطأ غير متوقع، حاول مرة أخرى";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
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
          سجّل الدخول لمتابعة تقدمك
        </h1>
        <p className="mt-2 border-b border-border pb-4 text-center text-sm leading-6 text-muted-foreground">
          سعداء بعودتك. أدخل بياناتك للمتابعة من حيث توقفت.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <FormInput
            id="email"
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            placeholder="name@example.com"

            autoComplete="email"
            startIcon={<Mail />}
            dir="ltr"
            required
            error={fieldErrors.email}
          />

          <div className="space-y-2">
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
            <FormInput
              id="password"
              label="كلمة المرور"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              placeholder="••••••••"
              autoComplete="current-password"
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
            title="دخول"
            loading={isLoading}
            loadingTitle="جارٍ تسجيل الدخول..."
            fullWidth
            className="mt-2"
          />
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            إنشاء حساب جديد
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
