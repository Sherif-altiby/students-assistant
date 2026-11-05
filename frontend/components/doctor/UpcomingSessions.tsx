"use client";

import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUpcomingSessions } from "@/hooks/useSupport";
import type { UpcomingSession } from "@/types/support";
import { DOCTOR_SESSION_LABELS } from "@/constants";
import {
  formatDoctorSessionDate,
  formatDoctorSessionTime,
  getDoctorInitial,
} from "@/lib/doctor";
import { UpcomingSessionsSkeleton } from "./UpcomingSessionsSkeleton";
import { UpcomingSessionsEmpty } from "./UpcomingSessionsEmpty";

function sessionStatus(session: UpcomingSession) {
  return session.slot.meetingLink
    ? {
        label: DOCTOR_SESSION_LABELS.confirmed,
        variant: "default" as const,
      }
    : {
        label: DOCTOR_SESSION_LABELS.pendingLink,
        variant: "secondary" as const,
      };
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
                  {getDoctorInitial(session.user.name)}
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
                {formatDoctorSessionDate(session.slot.startTime)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDoctorSessionTime(
                  session.slot.startTime,
                  session.slot.endTime,
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
