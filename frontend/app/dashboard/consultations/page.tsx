"use client";

import { useEffect, useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotaCard } from "@/components/QuotaCard";
import {
  CONSULTATION_MONTHLY_LIMIT,
  countThisMonth,
  listConsultations,
  requestConsultation,
} from "@/lib/support";
import type { ConsultationSession } from "@/types";
import { Input } from "@/components/ui/input";

const STATUS_LABEL: Record<ConsultationSession["status"], string> = {
  PENDING: "قيد المراجعة",
  SCHEDULED: "تم الحجز",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};

export default function ConsultationsPage() {
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listConsultations()
      .then(setSessions)
      .catch(() => setError("تعذر تحميل الاستشارات"))
      .finally(() => setIsLoading(false));
  }, []);

  const usedThisMonth = countThisMonth(sessions);
  const reachedLimit = usedThisMonth >= CONSULTATION_MONTHLY_LIMIT;

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (reachedLimit || !subject.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await requestConsultation(subject.trim());
      setSessions((prev) => [session, ...prev]);
      setSubject("");
    } catch {
      setError("تعذر إرسال طلب الاستشارة، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          الاستشارات
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          يحق لك طلب حتى ٣ استشارات أكاديمية كل شهر
        </p>
      </div>

      <QuotaCard
        title="استشارات هذا الشهر"
        description="٣ استشارات متاحة كل شهر"
        used={usedThisMonth}
        limit={CONSULTATION_MONTHLY_LIMIT}
        accent="emerald"
        icon={<MessageCircleQuestion className="h-4 w-4" />}
      />

      <Card>
        <form
          onSubmit={handleRequest}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: اختيار الشعبة الجامعية المناسبة"
              required
            />
          </div>
          <Button type="submit" disabled={reachedLimit}>
            {reachedLimit ? "تم استهلاك حصة هذا الشهر" : "طلب استشارة"}
          </Button>
        </form>
        {error && (
          <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-bold text-ink">السجل</h2>
        {isLoading ? (
          <Card className="h-14 animate-pulse" />
        ) : sessions.length === 0 ? (
          <Card className="text-center text-sm text-ink/50">
            لا توجد استشارات سابقة
          </Card>
        ) : (
          sessions.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">
                  {s.subject || "بدون عنوان"}
                </p>
                <p className="mt-1 text-xs text-ink/50">
                  {new Date(s.createdAt).toLocaleDateString("ar-EG")}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {STATUS_LABEL[s.status]}
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
