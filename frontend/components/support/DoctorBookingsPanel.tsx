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

import { Check, CheckCircle2, Link2, Users, X } from "lucide-react";
import type { BookingWithSlotAndUser } from "@/lib/support";
import { MeetingLinkDialog } from "./MeetingDinkDialog";
import { BookingStatusBadge } from "./BookingtatusBadge";

function formatSlotTime(slot: BookingWithSlotAndUser["slot"]): string {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  const date = start.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  const startTime = start.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${startTime} - ${endTime}`;
}

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
        <Button size="sm" disabled={isResponding} onClick={() => onRespond(true)}>
          <Check className="me-1 h-4 w-4" />
          قبول
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isResponding}
          onClick={() => onRespond(false)}
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
            <Button size="sm" variant="outline">
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
        >
          <CheckCircle2 className="me-1 h-4 w-4" />
          إتمام الجلسة
        </Button>
      </div>
    );
  }

  return null;
}

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
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
        <Users className="h-8 w-8" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto text-right">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الطالب</TableHead>
            <TableHead className="text-right">الموعد</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            {showActions && <TableHead className="text-center">إجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="font-medium">{booking.user.name}</div>
                <div className="text-xs text-muted-foreground">{booking.user.phone}</div>
              </TableCell>
              <TableCell className="text-sm">{formatSlotTime(booking.slot)}</TableCell>
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
                    onSetMeetingLink={(meetingLink) => onSetMeetingLink(booking.slotId, meetingLink)}
                    onComplete={() => onComplete(booking.slotId)}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
    () => bookings.filter((b) => b.status === "PENDING" || b.status === "ACCEPTED"),
    [bookings],
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "COMPLETED"),
    [bookings],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>الحجوزات</CardTitle>
        <CardDescription>راجع طلبات الحجز، رد عليها، وأدر جلساتك</CardDescription>
      </CardHeader>

      <CardContent>
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList>
              <TabsTrigger value="pending">
                بانتظار الرد
                {pendingBookings.length > 0 && (
                  <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    {pendingBookings.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">مكتمل</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <BookingsTable
                bookings={pendingBookings}
                showActions
                isResponding={isResponding}
                isSettingMeetingLink={isSettingMeetingLink}
                isCompletingSlot={isCompletingSlot}
                onRespond={(bookingId, accept) => respondToBooking({ bookingId, accept })}
                onSetMeetingLink={(slotId, meetingLink) => setMeetingLink({ slotId, meetingLink })}
                onComplete={(slotId) => completeSlot(slotId)}
                emptyMessage="لا توجد حجوزات بانتظار الرد"
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
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
  );
}