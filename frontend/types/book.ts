export type BookStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export interface UploadTarget {
  bookId: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface CompleteUploadResult {
  id: string;
  status: BookStatus;
  progress: number;
}

export interface UploadBookMeta {
  title: string;
  language?: string;
}