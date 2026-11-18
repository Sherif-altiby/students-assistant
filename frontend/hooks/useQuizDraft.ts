"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizAnswers } from "@/types/quiz";

const draftKey = (quizId: string) => `quiz-draft:${quizId}`;

// Every storage call is wrapped: the quiz must work even when storage is blocked
function readDraft(quizId: string): QuizAnswers {
  try {
    const raw = window.localStorage.getItem(draftKey(quizId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const clean: QuizAnswers = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") clean[id] = value;
    }
    return clean;
  } catch {
    return {};
  }
}

function writeDraft(quizId: string, answers: QuizAnswers) {
  try {
    if (Object.keys(answers).length === 0) {
      window.localStorage.removeItem(draftKey(quizId));
    } else {
      window.localStorage.setItem(draftKey(quizId), JSON.stringify(answers));
    }
  } catch {
    // the draft is optional
  }
}

export function useQuizDraft(quizId: string, questionIds: string[]) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const latest = useRef<QuizAnswers>({});
  const idsKey = questionIds.join(",");

  // Restore the draft after mount (localStorage does not exist on the server)
  useEffect(() => {
    const allowed = new Set(idsKey.split(","));
    const restored: QuizAnswers = {};
    for (const [id, value] of Object.entries(readDraft(quizId))) {
      if (allowed.has(id)) restored[id] = value;
    }
    latest.current = restored;
    setAnswers(restored);
  }, [quizId, idsKey]);

  const setAnswer = useCallback(
    (questionId: string, value: string) => {
      const next = { ...latest.current };
      if (value === "") delete next[questionId];
      else next[questionId] = value;
      latest.current = next;
      setAnswers(next);
      writeDraft(quizId, next);
    },
    [quizId],
  );

  const clear = useCallback(() => {
    latest.current = {};
    setAnswers({});
    writeDraft(quizId, {});
  }, [quizId]);

  return { answers, setAnswer, clear };
}