"use client";

import { WEST_BANK_CITIES } from "@courte/shared";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { venueService, type CatalogItem } from "@/lib/api";
import { todayYmd } from "@/lib/utils";
import { cityAr } from "@/lib/ar";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

export function SearchPanel({
  initial,
  compact = false,
}: {
  initial?: { q?: string; city?: string; typeId?: string; date?: string; time?: string };
  compact?: boolean;
}) {
  const router = useRouter();
  const [types, setTypes] = useState<CatalogItem[]>([]);
  const [city, setCity] = useState(initial?.city ?? "");
  const [typeId, setTypeId] = useState(initial?.typeId ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");

  useEffect(() => {
    void venueService.types().then(setTypes).catch(() => setTypes([]));
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (initial?.q?.trim()) params.set("q", initial.q.trim());
    if (city) params.set("city", city);
    if (typeId) params.set("typeId", typeId);
    if (date) params.set("date", date);
    if (time) params.set("time", time.slice(0, 5));
    router.push(`/venues${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn("glass grid gap-0 overflow-hidden rounded-[12px]", compact ? "md:grid-cols-[1fr_1fr_1fr_1fr_auto]" : "md:grid-cols-[1.1fr_1.1fr_1fr_1fr_auto]")}
    >
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
      <SearchField label="الرياضة">
        <select className="h-12 w-full border-0 bg-transparent text-text outline-none" value={typeId} onChange={(event) => setTypeId(event.target.value)}>
          <option value="">كل الأنواع</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </SearchField>
      <SearchField label="التاريخ">
        <input className="h-12 w-full border-0 bg-transparent outline-none" type="date" min={todayYmd()} value={date} onChange={(event) => setDate(event.target.value)} />
      </SearchField>
      <SearchField label="الوقت" last>
        <input className="h-12 w-full border-0 bg-transparent outline-none" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
      </SearchField>
      <div className="p-2">
        <Button className="h-full min-h-12 w-full" type="submit">
          ابحث عن ملعب
        </Button>
      </div>
    </form>
  );
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
  types: { id: string; name: string }[];
  value?: string;
  onChange: (typeId: string) => void;
}) {
  const items = [{ id: "", name: "الكل" }, ...types];
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
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
