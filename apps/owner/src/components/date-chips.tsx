"use client";

import { addDays, format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn, todayYmd } from "@/lib/utils";

export function DateChips({
  value,
  onChange,
  days = 7,
}: {
  value: string;
  onChange: (date: string) => void;
  days?: number;
}) {
  const start = todayYmd();
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {Array.from({ length: days }, (_, index) => {
        const next = format(addDays(new Date(`${start}T00:00:00`), index), "yyyy-MM-dd");
        const active = next === value;
        return (
          <button
            key={next}
            type="button"
            onClick={() => onChange(next)}
            className={cn(
              "flex min-w-[75px] flex-col items-center justify-center rounded-xl py-3.5",
              active
                ? "bg-brand text-slate-900 shadow-brand"
                : "border border-slate-200/80 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <span className={cn("text-[11px] font-black uppercase tracking-widest", active ? "text-slate-700" : "")}>
              {format(new Date(`${next}T12:00:00`), "EEE", { locale: ar })}
            </span>
            <span className={cn("mt-1 text-2xl font-black leading-none", active ? "text-slate-900" : "text-slate-800")}>
              {format(new Date(`${next}T12:00:00`), "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
