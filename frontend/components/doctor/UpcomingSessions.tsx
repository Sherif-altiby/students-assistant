"use client";

import { Calendar, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useUpcomingSessions } from "@/hooks/useSupport";
import type { UpcomingSession } from "@/types/support";
import { UpcomingSessionsSkeleton } from "./UpcomingSessionsSkeleton";
import { UpcomingSessionsEmpty } from "./UpcomingSessionsEmpty";
 

function initials(name: string) {
  return name.trim().charAt(0) || "؟";
}

function formatSessionDate(startTime: string) {
  const date = new Date(startTime);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "اليوم";
  if (isSameDay(date, tomorrow)) return "غدًا";

  return date.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
}

function formatSessionTime(startTime: string, endTime: string) {
  const format = (iso: string) =>
    new Date(iso).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
  return `${format(startTime)} - ${format(endTime)}`;
}

function sessionStatus(session: UpcomingSession) {
  return session.slot.meetingLink
    ? { label: "مؤكدة", variant: "default" as const }
    : { label: "بانتظار الرابط", variant: "secondary" as const };
}

export function UpcomingSessions() {
  const { sessions, isLoading, error } = useUpcomingSessions();

  if (isLoading) {
    return <UpcomingSessionsSkeleton />;
  }

  if (error) {
    return <UpcomingSessionsEmpty message={error} />;
  }

  if (sessions.length === 0) {
    return <UpcomingSessionsEmpty />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {sessions.map((session) => {
        const status = sessionStatus(session);
        return (
          <Card key={session.id} className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {initials(session.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium text-foreground">
                  {session.user.name}
                </CardTitle>
                <Badge variant={status.variant} className="mt-1">
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatSessionDate(session.slot.startTime)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatSessionTime(session.slot.startTime, session.slot.endTime)}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Video className="h-3.5 w-3.5" />
                تفاصيل الجلسة
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}