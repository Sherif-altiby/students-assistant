"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CloudDownload, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudyTable } from "@/hooks/useStudyTable";
import { getStudySubject, listStudySubjects } from "@/lib/study-table";
import type {
  PlannedDay,
  PlannedWeek,
  StudySession,
  StudySessionReplacement,
  StudySubjectDetails,
  StudyTableDay,
  StudyTableSubject,
} from "@/types/study-table";
import { StudyTableTypeBadge } from "../StudyTableTypeBadge";

const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long", year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

interface EditableSession {
  key: string;
  subjectId: string;
  lessonId: string;
}

function getLessons(subject: StudySubjectDetails) {
  return subject.units
    .slice()
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .flatMap((unit) => unit.lessons
      .slice()
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
      .map((lesson) => ({ id: lesson.id, title: `${unit.title} — ${lesson.title}` })));
}

function DaySessionEditorRow({
  session,
  subjects,
  unavailableLessonIds,
  onChange,
  onRemove,
}: {
  session: EditableSession;
  subjects: Array<{ id: string; title: string }>;
  unavailableLessonIds: Set<string>;
  onChange: (session: EditableSession) => void;
  onRemove: () => void;
}) {
  const subjectQuery = useQuery({
    queryKey: ["study-subject", session.subjectId],
    queryFn: () => getStudySubject(session.subjectId),
    enabled: Boolean(session.subjectId),
  });
  const lessons = subjectQuery.data ? getLessons(subjectQuery.data) : [];

  return <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]">
    <label className="space-y-1 text-sm">
      <span>المادة</span>
      <select className={inputClass} value={session.subjectId}
        onChange={(event) => onChange({ ...session, subjectId: event.target.value, lessonId: "" })}>
        <option value="">اختر المادة</option>
        {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
      </select>
    </label>
    <label className="space-y-1 text-sm">
      <span>الدرس</span>
      <select className={inputClass} value={session.lessonId}
        disabled={!session.subjectId || subjectQuery.isLoading || !lessons.length}
        onChange={(event) => onChange({ ...session, lessonId: event.target.value })}>
        <option value="">{subjectQuery.isLoading ? "جارٍ تحميل الدروس..." : "اختر الدرس"}</option>
        {lessons.filter((lesson) => lesson.id === session.lessonId || !unavailableLessonIds.has(lesson.id))
          .map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
      </select>
      {subjectQuery.isError && <span role="alert" className="text-xs text-destructive">تعذر تحميل دروس المادة</span>}
    </label>
    <Button type="button" size="icon" variant="ghost" aria-label="حذف الدرس من اليوم"
      className="self-end text-destructive" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
  </div>;
}

function DaySessionEditor({
  day,
  unavailableLessonIds,
  tableSubjects,
  allSubjects,
  isSaving,
  onSave,
  onClose,
}: {
  day: StudyTableDay;
  unavailableLessonIds: Set<string>;
  tableSubjects: StudyTableSubject[];
  allSubjects: boolean;
  isSaving: boolean;
  onSave: (sessions: StudySessionReplacement[]) => Promise<void>;
  onClose: () => void;
}) {
  const subjectListQuery = useQuery({
    queryKey: ["study-subjects"],
    queryFn: listStudySubjects,
    enabled: allSubjects,
  });
  const subjects = allSubjects
    ? subjectListQuery.data ?? []
    : tableSubjects.map(({ subject }) => subject);
  const [sessions, setSessions] = useState<EditableSession[]>(() =>
    [...day.sessions].sort((a, b) => a.order - b.order).map((session) => ({
      key: session.id,
      subjectId: session.subjectId,
      lessonId: session.lessonId,
    })),
  );
  const isValid = sessions.every((session) => session.subjectId && session.lessonId)
    && new Set(sessions.map((session) => session.lessonId)).size === sessions.length;

  async function save() {
    if (!isValid) {
      toast.error("اختر مادة ودرساً لكل جلسة، ولا تكرر الدرس");
      return;
    }
    await onSave(sessions.map(({ subjectId, lessonId }, order) => ({ subjectId, lessonId, order })));
  }

  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>تعديل جلسات اليوم</DialogTitle>
        <DialogDescription>{dateLabel(day.date)} — اختر مادة ودرساً لكل جلسة.</DialogDescription>
      </DialogHeader>
      {allSubjects && subjectListQuery.isError && <p role="alert" className="text-sm text-destructive">
        تعذر تحميل المواد
      </p>}
      <div className="space-y-3">
        {sessions.map((session, index) => <DaySessionEditorRow key={session.key} session={session}
          subjects={subjects} unavailableLessonIds={unavailableLessonIds}
          onChange={(updated) => setSessions((current) => current.map((item, itemIndex) => itemIndex === index ? updated : item))}
          onRemove={() => setSessions((current) => current.filter((_, itemIndex) => itemIndex !== index))} />)}
        {!sessions.length && <p className="rounded-md border p-4 text-center text-sm text-muted-foreground">
          لا توجد جلسات لهذا اليوم
        </p>}
      </div>
      <Button type="button" variant="outline" className="w-full gap-2 sm:w-fit"
        disabled={!subjects.length || (allSubjects && subjectListQuery.isLoading)}
        onClick={() => setSessions((current) => [...current, {
          key: `new-${Date.now()}-${current.length}`,
          subjectId: subjects[0]?.id ?? "",
          lessonId: "",
        }])}>
        <Plus className="h-4 w-4" /> إضافة درس
      </Button>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        <Button type="button" disabled={isSaving || (allSubjects && subjectListQuery.isLoading)}
          onClick={() => void save()}>{isSaving ? "جارٍ الحفظ..." : "حفظ جلسات اليوم"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

function SessionsTable({
  days,
  onComplete,
  onDelete,
  onEditDay,
}: {
  days: PlannedDay<StudySession>[];
  onComplete: (id: string, value: boolean) => void;
  onDelete: (id: string) => void;
  onEditDay: (date: string) => void;
}) {
  return <div className="overflow-x-auto rounded-lg border">
    <Table className="min-w-[900px] text-right [&_tbody_tr:nth-child(odd)]:bg-muted/50 [&_tbody_tr:nth-child(even)]:bg-background">
      <TableHeader><TableRow className="bg-muted">
        <TableHead className="text-right">اليوم</TableHead><TableHead className="text-right">المادة</TableHead>
        <TableHead className="text-right">الدرس</TableHead><TableHead className="text-right">إنجاز</TableHead>
        <TableHead className="text-right">الإجراءات</TableHead>
      </TableRow></TableHeader>
      <TableBody>{days.flatMap((day) => {
        const sessions = [...day.sessions].sort((a, b) => a.order - b.order);
        const rows: React.ReactNode[] = [];
        if (!sessions.length) {
          rows.push(<TableRow key={`${day.date}-empty`}>
            <TableHead className="text-right">
              {dateLabel(day.date)}
            </TableHead>
            <TableCell colSpan={3} className="text-muted-foreground">لا توجد جلسات</TableCell>
            <TableCell>
              <Button size="icon-sm" variant="ghost" aria-label="تعديل جلسات اليوم"
                onClick={() => onEditDay(day.date)}><Pencil className="h-4 w-4" /></Button>
            </TableCell>
          </TableRow>);
        }
        sessions.forEach((session, index) => rows.push(<TableRow key={session.id}>
          {index === 0 && <TableHead rowSpan={sessions.length} className="min-w-36 align-top text-right">
            {dateLabel(day.date)}
          </TableHead>}
          <TableCell>{session.subject.title}</TableCell>
          <TableCell>{session.lesson.title}</TableCell>
          <TableCell><Checkbox aria-label={`إنجاز ${session.lesson.title}`}
            checked={Boolean(session.completedAt)} onCheckedChange={(checked) => onComplete(session.id, checked === true)} /></TableCell>
          <TableCell><div className="flex items-center gap-1">
            {index === 0 && <Button size="icon-sm" variant="ghost" aria-label="تعديل جلسات اليوم"
              onClick={() => onEditDay(day.date)}><Pencil className="h-4 w-4" /></Button>}
            <ConfirmDialog trigger={<Button size="icon" variant="ghost" aria-label="حذف الجلسة" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
              title="حذف الجلسة؟" description={`سيتم حذف درس "${session.lesson.title}" من هذا الجدول.`}
              confirmLabel="حذف" onConfirm={() => onDelete(session.id)} />
          </div></TableCell>
        </TableRow>));
        return rows;
      })}</TableBody>
    </Table>
  </div>;
}

function GlobalWeekTable({
  weeks,
  onComplete,
  onDelete,
  onEditDay,
}: {
  weeks: PlannedWeek[];
  onComplete: (id: string, value: boolean) => void;
  onDelete: (id: string) => void;
  onEditDay: (date: string) => void;
}) {
  return <div className="space-y-3">
    {weeks.map((week) => <section key={week.week} className="space-y-2">
      <h3 className="font-semibold">الأسبوع {week.week} ({dateLabel(week.startDate)} — {dateLabel(week.endDate)})</h3>
      <SessionsTable days={week.days} onComplete={onComplete} onDelete={onDelete}
        onEditDay={onEditDay} />
    </section>)}
  </div>;
}

export default function StudyTableDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const {
    table, progress, isLoading, error, progressError, updateTitle, isUpdatingTitle,
    toggleSessionComplete, deleteSession,
    replaceDaySessions, isReplacingDaySessions, downloadPdf, isDownloadingPdf, deleteTable,
  } = useStudyTable(id);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDay, setEditingDay] = useState<StudyTableDay | null>(null);

  if (isLoading) return <div className="m-4 h-48 animate-pulse rounded-lg bg-muted" />;
  if (error || !table) return <p role="alert" className="m-4 rounded-lg border p-6 text-center">
    تعذر العثور على جدول المذاكرة أو تحميله
  </p>;
  const tableData = table;

  async function handleDeleteTable() {
    try { await deleteTable(id); router.push("/dashboard/tables"); } catch { /* Error is reported by the mutation. */ }
  }
  async function handleDownload() {
    try {
      const blob = await downloadPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tableData.title}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { /* Error is reported by the mutation. */ }
  }
  const days = table.days.map((day) => ({ date: day.date, sessions: day.sessions }));

  return <main dir="rtl" className="space-y-6 p-4">
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-2">
        {editingTitle ? <form className="flex items-center gap-2" onSubmit={(event) => {
          event.preventDefault();
          const title = titleValue.trim();
          if (title && title !== table.title) updateTitle(title);
          setEditingTitle(false);
        }}>
          <Input autoFocus value={titleValue} maxLength={255} onChange={(event) => setTitleValue(event.target.value)} />
          <Button type="submit" disabled={isUpdatingTitle}>حفظ</Button>
        </form> : <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{table.title}</h1>
          <Button size="icon" variant="ghost" aria-label="تعديل العنوان" onClick={() => {
            setTitleValue(table.title); setEditingTitle(true);
          }}><Pencil className="h-4 w-4" /></Button>
        </div>}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <StudyTableTypeBadge type={table.type} />
          <span>{dateLabel(table.startDate)} — {dateLabel(table.endDate)}</span>
          <span>{table.allSubjects ? "جميع المواد" : `${table.subjects.length} مادة`}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => void handleDownload()} disabled={isDownloadingPdf} className="gap-2">
          {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
          تحميل PDF
        </Button>
        <ConfirmDialog trigger={<Button variant="outline" className="text-destructive"><Trash2 className="ml-1 h-4 w-4" />حذف</Button>}
          title="حذف الجدول؟" description={`سيتم حذف "${table.title}" وجميع جلساته.`}
          confirmLabel="حذف" onConfirm={() => { void handleDeleteTable(); }} />
      </div>
      <div className="w-full space-y-2 border-t pt-3">
        <div className="flex justify-between text-sm">
          <span>التقدم العام{progressError ? " — تعذر تحميل التقدم" : ""}</span>
          <span>{progress?.completed ?? 0} من {progress?.total ?? 0} ({progress?.percent ?? 0}%)</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress?.percent ?? 0}%` }} />
        </div>
        {progress?.late ? <p className="text-sm text-red-700">{progress.late} جلسة متأخرة</p> : null}
      </div>
    </section>

    {table.type === "GLOBAL" && table.months ? table.months.map((month) => <details key={`${month.year}-${month.month}`} open className="space-y-3 rounded-lg border p-4">
      <summary className="cursor-pointer text-lg font-semibold">{month.monthName} {month.year}</summary>
      <GlobalWeekTable weeks={month.weeks as PlannedWeek<StudySession>[]} onComplete={toggleSessionComplete}
        onDelete={deleteSession} onEditDay={(date) => {
          const day = tableData.days.find((item) => item.date.slice(0, 10) === date.slice(0, 10));
          if (day) setEditingDay(day);
        }} />
    </details>) : <SessionsTable days={days} onComplete={toggleSessionComplete}
      onDelete={deleteSession} onEditDay={(date) => {
        const day = tableData.days.find((item) => item.date.slice(0, 10) === date.slice(0, 10));
        if (day) setEditingDay(day);
      }} />}

    {table.days.every((day) => day.sessions.length === 0) && <p className="rounded-lg border p-6 text-center text-muted-foreground">
      لا توجد جلسات في هذا الجدول
    </p>}
    {editingDay && <DaySessionEditor key={editingDay.id} day={editingDay}
      unavailableLessonIds={new Set(table.days
        .filter((day) => day.id !== editingDay.id)
        .flatMap((day) => day.sessions.map((session) => session.lessonId)))}
      tableSubjects={table.subjects}
      allSubjects={table.allSubjects} isSaving={isReplacingDaySessions}
      onSave={async (sessions) => {
        try {
          await replaceDaySessions({ dayId: editingDay.id, sessions });
          setEditingDay(null);
        } catch {
          // The mutation reports the failure through the shared toast handler.
        }
      }} onClose={() => setEditingDay(null)} />}
  </main>;
}
