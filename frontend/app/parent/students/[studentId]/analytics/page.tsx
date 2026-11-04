import { redirect } from "next/navigation";

export default async function ParentStudentAnalyticsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  redirect(`/parent/students/${studentId}`);
}
