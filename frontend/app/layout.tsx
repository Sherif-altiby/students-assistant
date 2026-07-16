import type { Metadata } from "next";
import { El_Messiri } from "next/font/google";
import { Changa } from "next/font/google";
import { Playpen_Sans } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryClientProvider";
import { ThemeInitializer } from "@/components/ThemeInitializer";

const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-el-messiri",
});

const changa = Changa({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ثانوية أسيستنت | لوحة متابعة الطالب",
  description: "منصة متابعة المذاكرة، العادات، والدعم النفسي لطلاب الثانوية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={changa.className}> 
      <body>
        <ThemeInitializer>
          <QueryProvider>
            <AuthProvider>
              
               {children}
            </AuthProvider>
          </QueryProvider>
        </ThemeInitializer>
      </body>
    </html>
  );
}
