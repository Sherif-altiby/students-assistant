"use client";

import { useState } from "react";
import { Download, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useStudyTables } from "@/hooks/useStudyTables";
import { CreateStudyTableDialog } from "./CreateStudyTableDialog";
import { StudyTableTypeBadge } from "./StudyTableTypeBadge";

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

export default function StudyTablesPage() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const {
    tables, pagination, isLoading, error, page, setPage,
    createTableAsync, generateTableAsync, isCreating, isGenerating,
    updateTableAsync, isUpdating, deleteTableAsync, isDeleting,
    downloadPdfAsync, isDownloadingPdf,
  } = useStudyTables();

  async function saveTitle(id: string) {
    const title = editTitle.trim();
    if (!title) return;
    try {
      await updateTableAsync({ id, payload: { title } });
      setEditingId(null);
    } catch {
      // Mutation error handler displays the API failure.
    }
  }

  async function download(id: string, title: string) {
    try {
      const blob = await downloadPdfAsync(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Mutation error handler displays the API failure.
    }
  }

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="جداول المذاكرة" description="تابع خططك الدراسية وإنجازك" />
        <CreateStudyTableDialog
          onCreate={createTableAsync}
          onGenerate={(payload, preview) => generateTableAsync({ payload, preview })}
          isCreating={isCreating || isGenerating}
        />
      </div>

      {error && <p role="alert" className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
        تعذر تحميل جداول المذاكرة. يرجى المحاولة مرة أخرى.
      </p>}
      {isLoading ? <div className="h-48 animate-pulse rounded-lg bg-muted" /> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[850px] text-right">
            <TableHeader><TableRow>
              <TableHead className="text-right">العنوان</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">الفترة</TableHead>
              <TableHead className="text-right">المواد</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {tables.map((table) => <TableRow
                key={table.id}
                tabIndex={0}
                aria-label={`فتح جدول ${table.title}`}
                className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => router.push(`/dashboard/tables/${table.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/dashboard/tables/${table.id}`);
                  }
                }}
              >
                <TableCell className="font-medium">
                  {editingId === table.id ? <div
                    className="flex min-w-48 items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={255} />
                    <Button size="icon" aria-label="حفظ العنوان" disabled={isUpdating} onClick={() => void saveTitle(table.id)}>
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="إلغاء التعديل" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </div> : <span className="hover:text-primary">{table.title}</span>}
                </TableCell>
                <TableCell><StudyTableTypeBadge type={table.type} /></TableCell>
                <TableCell>{dateLabel(table.startDate)} — {dateLabel(table.endDate)}</TableCell>
                <TableCell>{table.allSubjects ? "جميع المواد" : table.subjects.map(({ subject }) => subject.title).join("، ") || "—"}</TableCell>
                <TableCell><div
                  className="flex items-center gap-1"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Button size="icon" variant="ghost" aria-label="تعديل الجدول"
                    onClick={() => { setEditingId(table.id); setEditTitle(table.title); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="تحميل PDF"
                    disabled={isDownloadingPdf} onClick={() => void download(table.id, table.title)}>
                    {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </Button>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" aria-label="حذف الجدول" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                    title="حذف الجدول؟"
                    description={`سيتم حذف "${table.title}" وجميع جلساته.`}
                    confirmLabel="حذف"
                    onConfirm={() => { void deleteTableAsync(table.id); }}
                  />
                </div></TableCell>
              </TableRow>)}
              {!tables.length && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                لا توجد جداول مذاكرة بعد
              </TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" onClick={(event) => {
            event.preventDefault(); setPage((current) => Math.max(1, current - 1));
          }} /></PaginationItem>
          {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((current) =>
            <PaginationItem key={current}><PaginationLink href="#" isActive={current === page}
              onClick={(event) => { event.preventDefault(); setPage(current); }}>{current}</PaginationLink></PaginationItem>)}
          <PaginationItem><PaginationNext href="#" onClick={(event) => {
            event.preventDefault(); setPage((current) => Math.min(pagination.totalPages, current + 1));
          }} /></PaginationItem>
        </PaginationContent>
      </Pagination>}
      {isDeleting && <span className="sr-only" role="status">جارٍ حذف الجدول</span>}
    </div>
  );
}
