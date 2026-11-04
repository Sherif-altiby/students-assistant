import type { ParentOverview, ParentStudentSection } from "@/types/parent";
import { ParentStudentHabitsSection } from "./student-sections/ParentStudentHabitsSection";
import { ParentStudentLessonsSection } from "./student-sections/ParentStudentLessonsSection";
import { ParentStudentTablesSection } from "./student-sections/ParentStudentTablesSection";
import { ParentStudentTasksSection } from "./student-sections/ParentStudentTasksSection";

export function ParentStudentSectionContent({
  section,
  overview,
}: {
  section: ParentStudentSection;
  overview: ParentOverview;
}) {
  switch (section) {
    case "tasks":
      return <ParentStudentTasksSection overview={overview} />;
    case "habits":
      return <ParentStudentHabitsSection overview={overview} />;
    case "tables":
      return <ParentStudentTablesSection overview={overview} />;
    case "lessons":
      return <ParentStudentLessonsSection overview={overview} />;
  }
}
