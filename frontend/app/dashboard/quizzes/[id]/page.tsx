"use client";

import { useParams } from "next/navigation";
import { QuizTaker } from "@/components/dashboard/quiz/QuizTaker";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  return <QuizTaker key={id} quizId={id} />;
}