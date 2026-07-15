"use client";

import Link from "next/link";
import { Calendar, Hash, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { StudyTableTypeBadge } from "./StudyTableTypeBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
 import type { StudyTableSummary } from "@/types/study-table";
import { formatShortDate } from "@/data/date";

interface StudyTableCardProps {
  table: StudyTableSummary;
  onDelete: (id: string) => void;
}

export function StudyTableCard({ table, onDelete }: StudyTableCardProps) {
  return (
    <Card className="group relative flex flex-col gap-3 p-5 transition-shadow hover:shadow-md">
      <Link href={`/dashboard/tables/${table.id}`} className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2 pl-8">
          <h3 className="text-base font-semibold text-foreground">{table.title}</h3>
          <StudyTableTypeBadge type={table.type} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {table.type === "DATE_RANGE" ? (
            <Calendar className="h-4 w-4" />
          ) : (
            <Hash className="h-4 w-4" />
          )}
          <span>
            {formatShortDate(table.startDate)} — {formatShortDate(table.endDate)}
          </span>
        </div>
      </Link>

      <ConfirmDialog
        trigger={
          <Button
            size="icon"
            variant="ghost"
            aria-label="حذف الجدول"
            className="absolute left-3 top-3 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
        title="حذف الجدول؟"
        description={`سيتم حذف "${table.title}" وكل بياناته نهائيًا. لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        onConfirm={() => onDelete(table.id)}
      />
    </Card>
  );
}