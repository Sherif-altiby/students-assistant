// src/modules/doctor-chat/doctor-chat.policy.ts
import type { BookingStatus } from '@prisma/client';

// A chat is writable while the pair has at least one booking in one of these states.
// REJECTED and CANCELLED bookings turn the chat into read-only history.
export const CHAT_BOOKING_STATUSES: readonly BookingStatus[] = [
  'PENDING',
  'ACCEPTED',
  'COMPLETED',
];

export interface ChatParties {
  doctorId: string;
  studentId: string;
}

export const isParticipant = (parties: ChatParties, userId: string): boolean =>
  parties.doctorId === userId || parties.studentId === userId;

export const otherParticipantId = (parties: ChatParties, userId: string): string =>
  parties.doctorId === userId ? parties.studentId : parties.doctorId;