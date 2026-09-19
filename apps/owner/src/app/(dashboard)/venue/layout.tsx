"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const links = [
  { href: "/venue", label: "الملعب" },
  { href: "/venue/resources", label: "المساحات" },
  { href: "/venue/hours", label: "الساعات" },
  { href: "/venue/pricing", label: "الأسعار" },
  { href: "/venue/blocks", label: "الإغلاق" },
  { href: "/venue/rules", label: "قواعد الحجز" },
  { href: "/venue/account", label: "الحساب" },
];

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-5">
      <PageHeader title="الإعدادات" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition",
              pathname === link.href ? "bg-brand text-slate-900 shadow-brand" : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
