"use client";

import {
  AlertCircle,
  Phone,
  RefreshCw,
  SearchX,
  Trash2,
  Users,
} from "lucide-react";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_USER_SKELETON_ROWS,
  ADMIN_USER_STATUS_LABELS,
} from "@/constants";
import { Badge } from "@/components/ui/badge";
import MainButton from "@/components/ui/MainButton";
import type { AdminUser } from "@/lib/admin";

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
      >
        {user.name.trim().charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {user.name}
        </p>
        <a
          href={`mailto:${user.email}`}
          dir="ltr"
          className="block truncate rounded text-right text-xs text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {user.email}
        </a>
      </div>
    </div>
  );
}

function UserStatus({ status }: { status: AdminUser["status"] }) {
  const isPending = status === "PENDING";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPending
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${
          isPending ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />
      {ADMIN_USER_STATUS_LABELS[status]}
    </span>
  );
}

function DeleteButton({
  user,
  onDelete,
}: {
  user: AdminUser;
  onDelete: (user: AdminUser) => void;
}) {
  return (
    <MainButton
      type="button"
      size="sm"
      variant="ghost"
      title="حذف"
      icon={<Trash2 aria-hidden="true" />}
      aria-label={`حذف حساب ${user.name}`}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => onDelete(user)}
    />
  );
}

export function AdminUserListSkeleton() {
  return (
    <div className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: ADMIN_USER_SKELETON_ROWS }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 py-4">
          <div className="size-10 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded bg-muted" />
            <div className="h-3 w-56 max-w-full rounded bg-muted/70" />
          </div>
          <div className="hidden h-6 w-20 rounded-full bg-muted sm:block" />
          <div className="hidden h-6 w-16 rounded-full bg-muted sm:block" />
        </div>
      ))}
    </div>
  );
}

export function AdminUserListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl bg-destructive/5 p-6 text-center"
    >
      <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
      <p className="text-sm text-destructive">تعذر تحميل الحسابات.</p>
      <MainButton
        type="button"
        variant="outline"
        size="sm"
        title="إعادة المحاولة"
        icon={<RefreshCw aria-hidden="true" />}
        onClick={onRetry}
      />
    </div>
  );
}

export function AdminUserEmptyState({ filtered }: { filtered: boolean }) {
  const Icon = filtered ? SearchX : Users;

  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {filtered ? "لا توجد حسابات تطابق البحث" : "لا توجد حسابات بعد"}
        </p>
        {filtered && (
          <p className="text-sm text-muted-foreground">
            جرّب كلمات مختلفة أو غيّر نوع الحساب.
          </p>
        )}
      </div>
    </div>
  );
}

export function AdminUserList({
  users,
  canDelete,
  onDelete,
}: {
  users: AdminUser[];
  canDelete: boolean;
  onDelete: (user: AdminUser) => void;
}) {
  return (
    <div>
      <div className="hidden md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-start text-xs font-medium text-muted-foreground">
              <th scope="col" className="px-3 py-3 text-start">
                المستخدم
              </th>
              <th scope="col" className="px-3 py-3 text-start">
                الهاتف
              </th>
              <th scope="col" className="px-3 py-3 text-start">
                نوع الحساب
              </th>
              <th scope="col" className="px-3 py-3 text-start">
                الحالة
              </th>
              {canDelete && (
                <th scope="col" className="px-3 py-3 text-start">
                  <span className="sr-only">إجراءات</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="max-w-72 px-3 py-3">
                  <UserIdentity user={user} />
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
                <td className="px-3 py-3">
                  <UserStatus status={user.status} />
                </td>
                {canDelete && (
                  <td className="px-3 py-3 text-end">
                    <DeleteButton user={user} onDelete={onDelete} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {users.map((user) => (
          <li key={user.id} className="space-y-3 py-4 first:pt-0">
            <UserIdentity user={user} />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{ADMIN_ROLE_LABELS[user.role]}</Badge>
              <UserStatus status={user.status} />
            </div>
            {(user.phone || canDelete) && (
              <div className="flex items-center justify-between gap-3">
                {user.phone ? (
                  <span
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <Phone className="size-3.5" aria-hidden="true" />
                    {user.phone}
                  </span>
                ) : (
                  <span />
                )}
                {canDelete && <DeleteButton user={user} onDelete={onDelete} />}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
