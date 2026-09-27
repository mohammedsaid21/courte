import { Check } from "lucide-react";

/** Illustrative booking UI for the hero — sample data only. */
export function HeroTeaser({ compact }: { compact?: boolean }) {
  const slots = ["17:00", "18:00", "19:00", "20:00"];
  return (
    <div
      className={
        compact
          ? "w-full max-w-sm border border-white/15 bg-arena-surface/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md"
          : "w-[min(100%,340px)] border border-white/25 bg-arena-stadium/75 p-5 shadow-[0_24px_70px_rgba(7,19,13,0.35)] backdrop-blur-md motion-safe:animate-hero-float max-md:mx-auto"
      }
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">معاينة الحجز</span>
        <span className="rounded bg-arena-pitch px-2 py-0.5 text-[9px] font-bold text-arena-lime">تجريبي</span>
      </div>
      <p className="mt-3 text-xs font-bold text-white/55">التاريخ</p>
      <div className="mt-2 flex gap-1.5">
        {["الخميس", "الجمعة", "السبت"].map((day, i) => (
          <span
            key={day}
            className={
              i === 0
                ? "flex-1 py-2 text-center text-[11px] font-black bg-arena text-arena-stadium"
                : "flex-1 py-2 text-center text-[11px] font-bold text-white/70 border border-white/10"
            }
          >
            {day}
          </span>
        ))}
      </div>
      <p className="mt-4 text-xs font-bold text-white/55">الأوقات المتاحة</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {slots.map((slot, i) => (
          <span
            key={slot}
            className={
              i === 1
                ? "py-2.5 text-center text-xs font-black bg-arena-deep text-white ring-1 ring-arena-lime/50"
                : "py-2.5 text-center text-xs font-bold text-white/80 border border-white/10"
            }
          >
            {slot}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-xs font-bold text-white/60">60 دقيقة</span>
        <span className="inline-flex items-center gap-1 text-xs font-black text-arena-lime">
          <Check size={14} strokeWidth={3} />
          جاهز للتأكيد
        </span>
      </div>
    </div>
  );
}
