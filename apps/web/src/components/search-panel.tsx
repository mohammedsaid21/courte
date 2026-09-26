"use client";

import { WEST_BANK_CITIES } from "@courte/shared";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { venueService, type CatalogItem } from "@/lib/api";
import { addDaysYmd, todayYmd } from "@/lib/utils";
import { COURT_SIZES, catalogName, cityAr } from "@/lib/ar";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

export type SearchInitial = {
  q?: string;
  city?: string;
  area?: string;
  typeId?: string;
  date?: string;
  dateTo?: string;
  time?: string;
  size?: string;
};

export function SearchPanel({
  initial,
  compact = false,
}: {
  initial?: SearchInitial;
  compact?: boolean;
}) {
  const router = useRouter();
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [city, setCity] = useState(initial?.city ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [typeId, setTypeId] = useState(initial?.typeId ?? "");
  const [size, setSize] = useState(initial?.size ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const availability = availabilityFromQuery(initial?.date, initial?.dateTo);

  useEffect(() => {
    void venueService.types().then(setTypes).catch(() => setTypes([]));
  }, []);

  function go(next: {
    city?: string;
    area?: string;
    typeId?: string;
    size?: string;
    date?: string;
    dateTo?: string;
  }) {
    const params = new URLSearchParams();
    if (initial?.q?.trim()) params.set("q", initial.q.trim());
    const nextCity = next.city ?? city;
    const nextArea = next.area ?? area;
    const nextType = next.typeId ?? typeId;
    const nextSize = next.size ?? size;
    const nextDate = next.date ?? date;
    const nextDateTo = next.dateTo;
    if (nextCity) params.set("city", nextCity);
    if (nextArea.trim()) params.set("area", nextArea.trim());
    if (nextType) params.set("typeId", nextType);
    if (nextSize) params.set("size", nextSize);
    if (nextDate) params.set("date", nextDate);
    if (nextDateTo) params.set("dateTo", nextDateTo);
    router.push(`/venues${params.toString() ? `?${params}` : ""}`);
  }

  function setAvailability(kind: "any" | "today" | "week" | "date") {
    const today = todayYmd();
    if (kind === "any") {
      setDate("");
      go({ date: "", dateTo: "" });
      return;
    }
    if (kind === "today") {
      setDate(today);
      go({ date: today, dateTo: "" });
      return;
    }
    if (kind === "week") {
      setDate(today);
      go({ date: today, dateTo: addDaysYmd(today, 6) });
      return;
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    go({
      city,
      area,
      typeId,
      size,
      date,
      dateTo: availability === "week" ? addDaysYmd(todayYmd(), 6) : undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={cn("glass grid gap-0 overflow-hidden rounded-[12px]", compact ? "md:grid-cols-[1fr_1fr_1fr_auto]" : "md:grid-cols-[1.1fr_1.1fr_1fr_auto]")}>
        <SearchField label="المدينة">
          <select className="h-12 w-full border-0 bg-transparent text-text outline-none" value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="">كل المدن</option>
            {WEST_BANK_CITIES.map((item) => (
              <option key={item} value={item}>
                {cityAr(item)}
              </option>
            ))}
          </select>
        </SearchField>
        <SearchField label="القرية / المنطقة">
          <input
            className="h-12 w-full border-0 bg-transparent outline-none"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder="اختياري"
          />
        </SearchField>
        <SearchField label="الرياضة" last>
          <select className="h-12 w-full border-0 bg-transparent text-text outline-none" value={typeId} onChange={(event) => setTypeId(event.target.value)}>
            <option value="">كل الأنواع</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {catalogName(type)}
              </option>
            ))}
          </select>
        </SearchField>
        <div className="p-2">
          <Button className="h-full min-h-12 w-full" type="submit">
            ابحث عن ملعب
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-pitch">حجم الملعب</p>
        <div className="flex flex-wrap gap-2">
          {[{ id: "", label: "كل الأحجام" }, ...COURT_SIZES].map((item) => {
            const active = size === item.id;
            return (
              <button
                key={item.id || "all"}
                type="button"
                onClick={() => {
                  setSize(item.id);
                  go({ size: item.id, city, area, typeId, date, dateTo: initial?.dateTo });
                }}
                className={cn(
                  "min-h-11 rounded-[12px] px-4 text-sm font-bold",
                  active ? "bg-pitch text-white" : "bg-white text-text hover:bg-pitch-light",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-pitch">توفر الحجز</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "any", label: "كل الملاعب" },
              { id: "today", label: "متاح اليوم" },
              { id: "week", label: "متاح هذا الأسبوع" },
              { id: "date", label: "تاريخ محدد" },
            ] as const
          ).map((item) => {
            const active = availability === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "date") {
                    const value = date || todayYmd();
                    setDate(value);
                    go({ date: value, dateTo: "" });
                    return;
                  }
                  setAvailability(item.id);
                }}
                className={cn(
                  "min-h-11 rounded-[12px] px-4 text-sm font-bold",
                  active ? "bg-pitch text-white" : "bg-white text-text hover:bg-pitch-light",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {availability === "date" && (
          <input
            className="h-12 max-w-xs rounded-[12px] border border-border bg-white px-4 text-sm font-bold"
            type="date"
            min={todayYmd()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              go({ date: event.target.value, dateTo: "" });
            }}
          />
        )}
      </div>
    </form>
  );
}

function availabilityFromQuery(date?: string, dateTo?: string): "any" | "today" | "week" | "date" {
  if (!date) return "any";
  const today = todayYmd();
  if (date === today && !dateTo) return "today";
  if (date === today && dateTo === addDaysYmd(today, 6)) return "week";
  return "date";
}

function SearchField({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <label className={cn("block px-4 py-3", !last && "md:border-l md:border-white/50")}>
      <span className="block text-[11px] font-bold text-pitch">{label}</span>
      {children}
    </label>
  );
}

export function SportFilter({
  types,
  value,
  onChange,
}: {
  types: { id: string; name: string; nameAr?: string | null }[];
  value?: string;
  onChange: (typeId: string) => void;
}) {
  const items = [{ id: "", name: "الكل", nameAr: "الكل" }, ...types];
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      {items.map((item) => {
        const active = (value ?? "") === item.id;
        return (
          <button
            key={item.id || "all"}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-[12px] px-4 text-sm font-bold",
              active ? "bg-pitch text-white" : "bg-white text-text hover:bg-pitch-light",
            )}
          >
            {item.nameAr?.trim() || item.name}
          </button>
        );
      })}
    </div>
  );
}
