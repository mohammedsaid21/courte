import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const mark = (
    <span
      className={cn(
        "inline-flex items-center rounded-[10px] bg-pitch px-3 py-1.5 font-display text-[22px] font-extrabold leading-none text-white",
        className,
      )}
    >
      ميدان<span className="text-gold">.</span>
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="ميدان الصفحة الرئيسية">
      {mark}
    </Link>
  );
}
