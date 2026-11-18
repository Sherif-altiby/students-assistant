"use client";

import { useParams } from "next/navigation";
import { AttemptScreen } from "@/components/dashboard/quiz/AttemptScreen";

export default function AttemptPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  return <AttemptScreen key={attemptId} quizId={id} attemptId={attemptId} />;
}