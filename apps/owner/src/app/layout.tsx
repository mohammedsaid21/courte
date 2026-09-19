import type { Metadata } from "next";
import { Changa, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"],
});

const display = Changa({
  subsets: ["arabic", "latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "كورت — لوحة صاحب الملعب",
  description: "إدارة الحجوزات والمواعيد والإيرادات للملاعب الرياضية.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${sans.variable} ${display.variable} bg-bg font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
