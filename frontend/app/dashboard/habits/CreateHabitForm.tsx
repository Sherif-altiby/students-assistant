"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { FormInput } from "@/components/FormInput";
import MainButton from "@/components/ui/MainButton";

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
      <div className="flex-1">
        <FormInput
          label="عادة جديدة"
          id="habit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: حل ١٠ أسئلة رياضيات يوميًا"
          required
          disabled={isCreating}
        />
      </div>
      <MainButton
        type="submit"
        disabled={isCreating || !title.trim()}
        loading={isCreating}
        icon={<Plus />}
        title="إضافة عادة"
        loadingTitle="جارٍ الإضافة..."
      />
    </form>
  );
}