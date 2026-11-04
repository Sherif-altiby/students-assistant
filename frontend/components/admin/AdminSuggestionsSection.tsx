"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Search } from "lucide-react";
import { ADMIN_ROLE_LABELS } from "@/constants";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listSuggestions } from "@/lib/suggestions";

const PAGE_SIZE = 10;

export function AdminSuggestionsSection() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const suggestionsQuery = useQuery({
    queryKey: ["admin", "suggestions", { search, page }],
    queryFn: () => listSuggestions({ search, page, limit: PAGE_SIZE }),
  });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  const result = suggestionsQuery.data;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Lightbulb className="size-5 text-primary" aria-hidden="true" />
          اقتراحات المستخدمين
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          هذه الاقتراحات متاحة لفريق الإدارة فقط.
        </p>
      </div>
      <Card className="gap-4 border border-border p-4 shadow-none ring-0 sm:p-5">
        <form onSubmit={submitSearch} className="flex gap-2">
          <FormInput
            label="بحث"
            aria-label="البحث في الاقتراحات"
            placeholder="ابحث في نص الاقتراح"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            <Search className="size-4" aria-hidden="true" />
            بحث
          </Button>
        </form>
        {suggestionsQuery.isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-muted/50" />
        ) : suggestionsQuery.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive"
          >
            تعذر تحميل الاقتراحات.
          </p>
        ) : !result?.suggestions.length ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            لا توجد اقتراحات حتى الآن.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {result.suggestions.map((suggestion) => (
                <li key={suggestion.id} className="space-y-2 py-4 first:pt-1">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {suggestion.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{suggestion.user?.name ?? "حساب محذوف"}</span>
                    {suggestion.user && (
                      <>
                        <span dir="ltr">{suggestion.user.email}</span>
                        <span>{ADMIN_ROLE_LABELS[suggestion.user.role]}</span>
                      </>
                    )}
                    <time dateTime={suggestion.createdAt}>
                      {new Date(suggestion.createdAt).toLocaleString("ar-EG")}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
            <AdminPagination
              page={result.page}
              total={result.total}
              limit={result.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </section>
  );
}
