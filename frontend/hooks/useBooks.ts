"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteBook, listBooks } from "@/lib/books";

export function useBooks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["books"],
    queryFn: listBooks,
    // keep checking only while a book is being processed
    refetchInterval: (q) =>
      q.state.data?.some((b) => b.status === "PROCESSING") ? 4000 : false,
  });

  const remove = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  return {
    books: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    deleteBook: remove.mutate,
    deletingId: remove.isPending ? remove.variables : null,
    deleteError: remove.isError,
  };
}