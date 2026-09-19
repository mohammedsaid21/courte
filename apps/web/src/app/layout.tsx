import type { Metadata } from "next";
import { Changa, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { SessionProvider } from "@/components/session-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_NAME, SITE_URL } from "@/lib/utils";
import "./globals.css";

const display = Changa({
  subsets: ["arabic", "latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const body = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ملعبك جاهز`,
    template: `%s · ${SITE_NAME}`,
  },
  description: "اعثر على ملعب كرة قدم في مدينتك واحجزه خلال دقائق.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "ar_PS",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${display.variable} ${body.variable} bg-bg font-sans antialiased`}>
        <SessionProvider>
          <SiteHeader />
          <main className="min-h-[calc(100vh-4.5rem)] pb-20 md:pb-0">{children}</main>
          <SiteFooter />
          <BottomNav />
        </SessionProvider>
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
