"use client";

import { useState, type FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronDown,
  Lightbulb,
  Mail,
  RefreshCw,
  Search,
  SearchX,
  UserX,
  X,
} from "lucide-react";
import {
  ADMIN_PAGE_SIZE,
  ADMIN_ROLE_LABELS,
  ADMIN_SUGGESTION_LONG_MESSAGE_LENGTH,
} from "@/constants";
import { AdminPagination } from "@/components/admin/AdminPagination";
import MainButton from "@/components/ui/MainButton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listSuggestions } from "@/lib/suggestions";

const rtf = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });
const fullDate = new Intl.DateTimeFormat("ar-EG", {
  dateStyle: "long",
  timeStyle: "short",
});

function formatRelative(iso: string) {
  const diffSeconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return rtf.format(0, "second");
}

type Suggestion = NonNullable<
  Awaited<ReturnType<typeof listSuggestions>>
>["suggestions"][number];

function SuggestionItem({ suggestion }: { suggestion: Suggestion }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = suggestion;
  const isLong =
    suggestion.message.length > ADMIN_SUGGESTION_LONG_MESSAGE_LENGTH;

  return (
    <li className="flex gap-3 py-5 first:pt-1 last:pb-1">
      <div
        aria-hidden="true"
        className={
          user
            ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
      >
        {user ? user.name.trim().charAt(0) : <UserX className="size-4" />}
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={
                user
                  ? "text-sm font-semibold text-foreground"
                  : "text-sm font-semibold text-muted-foreground"
              }
            >
              {user?.name ?? "حساب محذوف"}
            </span>
            {user && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {ADMIN_ROLE_LABELS[user.role]}
              </span>
            )}
          </div>
          <time
            dateTime={suggestion.createdAt}
            title={fullDate.format(new Date(suggestion.createdAt))}
            className="text-xs text-muted-foreground"
          >
            {formatRelative(suggestion.createdAt)}
          </time>
        </div>

        <div className="rounded-xl rounded-ss-sm bg-muted/50 px-4 py-3">
          <p
            className={`whitespace-pre-wrap text-sm leading-7 text-foreground ${
              isLong && !expanded ? "line-clamp-3" : ""
            }`}
          >
            {suggestion.message}
          </p>
          {isLong && (
            <MainButton
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              variant="link"
              title={expanded ? "عرض أقل" : "عرض المزيد"}
              icon={
                <ChevronDown
                  className={`size-3.5 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              }
              iconPosition="end"
              className="mt-1 h-auto gap-1 p-0 text-xs font-medium text-primary"
            />
          )}
        </div>

        {user && (
          <a
            href={`mailto:${user.email}`}
            dir="ltr"
            className="inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail className="size-3.5" aria-hidden="true" />
            {user.email}
          </a>
        )}
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex animate-pulse gap-3 py-5 first:pt-1">
          <div className="size-10 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-3.5 w-32 rounded bg-muted" />
            <div className="space-y-2 rounded-xl bg-muted/50 p-4">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  const Icon = searching ? SearchX : Lightbulb;
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {searching ? "لا توجد نتائج مطابقة" : "لا توجد اقتراحات بعد"}
        </p>
        <p className="text-sm text-muted-foreground">
          {searching
            ? "جرّب كلمات مختلفة أو امسح البحث."
            : "ستظهر هنا الاقتراحات التي يرسلها المستخدمون."}
        </p>
      </div>
    </div>
  );
}

export function AdminSuggestionsSection() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const suggestionsQuery = useQuery({
    queryKey: ["admin", "suggestions", { search, page }],
    queryFn: () => listSuggestions({ search, page, limit: ADMIN_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const result = suggestionsQuery.data;
  const hasItems = !!result?.suggestions.length;

  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lightbulb className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            اقتراحات المستخدمين
            {result && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                {result.total.toLocaleString("ar-EG")}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            هذه الاقتراحات متاحة لفريق الإدارة فقط.
          </p>
        </div>
      </div>

      <Card className="gap-5 border border-border p-4 shadow-none ring-0 sm:p-5">
        <form
          onSubmit={submitSearch}
          role="search"
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="البحث في الاقتراحات"
              placeholder="ابحث في نص الاقتراح"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-10 rounded-lg border-input bg-background ps-9 pe-9 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchInput && (
              <MainButton
                type="button"
                onClick={clearSearch}
                variant="ghost"
                title="مسح البحث"
                icon={<X aria-hidden="true" />}
                iconOnly
                size="icon-xs"
                aria-label="مسح البحث"
                className="absolute end-2 top-1/2 -translate-y-1/2"
              />
            )}
          </div>
          <MainButton type="submit" title="بحث" className="h-10 sm:px-5" />
        </form>

        {search && result && (
          <p className="-mt-2 text-xs text-muted-foreground" aria-live="polite">
            {result.total.toLocaleString("ar-EG")} نتيجة لـ «{search}»
          </p>
        )}

        {suggestionsQuery.isLoading ? (
          <ListSkeleton />
        ) : suggestionsQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-xl bg-destructive/5 p-6 text-center"
          >
            <AlertCircle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-destructive">تعذر تحميل الاقتراحات.</p>
            <MainButton
              type="button"
              variant="outline"
              size="sm"
              title="إعادة المحاولة"
              icon={<RefreshCw aria-hidden="true" />}
              onClick={() => suggestionsQuery.refetch()}
            />
          </div>
        ) : !hasItems ? (
          <EmptyState searching={!!search} />
        ) : (
          <>
            <ul
              className={`divide-y divide-border transition-opacity ${
                suggestionsQuery.isPlaceholderData ? "opacity-60" : ""
              }`}
              aria-busy={suggestionsQuery.isFetching}
            >
              {result.suggestions.map((suggestion) => (
                <SuggestionItem key={suggestion.id} suggestion={suggestion} />
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
