"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStudyTable, deleteStudyTable, listStudyTables } from "@/lib/study-table";
import type { CreateStudyTablePayload } from "@/types/study-table";

const PAGE_SIZE = 10;

export function useStudyTables() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["study-tables", page],
    queryFn: () => listStudyTables({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["study-tables"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateStudyTablePayload) => createStudyTable(payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudyTable,
    onSuccess: invalidate,
  });

  return {
    tables: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    page,
    setPage,

    createTable: createMutation.mutate,
    isCreating: createMutation.isPending,

    deleteTable: deleteMutation.mutate,
  };
}