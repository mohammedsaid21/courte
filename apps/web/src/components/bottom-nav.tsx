"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "الرئيسية", icon: House, match: (path: string) => path === "/" },
  { href: "/venues", label: "الملاعب", icon: MapPin, match: (path: string) => path.startsWith("/venues") },
  {
    href: "/account/bookings",
    label: "حجوزاتي",
    icon: CalendarDays,
    match: (path: string) => path.startsWith("/account/bookings"),
  },
  {
    href: "/account/profile",
    label: "حسابي",
    icon: User,
    match: (path: string) => path.startsWith("/account/profile") || path === "/account",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  ) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="التنقل السفلي">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-bold",
                active ? "text-pitch" : "text-text-muted",
              )}
            >
              <span className={cn("rounded-full px-3 py-1", active && "bg-pitch-light")}>
                <Icon size={18} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
