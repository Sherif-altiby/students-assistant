"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import {
  listParentLinkRequests,
  respondToParentLinkRequest,
} from "@/lib/parent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ParentLinkRequests() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const requestsQuery = useQuery({
    queryKey: ["parent-links", "requests"],
    queryFn: listParentLinkRequests,
    enabled: user?.role === "USER",
  });

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "approve" | "reject";
    }) => respondToParentLinkRequest(id, decision),
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.decision === "approve"
          ? "تمت الموافقة على ربط حساب ولي الأمر"
          : "تم رفض طلب الربط",
      );
      await queryClient.invalidateQueries({
        queryKey: ["parent-links", "requests"],
      });
    },
    onError: () => toast.error("تعذر تحديث طلب ربط ولي الأمر"),
  });

  if (user?.role !== "USER" || requestsQuery.isLoading) {
    return null;
  }

  if (requestsQuery.isError) {
    return (
      <Card
        role="alert"
        className="flex-row items-center justify-between gap-3 border border-destructive/20 bg-destructive/5 p-4 shadow-none ring-0"
      >
        <p className="text-sm text-destructive">
          تعذر تحميل طلبات ربط ولي الأمر.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void requestsQuery.refetch()}
        >
          إعادة المحاولة
        </Button>
      </Card>
    );
  }

  const requests = requestsQuery.data ?? [];
  if (!requests.length) return null;

  return (
    <Card className="gap-4 border border-primary/20 bg-primary/[0.025] p-5 shadow-none ring-0">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-bold text-card-foreground">
            طلبات ربط ولي الأمر
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            وافق فقط إذا كنت تعرف ولي الأمر. عند الموافقة سيتمكن من مشاهدة
            تقدمك الدراسي دون إجراء تغييرات.
          </p>
        </div>
        <Badge variant="secondary">{requests.length}</Badge>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                {request.parent.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {request.parent.phone ?? "رقم غير متاح"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={respondMutation.isPending}
                onClick={() =>
                  respondMutation.mutate({
                    id: request.id,
                    decision: "approve",
                  })
                }
              >
                {respondMutation.isPending &&
                respondMutation.variables?.id === request.id &&
                respondMutation.variables.decision === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                موافقة
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={respondMutation.isPending}
                onClick={() =>
                  respondMutation.mutate({
                    id: request.id,
                    decision: "reject",
                  })
                }
              >
                <X className="h-4 w-4" aria-hidden="true" />
                رفض
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
