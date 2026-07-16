"use client";

import { useState, type FormEvent } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateHabitFormProps {
  onCreate: (payload: { title: string }) => void;
  isCreating: boolean;
}

export function CreateHabitForm({ onCreate, isCreating }: CreateHabitFormProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate({ title: trimmed });
    setTitle("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:gap-4"
    >
      <div className="flex-1 space-y-2">
        <label htmlFor="habit-title" className="text-sm   font-medium text-foreground">
          عادة جديدة
        </label> 
        <Input
          id="habit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: حل ١٠ أسئلة رياضيات يوميًا"
          required
          disabled={isCreating}
          className="h-11 rounded-[var(--radius-md)] mt-2 bg-input/30 border-vorder"
        />
      </div>
      <Button
        type="submit"
        disabled={isCreating || !title.trim()}
        className="h-11 gap-2 rounded-[var(--radius-md)] bg-primary px-5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {isCreating ? "جارٍ الإضافة..." : "إضافة عادة"}
      </Button>
    </form>
  );
}