import { RoleGuard } from "@/components/auth/RoleGuard";
import { Header } from "@/components/header/Header";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["DOCTOR"]}>
      <div>
        <Header />
        {children}
      </div>
    </RoleGuard>
  );
}
