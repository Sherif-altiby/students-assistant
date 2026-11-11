"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadBook } from "@/lib/books";
import type { UploadBookMeta } from "@/types/book";

export type UploadPhase = "idle" | "uploading" | "processing";

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

  const mutation = useMutation({
    mutationFn: ({ file, meta }: { file: File; meta: UploadBookMeta }) => {
      setProgress(0);
      return uploadBook(file, meta, setProgress);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  // The file bytes go to R2 first (0 to 100%), then the server reads the book
  const phase: UploadPhase = !mutation.isPending
    ? "idle"
    : progress < 100
      ? "uploading"
      : "processing";

  return {
    upload: mutation.mutate,
    phase,
    progress,
    isPending: mutation.isPending,
    result: mutation.data ?? null,
    error: mutation.isError ? getErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}