"use client";

import Link from "next/link";
import { Calendar, Hash, Trash2, ChevronRight, BookOpen } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudyTableTypeBadge } from "./StudyTableTypeBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";

import type { StudyTableSummary } from "@/types/study-table";
import { formatShortDate } from "@/data/date";
import { cn } from "@/lib/utils";

interface StudyTableCardProps {
  table: StudyTableSummary;
  onDelete: (id: string) => void;
}

export function StudyTableCard({ table, onDelete }: StudyTableCardProps) {

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/40 bg-card transition-all duration-300 hover:shadow-lg",
        "hover:border-primary/20 hover:-translate-y-1"
      )}
    >
      <Link href={`/dashboard/tables/${table.id}`} className="block p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <h3 className="truncate text-base font-semibold text-foreground">
                {table.title}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatShortDate(table.startDate)}</span>
              {table.endDate && (
                <>
                  <span>•</span>
                  <span>{formatShortDate(table.endDate)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <StudyTableTypeBadge type={table.type} />
            
            <ConfirmDialog
              trigger={
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="حذف الجدول"
                  className="h-7 w-7 text-muted-foreground/30 transition-all hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={(e) => e.preventDefault()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              }
              title="حذف الجدول؟"
              description={`سيتم حذف "${table.title}" وكل بياناته نهائيًا.`}
              confirmLabel="حذف"
              onConfirm={() => onDelete(table.id)}
            />
          </div>
        </div>

        {/* Progress Bar */}
        {/* {progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">التقدم</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )} */}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-border/20">
          <div className="flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">
            <span>عرض الجدول</span>
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </Card>
  );
}