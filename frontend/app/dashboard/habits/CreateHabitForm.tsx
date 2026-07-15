"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateHabitFormProps {
  onCreate: (payload: { title: string }) => void;
  isCreating: boolean;
}

export function CreateHabitForm({ onCreate, isCreating }: CreateHabitFormProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim() });
    setTitle("");
  }

  return (
    <Card className="relative overflow-hidden border border-[#eff3f4] bg-white shadow-lg shadow-black/5 transition-all hover:shadow-xl hover:shadow-black/10">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#1d9bf0] via-[#1a8cd8] to-[#1d9bf0]/20" />
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="habit-title" className="text-sm font-semibold text-[#0f1419]">
              عادة جديدة
            </label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حل ١٠ أسئلة رياضيات يوميًا"
              required
              disabled={isCreating}
              className="h-11 rounded-xl border-[#eff3f4] bg-[#f7f9f9] px-4"
            />
          </div>
          <Button
            type="submit"
            disabled={isCreating || !title.trim()}
            className="h-11 rounded-xl bg-[#1d9bf0] px-6 font-semibold text-white hover:bg-[#1a8cd8]"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isCreating ? "جارٍ الإضافة..." : "إضافة عادة"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}