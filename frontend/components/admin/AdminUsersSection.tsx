"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, UserRoundPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_ROLE_LABELS, ADMIN_USER_FILTER_OPTIONS } from "@/constants";
import { FormInput } from "@/components/FormInput";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  listAdminUsers,
  inviteDoctor,
  deleteDoctor,
  type AdminRole,
} from "@/lib/admin";

const PAGE_SIZE = 10;

function DoctorInviteForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState({ name: "", email: "", phone: "" });
  const inviteMutation = useMutation({
    mutationFn: inviteDoctor,
    onSuccess: async () => {
      toast.success("تم إرسال دعوة الطبيب بنجاح.");
      onClose();
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () =>
      toast.error("تعذر إرسال الدعوة. تحقق من البيانات وحاول مرة أخرى."),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inviteMutation.mutate({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    });
  }

  return (
    <Card className="gap-4 border border-primary/20 p-5 shadow-none ring-0">
      <div>
        <h3 className="font-bold text-card-foreground">إضافة طبيب</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          ستُرسل للطبيب رسالة دعوة لتفعيل حسابه وإنشاء كلمة مرور.
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <FormInput
          label="اسم الطبيب"
          required
          minLength={2}
          value={values.name}
          onChange={(event) =>
            setValues({ ...values, name: event.target.value })
          }
        />
        <FormInput
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          required
          value={values.email}
          onChange={(event) =>
            setValues({ ...values, email: event.target.value })
          }
        />
        <FormInput
          label="رقم الهاتف"
          type="tel"
          dir="ltr"
          required
          minLength={8}
          value={values.phone}
          onChange={(event) =>
            setValues({ ...values, phone: event.target.value })
          }
        />
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={inviteMutation.isPending}>
            <Plus className="size-4" aria-hidden="true" />
            {inviteMutation.isPending ? "جارٍ الإرسال..." : "إرسال الدعوة"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminUsersSection() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<AdminRole>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showInvite, setShowInvite] = useState(false);
  const usersQuery = useQuery({
    queryKey: ["admin", "users", { role, search, page }],
    queryFn: () => listAdminUsers({ role, search, page, limit: PAGE_SIZE }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDoctor,
    onSuccess: async () => {
      toast.success("تم حذف حساب الطبيب.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("تعذر حذف الطبيب. حاول مرة أخرى."),
  });

  function searchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function changeRole(nextRole: AdminRole) {
    setRole(nextRole);
    setPage(1);
  }

  function handleDeleteDoctor(id: string) {
    if (window.confirm("هل أنت متأكد من حذف حساب الطبيب؟")) {
      deleteMutation.mutate(id);
    }
  }

  const usersResult = usersQuery.data;
  const users = usersResult?.users ?? [];
  useEffect(() => {
    const lastPage = usersResult ? Math.ceil(usersResult.total / PAGE_SIZE) : 0;
    if (lastPage > 0 && page > lastPage) setPage(lastPage);
  }, [page, usersResult?.total]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Users className="size-5 text-primary" aria-hidden="true" />
            إدارة الحسابات
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            تصفح الطلاب وأولياء الأمور والأطباء والمشرفين، وابحث مع تقسيم
            النتائج إلى صفحات.
          </p>
        </div>
        <Button type="button" onClick={() => setShowInvite((shown) => !shown)}>
          <UserRoundPlus className="size-4" aria-hidden="true" />
          دعوة طبيب
        </Button>
      </div>

      {showInvite && <DoctorInviteForm onClose={() => setShowInvite(false)} />}

      <Card className="gap-4 border border-border p-4 shadow-none ring-0 sm:p-5">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="تصفية حسب نوع الحساب"
        >
          {ADMIN_USER_FILTER_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={role === option.id ? "default" : "outline"}
              aria-pressed={role === option.id}
              onClick={() => changeRole(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <form onSubmit={searchUsers} className="flex gap-2">
          <FormInput
            label="بحث"
            aria-label="البحث بالاسم أو البريد الإلكتروني"
            placeholder="ابحث بالاسم أو البريد الإلكتروني"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline" aria-label="بحث">
            <Search className="size-4" aria-hidden="true" />
            بحث
          </Button>
        </form>

        {usersQuery.isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-muted/50" />
        ) : usersQuery.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/5 p-4 text-sm text-destructive"
          >
            تعذر تحميل الحسابات. حاول تحديث الصفحة.
          </p>
        ) : !usersResult || users.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            لا توجد حسابات تطابق البحث.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-right text-xs text-muted-foreground">
                    <th scope="col" className="px-3 py-3">
                      الاسم
                    </th>
                    <th scope="col" className="px-3 py-3">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="px-3 py-3">
                      الهاتف
                    </th>
                    <th scope="col" className="px-3 py-3">
                      نوع الحساب
                    </th>
                    <th scope="col" className="px-3 py-3">
                      الحالة
                    </th>
                    {role === "DOCTOR" && (
                      <th scope="col" className="px-3 py-3">
                        إجراء
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-3 font-semibold text-foreground">
                        {user.name}
                      </td>
                      <td
                        dir="ltr"
                        className="px-3 py-3 text-right text-muted-foreground"
                      >
                        {user.email}
                      </td>
                      <td
                        dir="ltr"
                        className="px-3 py-3 text-right text-muted-foreground"
                      >
                        {user.phone ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="secondary">
                          {ADMIN_ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {user.status === "PENDING" ? "بانتظار التفعيل" : "نشط"}
                      </td>
                      {role === "DOCTOR" && (
                        <td className="px-3 py-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDeleteDoctor(user.id)}
                            aria-label={`حذف حساب ${user.name}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            حذف
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={usersResult.page}
              total={usersResult.total}
              limit={usersResult.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </section>
  );
}
