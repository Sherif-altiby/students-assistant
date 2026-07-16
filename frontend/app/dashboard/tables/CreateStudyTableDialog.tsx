"use client";

import { useState } from "react";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CreateStudyTablePayload, StudyTableType } from "@/types/study-table";
import MainButton from "@/components/ui/MainButton";

interface CreateStudyTableDialogProps {
  onCreate: (payload: CreateStudyTablePayload) => void;
  isCreating: boolean;
}

export function CreateStudyTableDialog({ onCreate, isCreating }: CreateStudyTableDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudyTableType>("DATE_RANGE");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [numberOfDays, setNumberOfDays] = useState("7");

  function reset() {
    setTitle("");
    setType("DATE_RANGE");
    setStartDate(undefined);
    setEndDate(undefined);
    setNumberOfDays("7");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateStudyTablePayload =
      type === "DATE_RANGE"
        ? {
          title: title.trim(),
          type,
          startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
        }
        : {
          title: title.trim(),
          type,
          numberOfDays: Number(numberOfDays)
        };

    onCreate(payload);
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger  >
        <MainButton
          title="جدول مذاكرة جديد"
          icon={<Plus className="h-4 w-4" />}
        />
      </DialogTrigger>

      <DialogContent dir="rtl" className=" sm:max-w-lg  rounded-3xl  p-0  overflow-hidden border-border/50 shadow-2xl "
      >
        {/* Header */}
        <div
          className="
        relative
         px-6
        py-6
      "
        >
          <DialogHeader>


            <DialogTitle className=" text-center text-2xl font-bold text-primary" >
              إنشاء جدول مذاكرة
            </DialogTitle>

            <p className=" mt-2 text-center text-sm text-muted-foreground ">
              نظّم وقتك وخطط لمذاكرتك بذكاء
            </p>
          </DialogHeader>
        </div>


        <form onSubmit={handleSubmit} className=" space-y-5 px-6 pb-6 " >

          {/* Title */}
          <div className="space-y-2">
            <label className=" text-sm font-semibold block"> عنوان الجدول </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: جدول مراجعة الفصل الدراسي" className=" h-12 rounded-2xl bg-muted/30 border-border/60 transition focus-visible:ring-4 focus-visible:ring-primary/10 " />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold block"> نوع الجدول </label>
            <Select value={type} onValueChange={(v) => setType(v as StudyTableType)} >
              <SelectTrigger className=" !h-11 w-full rounded-2xl bg-muted/30 border-border/60 ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className=" rounded-2xl p-2 " >

                <SelectItem value="DATE_RANGE" className=" rounded-xl py-3 cursor-pointer ">
                  فترة زمنية محددة
                </SelectItem>
                <SelectItem value="NUMBER_OF_DAYS" className=" rounded-xl py-3 cursor-pointer " >
                  عدد أيام
                </SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Date Range */}
          {type === "DATE_RANGE" ? (

            <div className=" grid gap-4 " >

              {[ { label: "تاريخ البداية", value: startDate, set: setStartDate },
                { label: "تاريخ النهاية", value: endDate, set: setEndDate }
              ].map((item, index) => (

                <div key={index} className="space-y-2 " >

                  <label className="text-sm font-semibold block"> {item.label} </label>
                  <Popover>
                    <PopoverTrigger  className="w-full" >
                      <Button variant="outline" className=" h-12 w-full justify-start rounded-2xl bg-muted/30 border-border/60 font-normal " >
                        <CalendarIcon className=" ml-2 h-4 w-4 text-primary " />
                        { item.value ? format( item.value, "PPP", { locale: arSA } ) : "اختر التاريخ" }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className=" rounded-2xl p-0 shadow-xl " >

                      <Calendar
                        mode="single"
                        selected={item.value}
                        onSelect={item.set}
                        locale={arSA}
                        disabled={index === 1 && startDate ? (date) => date < startDate : undefined}
                      />

                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>

          ) : (

            <div className="space-y-2">

              <label className="text-sm font-semibold">
                عدد الأيام
              </label>


              <div className="relative">

                <Input type="number" min={1} value={numberOfDays} onChange={(e) => setNumberOfDays(e.target.value)} className=" h-12 rounded-2xl bg-muted/30 pr-12 " />

                <span className=" absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground " >
                  يوم
                </span>
              </div>
            </div>

          )}

          {/* Submit */}
          <Button
            disabled={isCreating || !title.trim() || (type === "DATE_RANGE" && (!startDate || !endDate))}
            type="submit"
            className=" h-12 w-full rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] "
          >

            {isCreating ?
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري الإنشاء...
              </>
              : "إنشاء الجدول"}
          </Button>


        </form>

      </DialogContent>

    </Dialog>
  );
}