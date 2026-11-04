import { ParentLayout } from "@/components/parent/ParentLayout";

export default function ParentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ParentLayout>{children}</ParentLayout>;
}
