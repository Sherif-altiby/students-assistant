import type { Metadata } from "next";
import { El_Messiri } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
 
const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-el-messiri",
});

export const metadata: Metadata = {
  title: "ثانوية أسيستنت | لوحة متابعة الطالب",
  description: "منصة متابعة المذاكرة، العادات، والدعم النفسي لطلاب الثانوية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={elMessiri.variable} >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
