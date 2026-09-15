import { AvailabilityRulesPanel } from "@/components/support/AvailabilityRulesPanel";
import { DoctorBookingsPanel } from "@/components/support/DoctorBookingsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, LayoutDashboard } from "lucide-react";

export default function DoctorBookingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <LayoutDashboard className="h-3.5 w-3.5" />
              لوحة التحكم
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              إدارة الحجوزات
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              تابع طلبات الحجز، نظم مواعيد إتاحتك، وأدر جلساتك من مكان واحد — بواجهة
              بسيطة وسريعة.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl bg-muted/60 p-1">
            <TabsTrigger
              value="bookings"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              الحجوزات
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CalendarClock className="me-2 h-4 w-4" />
              مواعيد الإتاحة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="focus-visible:outline-none">
            <DoctorBookingsPanel />
          </TabsContent>

          <TabsContent value="rules" className="focus-visible:outline-none">
            <AvailabilityRulesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}