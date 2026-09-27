import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  href = "/",
  variant = "classic",
}: {
  className?: string;
  href?: string | null;
  variant?: "classic" | "brand" | "stadium";
}) {
  const mark = (
    <span
      className={cn(
        "inline-flex items-center rounded-[10px] px-3 py-1.5 font-display text-[22px] font-extrabold leading-none",
        variant === "classic" && "bg-pitch text-white",
        variant === "brand" && "bg-arena-stadium text-white",
        variant === "stadium" && "border border-white/20 bg-transparent text-white",
        className,
      )}
    >
      ميدان
      <span
        className={cn(
          variant === "classic" && "text-gold",
          (variant === "brand" || variant === "stadium") && "text-arena",
        )}
      >
        .
      </span>
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="ميدان الصفحة الرئيسية">
      {mark}
    </Link>
  );
}
