"use client";

import { UserBookingCard } from "@/components/support/UserBookingCard";
 import { Skeleton } from "@/components/ui/skeleton";
import { useUserBookings } from "@/hooks/useSupport";
import { CalendarDays } from "lucide-react";

export default function UserBookingsPage() {
  const { bookings, isLoading, error, cancelBooking, isCancelling, rateBooking, isRating } =
    useUserBookings();

  return (
    <div className=" space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">حجوزاتي</h1>
        <p className="text-muted-foreground">تابع طلبات الحجز وجلساتك مع الأطباء</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <CalendarDays className="h-8 w-8" />
          <p className="text-sm">لا توجد حجوزات حتى الآن</p>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((booking) => (
          <UserBookingCard
            key={booking.id}
            booking={booking}
            isCancelling={isCancelling}
            isRating={isRating}
            onCancel={() => cancelBooking(booking.id)}
            onRate={(score) => rateBooking({ bookingId: booking.id, score })}
          />
        ))}
      </div>
    </div>
  );
}