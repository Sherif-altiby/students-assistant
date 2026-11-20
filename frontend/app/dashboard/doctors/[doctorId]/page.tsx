"use client";

import { SlotPicker } from "@/components/support/SlotPicker";
import { use } from "react";

interface DoctorSlotsPageProps {
  params: Promise<{ doctorId: string }>;
}

export default function DoctorSlotsPage({ params }: DoctorSlotsPageProps) {
  const { doctorId } = use(params);

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">حجز موعد</h1>
        <p className="text-muted-foreground">
          اختر الموعد المناسب من مواعيد الطبيب المتاحة
        </p>
      </div>

      <SlotPicker doctorId={doctorId} />
    </div>
  );
}