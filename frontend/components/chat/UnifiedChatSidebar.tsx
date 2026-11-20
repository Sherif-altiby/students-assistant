// components/chat/UnifiedChatSidebar.tsx
"use client";

import { useMemo, useState } from "react";
import {
  MessageCircle,
  Stethoscope,
  Users,
  Search,
  Sparkles,
  MessagesSquare,
  ArrowUpRight,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useMyDoctors } from "@/hooks/useMyDoctors";
import { useMyStudents } from "@/hooks/useMyStudents";
import { getUserColor, getInitials } from "@/lib/chat-avatar";
import { cn } from "@/lib/utils";

interface UnifiedChatSidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  /** Mobile drawer state. Ignored on md+ where the sidebar is always visible. */
  open?: boolean;
  /** Called when the user closes the drawer (backdrop click, X button, or selection). */
  onClose?: () => void;
}

export function UnifiedChatSidebar({
  activeId,
  onSelect,
  open = false,
  onClose,
}: UnifiedChatSidebarProps) {
  const role = useAuthStore((s) => s.user?.role);
  const isDoctor = role === "DOCTOR";

  const myDoctors = useMyDoctors();
  const myStudents = useMyStudents();

  const isLoading = isDoctor ? myStudents.isLoading : myDoctors.isLoading;
  const isError = isDoctor ? myStudents.isError : myDoctors.isError;

  const people = useMemo(() => {
    if (isDoctor) {
      return (myStudents.data ?? []).map((s) => ({
        id: s.studentId,
        chatId: s.chatId,
        name: s.studentName,
        canSend: s.canSend,
        role: "STUDENT" as const,
      }));
    }
    return (myDoctors.data ?? []).map((d) => ({
      id: d.doctorId,
      chatId: d.chatId,
      name: d.doctorName,
      canSend: d.canSend,
      role: "DOCTOR" as const,
    }));
  }, [isDoctor, myStudents.data, myDoctors.data]);

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => p.name.toLowerCase().includes(q));
  }, [people, query]);

  const totalUnread = 0;

  // Mobile: close the drawer when a chat is picked.
  const handleSelect = (id: string) => {
    onSelect(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        dir="rtl"
        className={cn(
          "z-50 flex h-full w-[85vw] max-w-[340px] shrink-0 flex-col overflow-hidden border-l border-border/70 bg-card",
          // mobile: fixed drawer sliding from the RTL start edge (right)
          "fixed inset-y-0 right-0 transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          // desktop: back in flow, always visible, fixed width
          "md:static md:z-auto md:w-[320px] md:max-w-none md:translate-x-0 lg:w-[350px]",
        )}
        role="dialog"
        aria-label="المحادثات"
        aria-modal={open || undefined}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border/60 px-5 pb-5 pt-6">
          <div className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <MessagesSquare className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  المحادثات
                </h2>
                {totalUnread > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-5 min-w-5 justify-center rounded-full px-1.5"
                  >
                    {totalUnread}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isDoctor ? "تواصل مع طلابك بسهولة" : "مساحتك للتواصل والتعلم"}
              </p>
            </div>

            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                مباشر
              </span>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="ms-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative mt-5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {isDoctor ? "قائمة الطلاب" : "قائمة المحادثات"}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <div className="group relative">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isDoctor ? "ابحث عن طالب..." : "ابحث عن طبيب..."}
              className="h-11 rounded-xl border-border/60 bg-muted/40 pl-9 pr-10 text-sm transition-all placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="مسح البحث"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {/* Study Room (students only) */}
          {!isDoctor && (
            <section>
              <SectionTitle icon={<Users className="h-4 w-4" />} label="غرفة الدراسة" />
              <button
                type="button"
                onClick={() => handleSelect("general")}
                className={cn(
                  "group relative mt-2 flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-right transition-all duration-200",
                  activeId === "general"
                    ? "border-primary/30 bg-primary/[0.07] shadow-sm"
                    : "border-border/50 bg-muted/20 hover:border-primary/20 hover:bg-muted/50",
                )}
              >
                <div className="absolute inset-y-0 right-0 w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-md shadow-primary/20">
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-card bg-emerald-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      Study Room
                    </span>
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    محادثة جماعية مباشرة
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </button>
            </section>
          )}

          {/* People */}
          <section>
            <SectionTitle
              icon={<Stethoscope className="h-4 w-4" />}
              label={isDoctor ? "طلابي" : "أطبائي"}
              count={filtered.length}
            />

            <div className="mt-2">
              {isLoading && <SidebarSkeleton />}

              {isError && (
                <div className="mx-1 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-center">
                  <MessageCircle className="mx-auto mb-2 h-5 w-5 text-destructive" />
                  <p className="text-xs text-destructive">
                    {isDoctor ? "تعذر تحميل الطلاب" : "تعذر تحميل الأطباء"}
                  </p>
                </div>
              )}

              {!isLoading && !isError && filtered.length === 0 && (
                <EmptyPeople isDoctor={isDoctor} hasQuery={query.trim().length > 0} />
              )}

              {!isLoading && !isError && filtered.length > 0 && (
                <div className="space-y-1">
                  {filtered.map((p) => (
                    <ChatRow
                      key={p.id}
                      active={activeId === p.chatId}
                      title={p.name}
                      subtitle={p.canSend ? "محادثة مباشرة" : "سجل المحادثة"}
                      avatarLabel={p.name}
                      avatarUserId={p.id}
                      avatarColor={getUserColor(p.id)}
                      muted={!p.canSend}
                      onClick={() => handleSelect(p.chatId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

/* ── SectionTitle ─────────────────────────────────────────── */
function SectionTitle({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-bold text-foreground">{label}</span>
      {typeof count === "number" && (
        <span className="mr-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}

/* ── ChatRow ──────────────────────────────────────────────── */
function ChatRow({
  active,
  title,
  subtitle,
  avatarLabel,
  avatarUserId,
  avatarColor,
  muted,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  avatarLabel?: string;
  avatarUserId?: string;
  avatarColor?: string;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-right transition-all duration-200",
        active
          ? "border-primary/15 bg-primary/[0.07]"
          : "hover:border-border/50 hover:bg-muted/50",
        muted && !active && "opacity-65",
      )}
    >
      {active && (
        <span className="absolute inset-y-2 right-0 w-[3px] rounded-full bg-primary" />
      )}

      <span
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-2 ring-background transition-transform duration-200 group-hover:scale-105",
          active && "ring-primary/10",
        )}
        style={{ backgroundColor: avatarColor || "hsl(var(--muted))" }}
      >
        <span className="text-white">
          {avatarLabel && avatarUserId ? getInitials(avatarLabel) : "?"}
        </span>
        <span
          className={cn(
            "absolute bottom-0 left-0 h-3 w-3 rounded-full border-2 border-card",
            muted ? "bg-muted-foreground/40" : "bg-emerald-500",
          )}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-semibold transition-colors",
            active ? "text-primary" : "text-foreground group-hover:text-primary",
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>

      <ArrowUpRight
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground/40 transition-all",
          "group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary",
          active && "text-primary",
        )}
      />
    </button>
  );
}

/* ── SidebarSkeleton ──────────────────────────────────────── */
function SidebarSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── EmptyPeople ──────────────────────────────────────────── */
function EmptyPeople({
  isDoctor,
  hasQuery,
}: {
  isDoctor: boolean;
  hasQuery: boolean;
}) {
  return (
    <div className="mx-1 mt-3 flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-5 py-8 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {hasQuery ? (
          <Search className="h-6 w-6" />
        ) : (
          <MessagesSquare className="h-6 w-6" />
        )}
      </div>

      <p className="text-sm font-semibold text-foreground">
        {hasQuery
          ? "لا توجد نتائج"
          : isDoctor
            ? "لا يوجد طلاب حتى الآن"
            : "لا توجد محادثات بعد"}
      </p>

      <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
        {hasQuery
          ? "جرب البحث باستخدام اسم مختلف."
          : isDoctor
            ? "ستظهر محادثات طلابك هنا بمجرد قبول حجز جديد."
            : "احجز موعداً مع أحد الأطباء لبدء أول محادثة."}
      </p>
    </div>
  );
}