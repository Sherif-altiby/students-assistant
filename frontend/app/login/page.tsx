"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { user, accessToken } = await login({ email, password });
      setSession(user, accessToken);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message ?? "بيانات الدخول غير صحيحة"
          : "حدث خطأ غير متوقع، حاول مرة أخرى";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="سجّل الدخول لمتابعة تقدمك"
      subtitle="تابع مذاكرتك وعاداتك اليومية في مكان واحد"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="البريد الإلكتروني"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
        <Input
          label="كلمة المرور"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {error && (
          <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}
        <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
          دخول
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-medium text-emerald-600 hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </AuthShell>
  );
}
