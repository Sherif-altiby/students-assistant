// src/lib/doctor-chat.ts
import { api } from "@/lib/api";
import type {
  DoctorChatListItem,
  DoctorChatMessage,
  DoctorChatMessagesPage,
  SendDoctorChatMessagePayload,
  DoctorChatConnectResponse,
  DoctorChatDetail,
} from "@/types/doctor-chat";
import type { ListResponse, ItemResponse } from "@/types/support";

export async function listDoctorChats(): Promise<DoctorChatListItem[]> {
  const res = await api.get<ListResponse<DoctorChatListItem>>("/doctor-chat/chats");
  return res.data.data;
}

export async function getDoctorChat(chatId: string): Promise<DoctorChatDetail> {
  const res = await api.get<ItemResponse<DoctorChatDetail>>(`/doctor-chat/chats/${chatId}`);
  return res.data.data;
}

export async function getDoctorChatMessages(
  chatId: string,
  params?: { before?: string; limit?: number },
): Promise<DoctorChatMessagesPage> {
  const res = await api.get<ItemResponse<DoctorChatMessagesPage>>(
    `/doctor-chat/chats/${chatId}/messages`,
    { params: { before: params?.before, limit: params?.limit ?? 30 } },
  );
  return res.data.data;
}

export async function sendDoctorChatMessage(
  chatId: string,
  payload: SendDoctorChatMessagePayload,
): Promise<DoctorChatMessage> {
  const res = await api.post<ItemResponse<DoctorChatMessage>>(
    `/doctor-chat/chats/${chatId}/messages`,
    payload,
  );
  return res.data.data;
}

export async function markDoctorChatAsRead(chatId: string): Promise<void> {
  await api.post(`/doctor-chat/chats/${chatId}/read`);
}

// ← new: REST fallback when the socket isn't connected.
export async function markDoctorChatDelivered(chatId: string): Promise<void> {
  await api.post(`/doctor-chat/chats/${chatId}/delivered`);
}

export async function openDoctorChatFromBooking(
  bookingId: string,
): Promise<DoctorChatConnectResponse> {
  const res = await api.post<ItemResponse<DoctorChatConnectResponse>>(
    `/doctor-chat/bookings/${bookingId}`,
  );
  return res.data.data;
}