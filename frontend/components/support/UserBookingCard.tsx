"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star, Video, XCircle } from "lucide-react";
import type { BookingWithSlot } from "@/lib/support";
import { BookingStatusBadge } from "./BookingtatusBadge";
import { RatingDialog } from "./RatingDialog";
 

function formatSlotTime(slot: BookingWithSlot["slot"]): string {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  const date = start.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const startTime = start.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${startTime} - ${endTime}`;
}

interface UserBookingCardProps {
  booking: BookingWithSlot;
  isCancelling?: boolean;
  isRating?: boolean;
  onCancel: () => void;
  onRate: (score: number) => void;
}

export function UserBookingCard({
  booking,
  isCancelling,
  isRating,
  onCancel,
  onRate,
}: UserBookingCardProps) {
  const canCancel = booking.status === "PENDING" || booking.status === "ACCEPTED";
  const canRate = booking.status === "COMPLETED";
  const canJoin = booking.status === "ACCEPTED" && Boolean(booking.slot.meetingLink);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <p className="font-medium">{formatSlotTime(booking.slot)}</p>
        <BookingStatusBadge status={booking.status} />
      </CardHeader>

      {canJoin && (
        <CardContent>
          <a
            href={booking.slot.meetingLink ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Video className="h-4 w-4" />
            الانضمام إلى الجلسة
          </a>
        </CardContent>
      )}

      {(canCancel || canRate) && (
        <CardFooter className="justify-end gap-2">
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="outline" size="sm" disabled={isCancelling}>
                  <XCircle className="me-1 h-4 w-4" />
                  إلغاء الحجز
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>إلغاء الحجز؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم إلغاء هذا الحجز وتحرير الموعد لمرضى آخرين. لا يمكن التراجع عن هذا
                    الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                  <AlertDialogAction disabled={isCancelling} onClick={onCancel}>
                    تأكيد الإلغاء
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {canRate && (
            <RatingDialog
              isSubmitting={isRating}
              onSubmit={onRate}
              trigger={
                <Button size="sm">
                  <Star className="me-1 h-4 w-4" />
                  قيّم الجلسة
                </Button>
              }
            />
          )}
        </CardFooter>
      )}
    </Card>
  );
}