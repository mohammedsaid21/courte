"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  LogOut,
  Menu,
  Repeat,
  Settings2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useVenue } from "./venue-provider";

const operate = [
  { href: "/home", label: "اليوم", icon: Zap },
  { href: "/calendar", label: "الجدول", icon: CalendarDays },
  { href: "/bookings", label: "الحجوزات", icon: ClipboardList },
  { href: "/recurring", label: "المتكرر", icon: Repeat },
];

const manage = [
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/revenue", label: "الإيرادات", icon: CircleDollarSign },
  { href: "/venue", label: "الإعدادات", icon: Settings2 },
];

const mobileLinks = [...operate.slice(0, 3), { href: "/customers", label: "العملاء", icon: Users }];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { venue, venues, setVenueId, loading, me } = useVenue();
  const [open, setOpen] = useState(false);
  const wide =
    pathname.startsWith("/calendar") ||
    pathname === "/home" ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/recurring");
  const initial = (venue?.name ?? "C").slice(0, 1).toUpperCase();

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[256px_1fr]">
      {open && (
        <button
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="إغلاق القائمة"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 flex w-64 flex-col border-s border-slate-800 bg-slate-900 text-slate-300 lg:static",
          open ? "flex" : "hidden lg:flex",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-5">
          <div>
            <Link href="/home" className="text-2xl font-black italic tracking-wider text-white" onClick={() => setOpen(false)}>
              COURTE<span className="text-brand-bright">.</span>
            </Link>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400">
              تشغيل الملعب{venue?.city ? ` • ${venue.city}` : ""}
            </p>
          </div>
          {venue?.isActive && (
            <span className="rounded bg-brand px-2 py-0.5 text-[10px] font-black text-slate-900">مباشر</span>
          )}
          <button className="rounded-lg p-2 text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {venues.length > 1 && (
          <div className="px-4 pt-4">
            <select
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-white"
              value={venue?.id}
              onChange={(event) => setVenueId(event.target.value)}
            >
              {venues.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          <NavGroup title="التشغيل" links={operate} pathname={pathname} onNavigate={() => setOpen(false)} />
          <NavGroup title="الإدارة" links={manage} pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>

        <div className="border-t border-slate-800/80 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-base font-black text-slate-900 shadow-brand">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold leading-tight text-white">{venue?.name ?? "لا يوجد ملعب"}</p>
                <p className="truncate text-[10px] text-slate-400">{me?.email}</p>
              </div>
            </div>
            <button
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400"
              onClick={() => void signOut()}
              title="خروج"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="فتح القائمة">
            <Menu size={18} />
          </button>
          <div className="text-sm font-black">{venue?.name ?? "Courte"}</div>
          <div className="w-8" />
        </header>
        <main className={cn("px-4 py-6 lg:px-8", wide ? "max-w-7xl" : "mx-auto max-w-6xl")}>
          {loading ? <div className="py-20 text-center text-text-muted">جاري تحميل الملعب…</div> : children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold",
                active ? "text-brand-700" : "text-slate-400",
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavGroup({
  title,
  links,
  pathname,
  onNavigate,
}: {
  title: string;
  links: { href: string; label: string; icon: typeof Zap }[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div>
      <div className="mb-2 px-3 text-[10px] font-black text-slate-500">{title}</div>
      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all",
                active
                  ? "bg-brand font-extrabold text-slate-900 shadow-md shadow-brand/30"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
              )}
            >
              <Icon size={18} className={active ? "text-slate-900" : ""} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
