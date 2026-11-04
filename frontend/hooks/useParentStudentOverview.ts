import { useQuery } from "@tanstack/react-query";
import { getParentStudentOverview } from "@/lib/parent";

export function useParentStudentOverview(studentId: string) {
  return useQuery({
    queryKey: ["parent", "student", studentId, "overview"],
    queryFn: () => getParentStudentOverview(studentId),
    enabled: Boolean(studentId),
  });
}
