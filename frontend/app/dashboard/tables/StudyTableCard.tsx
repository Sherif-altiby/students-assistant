"use client";

import Link from "next/link";
import { Calendar, Hash, Trash2, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
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
    <Card
      className=" group relative overflow-hidden border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg "
    >
      {/* Hover gradient */}
       
      <Link href={`/dashboard/tables/${table.id}`} className="flex flex-col gap-4" >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className=" truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary " >
              {table.title}
            </h3>

            <p className="text-xs text-muted-foreground">
              جدول مذاكرة
            </p>
          </div>

          {/* <StudyTableTypeBadge type={table.type} /> */}
        </div>


        {/* Date info */}
        <div
          className=" flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground "
        >
          <div className="flex items-center gap-2">
            {table.type === "DATE_RANGE" ? (
              <Calendar className="h-4 w-4 text-primary" />
            ) : (
              <Hash className="h-4 w-4 text-primary" />
            )}

            <span>
              {formatShortDate(table.startDate)}
              {" — "}
              {formatShortDate(table.endDate)}
            </span>
          </div>

          <ArrowLeft
            className=" h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 "
          />
        </div>
      </Link>


      {/* Delete */}
      <ConfirmDialog
        trigger={
          <Button
            size="icon"
            variant="ghost"
            aria-label="حذف الجدول"
            className=" absolute left-3 top-3 h-8 w-8 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-10 max-md:opacity-100 "
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