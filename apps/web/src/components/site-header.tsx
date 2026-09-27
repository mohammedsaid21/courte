"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "./session-provider";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/wordmark";
import { exploreVenuesHref, signupWithNext, VENUE_DISCOVERY_PATH } from "@/lib/auth-routes";
import { cn, OWNER_APP_URL } from "@/lib/utils";

const publicLinks = [
  { href: "/#how", label: "كيف يعمل" },
  { href: "/#sports", label: "الرياضات" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const home = pathname === "/";
  const authed = Boolean(session);
  const gameHref = loading ? signupWithNext(VENUE_DISCOVERY_PATH) : exploreVenuesHref(authed);
  const signupHref = signupWithNext(VENUE_DISCOVERY_PATH);
  const loginHref = `/login?next=${encodeURIComponent(VENUE_DISCOVERY_PATH)}`;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!home) return;
    const onScroll = () => setScrolled(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [home]);

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

  const solid = home && scrolled;
  const transparentHero = home && !scrolled;

  return (
    <header
      className={cn(
        "z-40 transition-colors duration-300",
        home ? "fixed inset-x-0 top-0" : "sticky top-0 border-b border-line bg-white/95 backdrop-blur-md",
        solid && "border-b border-arena-pitch/30 bg-arena-stadium/95 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 md:px-8">
        <Wordmark variant={transparentHero ? "stadium" : home ? "brand" : "classic"} />
        <nav
          className={cn(
            "hidden items-center gap-8 text-sm font-bold md:flex",
            transparentHero ? "text-white/85" : home ? "text-white/90" : "text-copy-secondary",
          )}
          aria-label="التنقل الرئيسي"
        >
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors",
                transparentHero ? "hover:text-arena-lime" : home ? "hover:text-white" : "hover:text-arena-deep",
              )}
            >
              {link.label}
            </Link>
          ))}
          {authed && (
            <Link
              href="/venues"
              className={cn(transparentHero ? "hover:text-arena-lime" : home ? "hover:text-white" : "hover:text-arena-deep")}
            >
              الملاعب
            </Link>
          )}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : authed ? (
            <>
              <Link
                href="/account/bookings"
                className={cn(
                  "text-sm font-bold",
                  transparentHero ? "text-white/85 hover:text-white" : home ? "text-white/85" : "text-copy-secondary hover:text-arena-deep",
                )}
              >
                حجوزاتي
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className={cn(
                  "text-sm font-bold",
                  transparentHero ? "text-white/85 hover:text-white" : home ? "text-white/85" : "text-copy-secondary",
                )}
              >
                خروج
              </button>
              <Link
                href={gameHref}
                className="inline-flex min-h-11 items-center bg-arena px-4 text-sm font-black text-arena-stadium hover:bg-arena-lime hover:text-arena-stadium"
              >
                اعثر على مباراتك
              </Link>
            </>
          ) : (
            <>
              <Link
                href={loginHref}
                className={cn(
                  "text-sm font-bold",
                  transparentHero ? "text-white/85 hover:text-white" : home ? "text-white/85" : "text-copy-secondary hover:text-arena-deep",
                )}
              >
                دخول
              </Link>
              <Link
                href={signupHref}
                className="inline-flex min-h-11 items-center bg-arena px-4 text-sm font-black text-arena-stadium hover:bg-arena-deep hover:text-white"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
        <button
          className={cn("rounded-lg p-2 md:hidden", transparentHero || home ? "text-white" : "text-arena-stadium")}
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-50 bg-arena-stadium/90 backdrop-blur-sm md:hidden">
          <div className="m-3 border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <Wordmark href={null} variant="brand" />
              <button onClick={() => setOpen(false)} aria-label="إغلاق القائمة" className="p-2">
                <X size={22} />
              </button>
            </div>
            <nav className="mt-8 flex flex-col gap-4 font-display text-xl font-extrabold text-copy-primary" aria-label="قائمة الهاتف">
              {publicLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {authed ? (
                <>
                  <Link href="/venues" onClick={() => setOpen(false)}>الملاعب</Link>
                  <Link href="/account/bookings" onClick={() => setOpen(false)}>حجوزاتي</Link>
                  <button type="button" className="text-start" onClick={() => void logout()}>خروج</button>
                </>
              ) : (
                <>
                  <Link href={loginHref} onClick={() => setOpen(false)}>دخول</Link>
                  <Link href={signupHref} onClick={() => setOpen(false)}>إنشاء حساب</Link>
                </>
              )}
              <a href={`${OWNER_APP_URL}/signup`} onClick={() => setOpen(false)}>لأصحاب الملاعب</a>
            </nav>
            <Link
              href={gameHref}
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center bg-arena text-base font-black text-arena-stadium"
            >
              اعثر على مباراتك
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
