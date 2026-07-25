import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        {/* Your admin layout */}
        {children}
      </div>
    // </RoleGuard>
  );
}
