"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateStudySubjectDialog } from "./CreateStudySubjectDialog";
import {
  SubjectsEmptyState,
  SubjectsGrid,
  SubjectsLoadError,
  SubjectsLoadingSkeleton,
} from "@/components/dashboard/subjects/subjects-page-components";
import { listStudySubjectsPage } from "@/lib/study-table";
import { useAuthStore } from "@/store/useAuthStore";

export default function StudySubjectsPage() {
  const user = useAuthStore((state) => state.user);
  const subjectsQuery = useQuery({
    queryKey: ["study-subjects", 1, 100],
    queryFn: () => listStudySubjectsPage({ page: 1, limit: 100 }),
  });

  return (
    <main dir="rtl" className="space-y-6 p-4">
      <PageHeader
        title="المواد الدراسية"
        description="تابع تقدمك الدراسي وحالة إنجاز الدروس في كل مادة"
      />
      {user?.role === "USER" && <CreateStudySubjectDialog />}

      {subjectsQuery.isLoading && <SubjectsLoadingSkeleton />}
      {subjectsQuery.isError && <SubjectsLoadError />}
      {subjectsQuery.data?.length === 0 && (
        <SubjectsEmptyState
          canCreate={user?.role === "USER"}
          createAction={<CreateStudySubjectDialog />}
        />
      )}
      {subjectsQuery.data && subjectsQuery.data.length > 0 && (
        <SubjectsGrid subjects={subjectsQuery.data} />
      )}
    </main>
  );
}