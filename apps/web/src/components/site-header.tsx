"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "./session-provider";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/wordmark";
import { cn, OWNER_APP_URL } from "@/lib/utils";

const links = [
  { href: "/venues", label: "الملاعب" },
  { href: "/#how", label: "طريقة الحجز" },
  { href: "/#owners", label: "لأصحاب الملاعب" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await createClient().auth.signOut();
    setOpen(false);
    router.replace("/");
  }

  const home = pathname === "/";

  return (
    <header
      className={cn(
        "z-40",
        home
          ? "absolute inset-x-0 top-0 border-transparent bg-gradient-to-b from-pitch-deep/80 via-pitch-deep/35 to-transparent"
          : "sticky top-0 border-b border-white/50 bg-white/60 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 md:px-6">
        <Wordmark />
        <nav
          className={cn(
            "hidden items-center gap-7 text-sm font-bold md:flex",
            home ? "text-white/90" : "text-text/80",
          )}
          aria-label="التنقل الرئيسي"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("transition-colors", home ? "hover:text-white" : "hover:text-pitch")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          {loading ? null : session ? (
            <>
              <Link
                href="/account/bookings"
                className={cn("text-sm font-bold", home ? "text-white/85 hover:text-white" : "text-text/75 hover:text-pitch")}
              >
                حجوزاتي
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className={cn("text-sm font-bold", home ? "text-white/85 hover:text-white" : "text-text/75 hover:text-pitch")}
              >
                خروج
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={cn("text-sm font-bold", home ? "text-white/85 hover:text-white" : "text-text/75 hover:text-pitch")}
            >
              دخول
            </Link>
          )}
          <Link
            href="/venues"
            className={cn(
              "inline-flex min-h-11 items-center rounded-[12px] px-4 text-sm font-bold",
              home ? "bg-gold text-pitch-deep hover:bg-gold-soft" : "bg-pitch text-white hover:bg-pitch-dark",
            )}
          >
            احجز ملعبك
          </Link>
        </div>
        <button
          className={cn("rounded-lg p-2 md:hidden", home ? "text-white" : "text-pitch")}
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-50 bg-pitch-deep/80 backdrop-blur-sm md:hidden">
          <div className="glass m-3 rounded-[12px] p-5">
            <div className="flex items-center justify-between">
              <Wordmark href={null} />
              <button onClick={() => setOpen(false)} aria-label="إغلاق القائمة" className="p-2">
                <X size={22} />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-4 font-display text-2xl font-extrabold" aria-label="قائمة الهاتف">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {session ? (
                <Link href="/account/bookings" onClick={() => setOpen(false)}>
                  حجوزاتي
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  دخول
                </Link>
              )}
              <a href={`${OWNER_APP_URL}/signup`} onClick={() => setOpen(false)}>
                لأصحاب الملاعب
              </a>
            </nav>
            <Link
              href="/venues"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-[12px] bg-pitch text-base font-bold text-white"
            >
              احجز ملعبك
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
