"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookStatus, uploadBook } from "@/lib/books";
import type { CompleteUploadResult, UploadBookMeta } from "@/types/book";

export type UploadPhase = "idle" | "uploading" | "processing";

const POLL_INTERVAL_MS = 3000;

const isFinal = (status?: string) => status === "READY" || status === "FAILED";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? "حدث خطأ، حاول مرة أخرى";
  }
  if (error instanceof Error) return error.message;
  return "حدث خطأ غير متوقع";
}

export function useBookUpload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: UploadBookMeta }) => {
      setProgress(0);
      return uploadBook(file, meta, setProgress);
    },
    onSuccess: (data) => {
      // If the server is still processing, keep checking until it finishes
      setProcessingId(isFinal(data.status) ? null : data.id);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  const statusQuery = useQuery({
    queryKey: ["book-status", processingId],
    queryFn: () => getBookStatus(processingId as string),
    enabled: processingId !== null,
    refetchInterval: (query) =>
      isFinal(query.state.data?.status) ? false : POLL_INTERVAL_MS,
  });

  const polled = statusQuery.data;
  const isProcessing = processingId !== null && !isFinal(polled?.status);

  // Latest known state of the book: upload response, updated by polling
  const result: CompleteUploadResult | null = mutation.data
    ? {
        ...mutation.data,
        status: polled?.status ?? mutation.data.status,
        progress: polled?.progress ?? mutation.data.progress,
      }
    : null;

  const phase: UploadPhase = mutation.isPending
    ? progress < 100
      ? "uploading"
      : "processing"
    : isProcessing
      ? "processing"
      : "idle";

  const error = mutation.isError
    ? getErrorMessage(mutation.error)
    : polled?.status === "FAILED"
      ? `فشل تجهيز الكتاب${polled.failureReason ? `: ${polled.failureReason}` : ""}`
      : statusQuery.isError
        ? "تعذر متابعة حالة الكتاب"
        : null;

  return {
    upload: mutation.mutate,
    phase,
    progress,
    isPending: mutation.isPending || isProcessing,
    result,
    error,
    reset: () => {
      mutation.reset();
      setProcessingId(null);
    },
  };
}