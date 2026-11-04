import { useQuery } from "@tanstack/react-query";
import { PARENT_STUDENTS_QUERY_KEY } from "@/constants";
import { listParentStudents } from "@/lib/parent";

export function useParentStudents() {
  return useQuery({
    queryKey: PARENT_STUDENTS_QUERY_KEY,
    queryFn: listParentStudents,
  });
}
