import type { Metadata } from "next";
import { Cairo } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

// Cairo is a variable font, so every weight (200–1000) is available
// without listing them.
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
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
    <html lang="ar" dir="rtl" className={cairo.className}>
      <body>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}