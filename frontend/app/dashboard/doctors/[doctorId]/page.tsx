import { SlotPicker } from "@/components/support/SlotPicker";

interface DoctorSlotsPageProps {
  params: { doctorId: string };
}

export default function DoctorSlotsPage({ params }: DoctorSlotsPageProps) {
  return (
    <div className=" space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">حجز موعد</h1>
        <p className="text-muted-foreground">اختر الموعد المناسب من مواعيد الطبيب المتاحة</p>
      </div>

      <SlotPicker doctorId={params.doctorId} />
    </div>
  );
}