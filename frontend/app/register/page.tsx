"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { AuthShell } from "@/components/AuthShell";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { register } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import type { RegisterPayload } from "@/types";

const initialForm: RegisterPayload = {
  name: "",
  email: "",
  password: "",
  phone: "",
  gender: "MALE",
  level: "AZHARI_SECONDARY",
  track: "SCIENCE",
  parentPhone: "",
  country: "egypt",
};

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [form, setForm] = useState<RegisterPayload>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function update<K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const { user, accessToken } = await register(form);
      setSession(user, accessToken);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message ?? "تعذّر إنشاء الحساب، تحقق من البيانات"
          : "حدث خطأ غير متوقع، حاول مرة أخرى";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell title="أنشئ حسابك" subtitle="ابدأ في متابعة مذاكرتك من اليوم">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="الاسم بالكامل"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <Input
          label="البريد الإلكتروني"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <Input
          label="كلمة المرور"
          type="password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="رقم الهاتف"
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <Input
            label="هاتف ولي الأمر"
            required
            value={form.parentPhone}
            onChange={(e) => update("parentPhone", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="النوع"
            value={form.gender}
            onChange={(e) => update("gender", e.target.value as RegisterPayload["gender"])}
            options={[
              { value: "MALE", label: "ذكر" },
              { value: "FEMALE", label: "أنثى" },
            ]}
          />
          <Input
            label="الدولة"
            required
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="المرحلة الدراسية"
            value={form.level}
            onChange={(e) => update("level", e.target.value as RegisterPayload["level"])}
            options={[
              { value: "AZHARI_SECONDARY", label: "الثانوية الأزهرية" },
              { value: "GENERAL_SECONDARY", label: "الثانوية العامة" },
            ]}
          />
          <Select
            label="الشعبة"
            value={form.track}
            onChange={(e) => update("track", e.target.value as RegisterPayload["track"])}
            options={[
              { value: "SCIENCE", label: "علمي" },
              { value: "LITERATURE", label: "أدبي" },
              { value: "MATH", label: "رياضة" },
            ]}
          />
        </div>
        {error && (
          <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}
        <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
          إنشاء الحساب
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </AuthShell>
  );
}
