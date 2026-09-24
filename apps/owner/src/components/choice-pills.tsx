"use client";

import { cn } from "@/lib/utils";

export function ChoicePills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-black",
              active ? "bg-brand text-slate-900 shadow-brand" : "bg-slate-100 text-slate-600",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
