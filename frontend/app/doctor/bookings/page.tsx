
import { AvailabilityRulesPanel } from "@/components/support/AvailabilityRulesPanel";
import { DoctorBookingsPanel } from "@/components/support/DoctorBookingsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DoctorBookingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">إدارة الحجوزات</h1>
        <p className="text-muted-foreground">
          تابع طلبات الحجز ونظم مواعيد إتاحتك من مكان واحد
        </p>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">الحجوزات</TabsTrigger>
          <TabsTrigger value="rules">مواعيد الإتاحة</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <DoctorBookingsPanel />
        </TabsContent>

        <TabsContent value="rules">
          <AvailabilityRulesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}