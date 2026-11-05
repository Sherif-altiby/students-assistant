import { RoleGuard } from "@/components/auth/RoleGuard";
import { Header } from "@/components/header/Header";
import { DOCTOR_ALLOWED_ROLES } from "@/constants";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={DOCTOR_ALLOWED_ROLES}>
      <div>
        <Header />
        {children}
      </div>
    </RoleGuard>
  );
}
