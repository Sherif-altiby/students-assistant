import { z } from "zod";

export const parentRegisterSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب ألا يقل عن حرفين"),
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا"),
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, "أدخل رقم هاتف صحيحًا"),
});

export type ParentRegisterValues = z.infer<typeof parentRegisterSchema>;
