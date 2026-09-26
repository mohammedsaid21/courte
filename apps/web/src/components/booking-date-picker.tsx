"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDaysYmd, cn, todayYmd, weekdayFromYmd } from "@/lib/utils";
import { WEEKDAYS_AR } from "@/lib/ar";

function monthStartYmd(date: string) {
  const [year, month] = date.split("-").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function daysInMonthYmd(monthStart: string) {
  const [year, month] = monthStart.split("-").map(Number);
  const count = new Date(year, month, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
}

export function BookingDatePicker({
  value,
  onChange,
  maxAdvanceDays,
}: {
  value: string;
  onChange: (date: string) => void;
  maxAdvanceDays: number;
}) {
  const today = todayYmd();
  const maxDate = addDaysYmd(today, maxAdvanceDays);
  const [month, setMonth] = useState(monthStartYmd(value));

  const quickDates = useMemo(() => {
    const length = Math.min(7, maxAdvanceDays + 1);
    return Array.from({ length }, (_, index) => addDaysYmd(today, index));
  }, [today, maxAdvanceDays]);

  const monthDays = useMemo(() => daysInMonthYmd(month), [month]);
  const monthLabel = format(new Date(`${month}T12:00:00`), "MMMM yyyy", { locale: ar });
  const firstWeekday = weekdayFromYmd(monthDays[0] ?? month);
  const padding = Array.from({ length: firstWeekday });

  function shiftMonth(delta: number) {
    const current = new Date(`${month}T12:00:00`);
    current.setMonth(current.getMonth() + delta);
    const next = format(current, "yyyy-MM-dd").slice(0, 7) + "-01";
    setMonth(next);
  }

  function pick(date: string) {
    if (date < today || date > maxDate) return;
    onChange(date);
  }

  return (
    <div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {quickDates.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => pick(item)}
            className={cn(
              "min-h-16 w-[72px] shrink-0 rounded-brand px-2 text-center text-sm font-bold",
              item === value ? "bg-gold text-pitch-deep" : "bg-night-800 text-white",
            )}
          >
            <div>{WEEKDAYS_AR[weekdayFromYmd(item)]}</div>
            <div className="text-lg leading-none">{format(new Date(`${item}T12:00:00`), "d")}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-brand bg-night-800 p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="text-sm font-bold text-white">{monthLabel}</p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10"
            aria-label="الشهر التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-white/45">
          {WEEKDAYS_AR.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {padding.map((_, index) => (
            <span key={`pad-${index}`} />
          ))}
          {monthDays.map((day) => {
            const disabled = day < today || day > maxDate;
            const active = day === value;
            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                onClick={() => pick(day)}
                className={cn(
                  "min-h-9 rounded-lg text-sm font-bold",
                  active ? "bg-gold text-pitch-deep" : "text-white hover:bg-white/10",
                  disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                )}
              >
                {format(new Date(`${day}T12:00:00`), "d")}
              </button>
            );
          })}
        </div>
        <label className="mt-3 block text-xs font-bold text-white/55">
          أو اختر تاريخًا
          <input
            type="date"
            min={today}
            max={maxDate}
            value={value}
            onChange={(event) => pick(event.target.value)}
            className="mt-1 h-11 w-full rounded-[12px] border-0 bg-white px-3 text-sm font-bold text-text"
          />
        </label>
      </div>
    </div>
  );
}
