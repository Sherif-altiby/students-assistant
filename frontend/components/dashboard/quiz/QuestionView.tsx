"use client";

import { Check } from "lucide-react";
import type { QuizLanguage, QuizQuestion } from "@/types/quiz";
import { tfLabel } from "@/lib/quiz-text";
import { BlankPrompt } from "./BlankPrompt";

interface QuestionViewProps {
  question: QuizQuestion;
  value: string;
  language: QuizLanguage;
  disabled: boolean;
  onChange: (value: string) => void;
}

const optionBase =
  "flex cursor-pointer gap-3 rounded-xl border p-3.5 text-sm transition-colors focus-within:outline-2 focus-within:outline-primary";

export function QuestionView({
  question,
  value,
  language,
  disabled,
  onChange,
}: QuestionViewProps) {
  if (question.type === "FILL_BLANK") {
    const promptId = `prompt-${question.id}`;
    return (
      <div className="space-y-4">
        <p id={promptId} className="text-base font-bold leading-loose text-foreground">
          <BlankPrompt prompt={question.prompt} />
        </p>
        <input
          type="text"
          dir="auto"
          aria-labelledby={promptId}
          value={value}
          disabled={disabled}
          maxLength={200}
          autoComplete="off"
          placeholder="اكتب إجابتك هنا"
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary/60 disabled:opacity-60"
        />
      </div>
    );
  }

  if (question.type === "TRUE_FALSE") {
    return (
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-base font-bold leading-relaxed text-foreground">
          {question.prompt}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((choice) => {
            const optionValue = String(choice);
            const checked = value === optionValue;
            const id = `${question.id}-${optionValue}`;
            return (
              <label
                key={optionValue}
                htmlFor={id}
                className={`${optionBase} items-center justify-center border-2 p-5 text-lg font-bold ${
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <input
                  id={id}
                  type="radio"
                  name={question.id}
                  value={optionValue}
                  checked={checked}
                  onChange={() => onChange(optionValue)}
                  className="sr-only"
                />
                {checked && <Check className="h-5 w-5" aria-hidden="true" />}
                {tfLabel(language, choice)}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  // MCQ: native radio inputs, so arrow keys work inside the group
  return (
    <fieldset className="space-y-2.5" disabled={disabled}>
      <legend className="mb-3 text-base font-bold leading-relaxed text-foreground">
        {question.prompt}
      </legend>
      {question.options.map((option, i) => {
        const optionValue = String(i);
        const checked = value === optionValue;
        const id = `${question.id}-${i}`;
        return (
          <label
            key={id}
            htmlFor={id}
            className={`${optionBase} items-start ${
              checked
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <input
              id={id}
              type="radio"
              name={question.id}
              value={optionValue}
              checked={checked}
              onChange={() => onChange(optionValue)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
            />
            <span dir="auto" className="flex-1 leading-relaxed">
              {option}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}