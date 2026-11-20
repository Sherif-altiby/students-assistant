// src/modules/doctor-chat/doctor-chat.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { doctorChatController } from './doctor-chat.controller';
import {
  bookingIdSchema,
  chatIdSchema,
  listMessagesSchema,
  sendMessageSchema,
} from './doctor-chat.validation';

export const doctorChatRouter = Router();

// Every doctor-chat route requires a valid access token.
doctorChatRouter.use(authenticate);

// Open (or get-or-create) the chat attached to a booking.
// Called when a student taps "message the doctor" after booking, or when
// the doctor opens the chat from a booking. The doctor and student are
// resolved from the booking row — never from the client.
doctorChatRouter.post('/bookings/:bookingId', validate(bookingIdSchema), doctorChatController.openFromBooking);

// List the current user's chats (doctor or student), newest activity first.
// Includes `otherUser`, last message preview, `lastMessageAt`, and unread count.
doctorChatRouter.get('/chats', doctorChatController.list);

// Get one chat's detail (other user, `canSend` read-only flag).
// Returns 404 both for "missing" and "not yours" so ids can't be probed.
doctorChatRouter.get('/chats/:chatId', validate(chatIdSchema), doctorChatController.getOne);

// Paginated message history, oldest first. Pass `?before=<messageId>` to load
// older messages. Response is `{ messages, nextCursor }`.
doctorChatRouter.get('/chats/:chatId/messages', validate(listMessagesSchema), doctorChatController.listMessages);

// Send a message via REST (fallback when the socket isn't connected).
// Rejects with 403 if the chat is read-only (no PENDING/ACCEPTED/COMPLETED
// booking between the pair). The socket path is the primary sender.
doctorChatRouter.post('/chats/:chatId/messages', validate(sendMessageSchema), doctorChatController.sendMessage);

// Mark all messages from the other party as delivered (✓✓ grey).
// REST fallback for when the recipient's socket missed the `delivered` emit;
// normally the client emits `doctor-chat:message:delivered` over the socket.
doctorChatRouter.post('/chats/:chatId/delivered', validate(chatIdSchema), doctorChatController.markDelivered);

// Mark all messages from the other party as read (✓✓ blue).
// Called when the recipient opens the chat or the tab regains focus.
// Also sets `deliveredAt` on those messages (read implies delivered).
doctorChatRouter.post('/chats/:chatId/read', validate(chatIdSchema), doctorChatController.markRead);


doctorChatRouter.post( '/chats/:chatId/reactions', validate(chatIdSchema), doctorChatController.toggleReaction,);