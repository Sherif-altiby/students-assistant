import axios from "axios";

export type QuizErrorKind =
  | "range_missing"
  | "generation_failed"
  | "ai_unavailable"
  | "network"
  | "timeout"
  | "not_found"
  | "other";

export interface QuizError {
  kind: QuizErrorKind;
  status?: number;
  code?: string;
  message: string;
}

const FALLBACK_MESSAGE: Record<QuizErrorKind, string> = {
  range_missing: "حدّد الصفحات المطلوبة، مثلًا: كويز على أول 10 صفحات",
  generation_failed: "تعذر إنشاء الكويز، حاول مرة أخرى أو اختر صفحات أخرى",
  ai_unavailable: "خدمة الذكاء الاصطناعي مشغولة حاليًا، حاول بعد قليل",
  network: "تعذر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى",
  timeout: "استغرق الطلب وقتًا أطول من المتوقع، حاول مرة أخرى",
  not_found: "العنصر المطلوب غير موجود",
  other: "حدث خطأ غير متوقع، حاول مرة أخرى",
};

// Only the Arabic `message` from the server is shown, never a stack trace
export function toQuizError(error: unknown): QuizError {
  if (!axios.isAxiosError(error)) {
    return { kind: "other", message: FALLBACK_MESSAGE.other };
  }

  if (error.code === "ECONNABORTED") {
    return { kind: "timeout", message: FALLBACK_MESSAGE.timeout };
  }
  if (!error.response) {
    return { kind: "network", message: FALLBACK_MESSAGE.network };
  }

  const status = error.response.status;
  const body = error.response.data as
    | { message?: unknown; code?: unknown }
    | undefined;
  const code = typeof body?.code === "string" ? body.code : undefined;
  const serverMessage =
    typeof body?.message === "string" && body.message.trim()
      ? body.message
      : undefined;

  let kind: QuizErrorKind = "other";
  if (code === "QUIZ_RANGE_MISSING") kind = "range_missing";
  else if (status === 404) kind = "not_found";
  else if (status === 422 || code === "QUIZ_GENERATION_FAILED")
    kind = "generation_failed";
  else if (status === 503 || code === "AI_UNAVAILABLE") kind = "ai_unavailable";

  return {
    kind,
    status,
    code,
    message: serverMessage ?? FALLBACK_MESSAGE[kind],
  };
}