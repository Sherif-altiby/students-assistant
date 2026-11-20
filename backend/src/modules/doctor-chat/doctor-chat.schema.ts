import { z } from "zod";

export const doctorChatListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

export const sendDoctorChatMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000),
  replyToId: z.string().uuid().optional(),
});

export const doctorChatIdParamSchema = z.object({
  chatId: z.string().uuid("Invalid chat id"),
});

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export type DoctorChatListDto = z.infer<typeof doctorChatListSchema>;
export type SendDoctorChatMessageDto = z.infer<typeof sendDoctorChatMessageSchema>;
export type DoctorChatIdParamDto = z.infer<typeof doctorChatIdParamSchema>;
export type PatientIdParamDto = z.infer<typeof patientIdParamSchema>;
