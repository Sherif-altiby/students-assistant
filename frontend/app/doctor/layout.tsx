import { RoleGuard } from "@/components/auth/RoleGuard";
import { Header } from "@/components/header/Header";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div>
        <Header />
        {children}
      </div>
  );
}
