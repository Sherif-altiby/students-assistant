"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStudyTable,
  deleteStudyTable,
  downloadStudyTablePdf,
  generateStudyTable,
  listStudyTables,
  updateStudyTable,
} from "@/lib/study-table";
import type {
  GenerateStudyTableInput,
  StudyTableInput,
  StudyTableUpdateInput,
} from "@/types/study-table";

const PAGE_SIZE = 10;

function mutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "code" in data && "message" in data) {
      const { code, message } = data;
      if (code === "PAST_MONTH" && typeof message === "string") return message;
    }
  }
  return fallback;
}

export function useStudyTables() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const tablesQuery = useQuery({
    queryKey: ["study-tables", page],
    queryFn: () => listStudyTables({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const invalidateTables = () => queryClient.invalidateQueries({ queryKey: ["study-tables"] });
  const createMutation = useMutation({
    mutationFn: (payload: StudyTableInput) => createStudyTable(payload),
    onSuccess: invalidateTables,
    onError: (error) => toast.error(mutationErrorMessage(error, "تعذر إنشاء جدول المذاكرة")),
  });
  const generateMutation = useMutation({
    mutationFn: ({ payload, preview }: { payload: GenerateStudyTableInput; preview: boolean }) =>
      generateStudyTable(payload, preview),
    onSuccess: (result, variables) => {
      if (!variables.preview) invalidateTables();
      return result;
    },
    onError: (error) => toast.error(
      mutationErrorMessage(error, "تعذر إنشاء الجدول تلقائياً، تحقق من البيانات"),
    ),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StudyTableUpdateInput }) =>
      updateStudyTable(id, payload),
    onSuccess: async () => {
      await invalidateTables();
      toast.success("تم تحديث الجدول");
    },
    onError: () => toast.error("تعذر تحديث الجدول"),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteStudyTable,
    onSuccess: async () => {
      await invalidateTables();
      toast.success("تم حذف الجدول");
    },
    onError: () => toast.error("تعذر حذف الجدول"),
  });
  const downloadMutation = useMutation({
    mutationFn: downloadStudyTablePdf,
    onError: () => toast.error("تعذر تحميل ملف الجدول"),
  });

  return {
    tables: tablesQuery.data?.data ?? [],
    pagination: tablesQuery.data?.pagination,
    isLoading: tablesQuery.isLoading,
    error: tablesQuery.error,
    page,
    setPage,
    createTableAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    generateTableAsync: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    updateTableAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTableAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    downloadPdfAsync: downloadMutation.mutateAsync,
    isDownloadingPdf: downloadMutation.isPending,
  };
}
