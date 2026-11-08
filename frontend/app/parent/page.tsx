"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { FormInput } from "@/components/FormInput";
import MainButton from "@/components/ui/MainButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { requestStudentAccess } from "@/lib/parent";
import { PARENT_LINK_STATUS_LABELS, PARENT_STUDENTS_QUERY_KEY } from "@/constants";
import { useParentStudents } from "@/hooks/useParentStudents";
import { SuggestionForm } from "@/components/suggestions/SuggestionForm";

export default function ParentHomePage() {
  const queryClient = useQueryClient();
  const [studentEmail, setStudentEmail] = useState("");
  const [formError, setFormError] = useState("");
  const studentsQuery = useParentStudents();
  const requestMutation = useMutation({
    mutationFn: requestStudentAccess,
    onSuccess: async () => {
      setStudentEmail("");
      setFormError("");
      toast.success("تم إرسال طلب الربط للطالب");
      await queryClient.invalidateQueries({
        queryKey: PARENT_STUDENTS_QUERY_KEY,
      });
    },
    onError: (error) => {
      setFormError(
        error instanceof AxiosError
          ? error.response?.data?.message ?? "تعذر إرسال طلب الربط"
          : "حدث خطأ غير متوقع",
      );
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = studentEmail.trim();
    if (!email) return;
    requestMutation.mutate(email);
  }

  const links = studentsQuery.data ?? [];
  const linkedStudents = links.filter((link) => link.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="متابعة الأبناء"
        description="اطلب ربط حساب الطالب بعد التأكد من تطابق رقم ولي الأمر، ولا يمكنك مشاهدة التقدم قبل موافقة الطالب."
      />

      <Card className="gap-4 border border-border p-5 shadow-none ring-0 sm:p-6">
        <div>
          <h2 className="font-bold text-card-foreground">إضافة طالب</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            أدخل البريد الإلكتروني الذي يستخدمه الطالب في حسابه. سيظهر له طلب
            للموافقة على مشاركة تقدمه معك.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <FormInput
            className="flex-1"
            label="البريد الإلكتروني للطالب"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            value={studentEmail}
            onChange={(event) => {
              setStudentEmail(event.target.value);
              setFormError("");
            }}
            error={formError || undefined}
          />
          <MainButton
            type="submit"
            title="إرسال طلب الربط"
            loading={requestMutation.isPending}
            loadingTitle="جارٍ الإرسال..."
            icon={<ArrowLeft />}
            disabled={!studentEmail.trim()}
          />
        </form>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">الأبناء</h2>
          {!studentsQuery.isLoading && (
            <Badge variant="secondary">{linkedStudents.length}</Badge>
          )}
        </div>

        {studentsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-muted/50"
              />
            ))}
          </div>
        ) : studentsQuery.isError ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            تعذر تحميل طلبات الربط. حدّث الصفحة وحاول مرة أخرى.
          </div>
        ) : links.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 border-dashed py-12 text-center shadow-none">
            <UserRound className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              لم تضف أبناء بعد. أرسل طلب ربط باستخدام بريد الطالب.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {links.map((link) => (
              <Card
                key={link.id}
                className="gap-4 border border-border p-5 shadow-none ring-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserRound className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-card-foreground">
                        {link.student.name}
                      </h3>
                    </div>
                  </div>
                  <Badge variant={link.status === "ACTIVE" ? "default" : "secondary"}>
                    {PARENT_LINK_STATUS_LABELS[link.status]}
                  </Badge>
                </div>
                {link.status === "ACTIVE" ? (
                  <Link
                    href={`/parent/students/${link.student.id}`}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    عرض التقدم
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {link.status === "PENDING" ? (
                      <Clock3 className="h-4 w-4" aria-hidden="true" />
                    ) : null}
                    {link.status === "PENDING"
                      ? "ستتمكن من المشاهدة بعد موافقة الطالب."
                      : "يمكنك إعادة إرسال طلب الربط."}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
      <SuggestionForm />
    </div>
  );
}
