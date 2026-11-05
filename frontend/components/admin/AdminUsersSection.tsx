"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Search, UserRoundPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_PAGE_SIZE,
  ADMIN_USERS_QUERY_KEY,
  ADMIN_USER_FILTER_OPTIONS,
} from "@/constants";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  AdminUserEmptyState,
  AdminUserList,
  AdminUserListError,
  AdminUserListSkeleton,
} from "@/components/admin/AdminUserList";
import {
  DoctorCreateDialog,
  DoctorDeleteDialog,
} from "@/components/admin/AdminUserDialogs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import MainButton from "@/components/ui/MainButton";
import {
  deleteDoctor,
  listAdminUsers,
  type AdminRole,
  type AdminUser,
} from "@/lib/admin";

export function AdminUsersSection() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<AdminRole>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<AdminUser | null>(null);

  const usersQuery = useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, { role, search, page }],
    queryFn: () =>
      listAdminUsers({ role, search, page, limit: ADMIN_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: async () => {
      toast.success("تم حذف حساب الطبيب.");
      setDoctorToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
    onError: () => toast.error("تعذر حذف الطبيب. حاول مرة أخرى."),
  });

  const result = usersQuery.data;
  const users = result?.users ?? [];
  const isFiltered = Boolean(search) || role !== "ALL";
  const canDelete = role === "DOCTOR";

  useEffect(() => {
    const lastPage = Math.ceil((result?.total ?? 0) / ADMIN_PAGE_SIZE);
    if (page > Math.max(1, lastPage)) setPage(Math.max(1, lastPage));
  }, [page, result?.total]);

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

  function changeRole(nextRole: AdminRole) {
    setRole(nextRole);
    setPage(1);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              إدارة الحسابات
              {result && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                  {result.total.toLocaleString("ar-EG")}
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              تصفح الطلاب وأولياء الأمور والأطباء والمشرفين.
            </p>
          </div>
        </div>
        <MainButton
          type="button"
          title="إضافة طبيب"
          icon={<UserRoundPlus aria-hidden="true" />}
          onClick={() => setShowCreateDoctor(true)}
        />
      </div>

      <DoctorCreateDialog
        open={showCreateDoctor}
        onOpenChange={setShowCreateDoctor}
      />
      <DoctorDeleteDialog
        doctor={doctorToDelete}
        pending={deleteMutation.isPending}
        onCancel={() => setDoctorToDelete(null)}
        onConfirm={() => {
          if (doctorToDelete) deleteMutation.mutate(doctorToDelete.id);
        }}
      />

      <Card className="gap-5 border border-border p-4 shadow-none ring-0 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:px-0"
            role="group"
            aria-label="تصفية حسب نوع الحساب"
          >
            <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
              {ADMIN_USER_FILTER_OPTIONS.map((option) => (
                <MainButton
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={role === option.id ? "secondary" : "ghost"}
                  aria-pressed={role === option.id}
                  title={option.label}
                  className="whitespace-nowrap"
                  onClick={() => changeRole(option.id)}
                />
              ))}
            </div>
          </div>

          <form
            onSubmit={submitSearch}
            role="search"
            className="flex gap-2 lg:w-96"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="البحث بالاسم أو البريد الإلكتروني"
                placeholder="ابحث بالاسم أو البريد الإلكتروني"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-10 rounded-lg border-input bg-background ps-9 pe-9 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
              />
              {searchInput && (
                <MainButton
                  type="button"
                  variant="ghost"
                  title="مسح البحث"
                  icon={<X aria-hidden="true" />}
                  iconOnly
                  size="icon-xs"
                  aria-label="مسح البحث"
                  className="absolute end-2 top-1/2 -translate-y-1/2"
                  onClick={clearSearch}
                />
              )}
            </div>
            <MainButton type="submit" title="بحث" className="h-10 sm:px-5" />
          </form>
        </div>

        {usersQuery.isLoading ? (
          <AdminUserListSkeleton />
        ) : usersQuery.isError ? (
          <AdminUserListError onRetry={() => usersQuery.refetch()} />
        ) : !result || users.length === 0 ? (
          <AdminUserEmptyState filtered={isFiltered} />
        ) : (
          <>
            <div
              className={`transition-opacity ${
                usersQuery.isPlaceholderData ? "opacity-60" : ""
              }`}
              aria-busy={usersQuery.isFetching}
            >
              <AdminUserList
                users={users}
                canDelete={canDelete}
                onDelete={setDoctorToDelete}
              />
            </div>
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
