import { cityAr } from "@/lib/ar";
import { cn } from "@/lib/utils";
import { useVenue } from "@/components/venue-provider";

export function PageHeader({
  title,
  kicker,
  action,
}: {
  title: string;
  kicker?: string;
  action?: React.ReactNode;
}) {
  const { venue } = useVenue();
  return (
    <header className="-mx-4 -mt-6 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-5 shadow-sm lg:-mx-8 lg:px-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="text-xs font-black uppercase tracking-widest text-brand-700">
            {kicker ?? (venue?.city ? `${cityAr(venue.city)}` : "تشغيل الملعب")}
          </span>
        </div>
        <h1 className="text-2xl font-black leading-tight text-slate-900">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-4xl font-black text-slate-900">{value}</div>
      {hint && <p className="mt-1 text-xs font-semibold text-slate-400">{hint}</p>}
    </div>
  );
}

export function ResourcePills({
  items,
  value,
  onChange,
}: {
  items: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (items.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition",
            value === item.id
              ? "bg-brand text-slate-900 shadow-brand"
              : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900",
          )}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
