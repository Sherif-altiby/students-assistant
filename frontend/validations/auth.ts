import { z } from "zod";

const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "الاسم مطلوب")
    .min(3, "الاسم يجب ألا يقل عن 3 أحرف"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف"),
  phone: z
    .string()
    .min(1, "رقم الهاتف مطلوب")
    .regex(EGYPT_PHONE_REGEX, "رقم هاتف غير صحيح"),
  parentPhone: z
    .string()
    .min(1, "رقم هاتف ولي الأمر مطلوب")
    .regex(EGYPT_PHONE_REGEX, "رقم هاتف غير صحيح"),
  gender: z.enum(["MALE", "FEMALE"], { message: "اختر النوع" }),
  level: z.enum(["AZHARI_SECONDARY", "GENERAL_SECONDARY"], {
    message: "اختر المرحلة الدراسية",
  }),
  track: z.enum(["SCIENCE", "LITERATURE", "SCIENCE_SCIENCE", "SCIENCE_MATH"], { message: "اختر الشعبة" }),
  country: z.string().min(1, "الدولة مطلوبة"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("صيغة البريد الإلكتروني غير صحيحة"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف"),
});