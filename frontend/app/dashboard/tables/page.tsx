"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  getPaginationPages,
} from "@/components/ui/pagination";
import { useStudyTables } from "@/hooks/useStudyTables";
import { CreateStudyTableDialog } from "./CreateStudyTableDialog";
import { StudyTablesTable } from "./StudyTablesTable";

export default function StudyTablesPage() {
  const router = useRouter();
  const {
    tables, pagination, isLoading, error, page, setPage,
    createTableAsync, generateTableAsync, isCreating, isGenerating,
    deleteTableAsync, isDeleting,
    downloadPdfAsync, isDownloadingPdf,
  } = useStudyTables();

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
      <StudyTablesTable
        tables={tables}
        isLoading={isLoading}
        isDownloadingPdf={isDownloadingPdf}
        onOpen={(id) => router.push(`/dashboard/tables/${id}`)}
        onDownload={(table) => void download(table.id, table.title)}
        onDelete={(id) => void deleteTableAsync(id)}
      />

      {pagination && pagination.totalPages > 1 && <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="#" onClick={(event) => {
            event.preventDefault(); setPage((current) => Math.max(1, current - 1));
          }} /></PaginationItem>
          {getPaginationPages(page, pagination.totalPages).map((current) =>
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
