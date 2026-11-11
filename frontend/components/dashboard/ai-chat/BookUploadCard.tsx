"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud, X } from "lucide-react";
import MainButton from "@/components/ui/MainButton";
import { FormInput } from "@/components/FormInput";
import { FormCustomSelect } from "@/components/FormCustomSelect";
import { useBookUpload } from "@/hooks/useBookUpload";
import { MAX_BOOK_SIZE_MB, validateBookFile } from "@/lib/books";

const LANGUAGE_OPTIONS = [
  { value: "ar", label: "عربي" },
  { value: "en", label: "English" },
];

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميجا`;
}

export function BookUploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("ar");
  const [fileError, setFileError] = useState<string | null>(null);

  const { upload, phase, progress, isPending, result, error, reset } =
    useBookUpload();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = ""; // lets the user pick the same file again
    if (!selected) return;

    const problem = validateBookFile(selected);
    if (problem) {
      setFile(null);
      setFileError(problem);
      return;
    }

    reset();
    setFileError(null);
    setFile(selected);
    if (!title.trim()) setTitle(selected.name.replace(/\.pdf$/i, ""));
  }

  function clearFile() {
    setFile(null);
    setFileError(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    upload(
      { file, meta: { title: title.trim(), language } },
      {
        onSuccess: () => {
          setFile(null);
          setTitle("");
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border bg-card p-5"
    >
      <div>
        <h2 className="text-base font-bold text-foreground">رفع كتاب جديد</h2>
        <p className="text-xs text-muted-foreground">
          ملف PDF بحد أقصى {MAX_BOOK_SIZE_MB} ميجا. الكتاب بيبقى خاص بيك.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isPending}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(file.size)}
            </p>
          </div>
          {!isPending && (
            <button
              type="button"
              onClick={clearFile}
              aria-label="إزالة الملف"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-8 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          <UploadCloud className="h-7 w-7" />
          <span className="text-sm font-medium">اضغط لاختيار ملف PDF</span>
        </button>
      )}

      {fileError && (
        <p role="alert" className="text-sm text-destructive">
          {fileError}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormInput
            label="اسم الكتاب"
            id="book-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: كتاب الأحياء للصف الثالث الثانوي"
            required
            disabled={isPending}
          />
        </div>

        <FormCustomSelect
          className="sm:w-40"
          label="لغة الكتاب"
          id="book-language"
          value={language}
          onChange={setLanguage}
          options={LANGUAGE_OPTIONS}
          disabled={isPending}
        />
      </div>

      {phase === "uploading" && (
        <div className="space-y-1.5" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            جارٍ رفع الكتاب... {progress}%
          </p>
        </div>
      )}

      {phase === "processing" && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          جارٍ قراءة الكتاب وتجهيزه للأسئلة، وده ممكن ياخد دقايق للكتب الكبيرة
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {result && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-primary/20 bg-primary/10 px-3.5 py-2.5 text-sm text-primary"
        >
          <CheckCircle2 className="h-4 w-4" />
          {result.status === "READY"
            ? "الكتاب جاهز، تقدر تسأله دلوقتي"
            : "تم رفع الكتاب، وبيتم تجهيزه"}
        </p>
      )}

      <MainButton
        type="submit"
        disabled={isPending || !file || !title.trim()}
        className="px-6"
        icon={<UploadCloud className="h-4 w-4" />}
        title={isPending ? "جارٍ المعالجة..." : "رفع الكتاب"}
      />
    </form>
  );
}