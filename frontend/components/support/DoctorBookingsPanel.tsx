"use client";

import { useMemo, useState } from "react";
import { useDoctorBookings } from "@/hooks/useSupport";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Check,
  CheckCircle2,
  Clock,
  Link2,
  Users,
  X,
  CalendarCheck,
} from "lucide-react";
import type { BookingWithSlotAndUser } from "@/lib/support";
import { MeetingLinkDialog } from "./MeetingDinkDialog";
import { BookingStatusBadge } from "./BookingtatusBadge";

function formatSlotTime(slot: BookingWithSlotAndUser["slot"]): string {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  const date = start.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
  });
  const startTime = start.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${startTime} - ${endTime}`;
}

/* ---------- Stat Card ---------- */
function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: "primary" | "accent" | "muted";
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/20 text-accent-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Row Actions ---------- */
function BookingRowActions({
  booking,
  isResponding,
  isSettingMeetingLink,
  isCompletingSlot,
  onRespond,
  onSetMeetingLink,
  onComplete,
}: {
  booking: BookingWithSlotAndUser;
  isResponding: boolean;
  isSettingMeetingLink: boolean;
  isCompletingSlot: boolean;
  onRespond: (accept: boolean) => void;
  onSetMeetingLink: (meetingLink: string) => void;
  onComplete: () => void;
}) {
  if (booking.status === "PENDING") {
    return (
      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          disabled={isResponding}
          onClick={() => onRespond(true)}
          className="shadow-sm"
        >
          <Check className="me-1 h-4 w-4" />
          قبول
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isResponding}
          onClick={() => onRespond(false)}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="me-1 h-4 w-4" />
          رفض
        </Button>
      </div>
    );
  }

  if (booking.status === "ACCEPTED") {
    return (
      <div className="flex justify-center gap-2">
        <MeetingLinkDialog
          currentLink={booking.slot.meetingLink}
          isSubmitting={isSettingMeetingLink}
          onSubmit={onSetMeetingLink}
          trigger={
            <Button size="sm" variant="outline" className="shadow-sm">
              <Link2 className="me-1 h-4 w-4" />
              {booking.slot.meetingLink ? "تعديل الرابط" : "إضافة رابط"}
            </Button>
          }
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={isCompletingSlot || !booking.slot.meetingLink}
          onClick={onComplete}
          className="shadow-sm"
        >
          <CheckCircle2 className="me-1 h-4 w-4" />
          إتمام الجلسة
        </Button>
      </div>
    );
  }

  return null;
}

/* ---------- Bookings Table ---------- */
function BookingsTable({
  bookings,
  showActions,
  isResponding,
  isSettingMeetingLink,
  isCompletingSlot,
  onRespond,
  onSetMeetingLink,
  onComplete,
  emptyMessage,
}: {
  bookings: BookingWithSlotAndUser[];
  showActions: boolean;
  isResponding: boolean;
  isSettingMeetingLink: boolean;
  isCompletingSlot: boolean;
  onRespond: (bookingId: string, accept: boolean) => void;
  onSetMeetingLink: (slotId: string, meetingLink: string) => void;
  onComplete: (slotId: string) => void;
  emptyMessage: string;
}) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-x-auto text-right">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right font-semibold text-foreground">
                الطالب
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">
                الموعد
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">
                الحالة
              </TableHead>
              {showActions && (
                <TableHead className="text-center font-semibold text-foreground">
                  إجراءات
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow
                key={booking.id}
                className="transition-colors hover:bg-muted/30"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {booking.user.name?.charAt(0) ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {booking.user.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {booking.user.phone}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatSlotTime(booking.slot)}
                </TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                {showActions && (
                  <TableCell>
                    <BookingRowActions
                      booking={booking}
                      isResponding={isResponding}
                      isSettingMeetingLink={isSettingMeetingLink}
                      isCompletingSlot={isCompletingSlot}
                      onRespond={(accept) => onRespond(booking.id, accept)}
                      onSetMeetingLink={(meetingLink) =>
                        onSetMeetingLink(booking.slotId, meetingLink)
                      }
                      onComplete={() => onComplete(booking.slotId)}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ---------- Main Panel ---------- */
export function DoctorBookingsPanel() {
  const {
    bookings,
    isLoading,
    error,
    respondToBooking,
    isResponding,
    setMeetingLink,
    isSettingMeetingLink,
    completeSlot,
    isCompletingSlot,
  } = useDoctorBookings();

  const [activeTab, setActiveTab] = useState("pending");

  const pendingBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "PENDING" || b.status === "ACCEPTED",
      ),
    [bookings],
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "COMPLETED"),
    [bookings],
  );

  const awaitingResponse = useMemo(
    () => bookings.filter((b) => b.status === "PENDING").length,
    [bookings],
  );

  const acceptedCount = useMemo(
    () => bookings.filter((b) => b.status === "ACCEPTED").length,
    [bookings],
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="بانتظار الرد"
          value={awaitingResponse}
          icon={Clock}
          tone="accent"
        />
        <StatCard
          label="جلسات مقبولة"
          value={acceptedCount}
          icon={CalendarCheck}
          tone="primary"
        />
        <StatCard
          label="جلسات مكتملة"
          value={completedBookings.length}
          icon={CheckCircle2}
          tone="muted"
        />
        <StatCard
          label="إجمالي الحجوزات"
          value={bookings.length}
          icon={Users}
          tone="primary"
        />
      </div>

      {/* Main Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-lg">الحجوزات</CardTitle>
          <CardDescription>
            راجع طلبات الحجز، رد عليها، وأدر جلساتك
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && (
            <Tabs value={activeTab} onValueChange={setActiveTab} >
              <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-xl bg-muted/60 p-1">
                <TabsTrigger
                  value="pending"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  بانتظار الرد
                  {pendingBookings.length > 0 && (
                    <span className="ms-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      {pendingBookings.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  مكتمل
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-5">
                <BookingsTable
                  bookings={pendingBookings}
                  showActions
                  isResponding={isResponding}
                  isSettingMeetingLink={isSettingMeetingLink}
                  isCompletingSlot={isCompletingSlot}
                  onRespond={(bookingId, accept) =>
                    respondToBooking({ bookingId, accept })
                  }
                  onSetMeetingLink={(slotId, meetingLink) =>
                    setMeetingLink({ slotId, meetingLink })
                  }
                  onComplete={(slotId) => completeSlot(slotId)}
                  emptyMessage="لا توجد حجوزات بانتظار الرد"
                />
              </TabsContent>

              <TabsContent value="completed" className="mt-5">
                <BookingsTable
                  bookings={completedBookings}
                  showActions={false}
                  isResponding={isResponding}
                  isSettingMeetingLink={isSettingMeetingLink}
                  isCompletingSlot={isCompletingSlot}
                  onRespond={() => {}}
                  onSetMeetingLink={() => {}}
                  onComplete={() => {}}
                  emptyMessage="لا توجد جلسات مكتملة بعد"
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}