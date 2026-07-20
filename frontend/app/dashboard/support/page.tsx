"use client";

import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotaCard } from "@/components/QuotaCard";
import {
  SUPPORT_MONTHLY_LIMIT,
  countThisMonth,
  listSupportSessions,
  requestSupportSession,
} from "@/lib/support";
import type { SupportSession } from "@/types";

const STATUS_LABEL: Record<SupportSession["status"], string> = {
  PENDING: "قيد المراجعة",
  SCHEDULED: "تم الحجز",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};

export default function SupportPage() {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSupportSessions()
      .then(setSessions)
      .catch(() => setError("تعذر تحميل جلسات الدعم النفسي"))
      .finally(() => setIsLoading(false));
  }, []);

  const usedThisMonth = countThisMonth(sessions);
  const reachedLimit = usedThisMonth >= SUPPORT_MONTHLY_LIMIT;

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (reachedLimit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await requestSupportSession(note.trim() || undefined);
      setSessions((prev) => [session, ...prev]);
      setNote("");
    } catch {
      setError("تعذر إرسال طلب الجلسة، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          الدعم النفسي
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          يحق لك حجز جلسة دعم نفسي واحدة كل شهر مع متخصص
        </p>
      </div>

      <QuotaCard
        title="جلسات هذا الشهر"
        description="جلسة واحدة متاحة كل شهر"
        used={usedThisMonth}
        limit={SUPPORT_MONTHLY_LIMIT}
        accent="rose"
        icon={<HeartHandshake className="h-4 w-4" />}
      />

      <Card>
        <form onSubmit={handleRequest} className="flex flex-col gap-4">
          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="اكتب أي شيء تود أن يعرفه المتخصص قبل الجلسة"
              className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-emerald-600"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}
          <Button type="submit" className="self-start">
            {reachedLimit ? "تم استهلاك حصة هذا الشهر" : "طلب جلسة دعم نفسي"}
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-bold text-ink">السجل</h2>
        {isLoading ? (
          <Card className="h-14 animate-pulse" />
        ) : sessions.length === 0 ? (
          <Card className="text-center text-sm text-ink/50">
            لا توجد جلسات سابقة
          </Card>
        ) : (
          sessions.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">
                  {s.note || "بدون ملاحظات"}
                </p>
                <p className="mt-1 text-xs text-ink/50">
                  {new Date(s.createdAt).toLocaleDateString("ar-EG")}
                </p>
              </div>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-600">
                {STATUS_LABEL[s.status]}
              </span>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
