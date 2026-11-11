import { api } from "@/lib/api";
import type {
  CompleteUploadResult,
  UploadBookMeta,
  UploadTarget,
} from "@/types/book";

interface ItemResponse<T> {
  status: "success";
  data: T;
}

// Must match the limit enforced by the backend
export const MAX_BOOK_SIZE_MB = 50;
const MAX_BOOK_SIZE_BYTES = MAX_BOOK_SIZE_MB * 1024 * 1024;

export function validateBookFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "الملف لازم يكون PDF";
  if (file.size === 0) return "الملف فاضي";
  if (file.size > MAX_BOOK_SIZE_BYTES) {
    return `حجم الملف أكبر من ${MAX_BOOK_SIZE_MB} ميجا`;
  }
  return null;
}

async function requestBookUpload(payload: {
  title: string;
  fileSize: number;
  language?: string;
}): Promise<UploadTarget> {
  const res = await api.post<ItemResponse<UploadTarget>>(
    "/books/upload-url",
    payload,
  );
  return res.data.data;
}

// Goes straight to Cloudflare R2, so it must NOT use the api instance
// (no auth headers, no base URL). XMLHttpRequest gives upload progress.
function putFileToStorage(
  file: File,
  target: UploadTarget,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(target.method, target.uploadUrl);
    for (const [name, value] of Object.entries(target.headers)) {
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`فشل رفع الملف (${xhr.status})`));
    xhr.onerror = () =>
      reject(new Error("فشل رفع الملف، تحقق من الاتصال أو إعدادات CORS"));
    xhr.send(file);
  });
}

async function completeBookUpload(
  bookId: string,
): Promise<CompleteUploadResult> {
  // Processing can take a while for big books, so allow a longer timeout
  const res = await api.post<ItemResponse<CompleteUploadResult>>(
    `/books/${bookId}/complete`,
    undefined,
    { timeout: 5 * 60 * 1000 },
  );
  return res.data.data;
}

// Full flow: request link -> upload to R2 -> confirm
export async function uploadBook(
  file: File,
  meta: UploadBookMeta,
  onProgress?: (percent: number) => void,
): Promise<CompleteUploadResult> {
  const error = validateBookFile(file);
  if (error) throw new Error(error);

  const target = await requestBookUpload({
    title: meta.title,
    fileSize: file.size,
    language: meta.language,
  });

  await putFileToStorage(file, target, onProgress);
  return completeBookUpload(target.bookId);
}