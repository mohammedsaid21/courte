import { cn } from "@/lib/utils";

export type HourSlotState = "available" | "booked" | "pending" | "customer" | "blocked";

export function HourSlot({
  time,
  label,
  detail,
  state,
  onClick,
}: {
  time: string;
  label: string;
  detail?: string;
  state: HourSlotState;
  onClick?: () => void;
}) {
  const className = cn(
    "flex h-24 flex-col justify-between rounded-xl p-3.5 text-start transition-all",
    state === "available" &&
      "group border-2 border-brand/40 bg-brand-light shadow-sm hover:border-brand hover:bg-brand hover:shadow-md",
    state === "booked" && "border border-slate-800 bg-slate-900 text-white shadow-sm",
    state === "pending" && "border border-amber-300 bg-amber-50 shadow-sm",
    state === "customer" && "border border-slate-800 bg-slate-900 text-white shadow-sm",
    state === "blocked" && "border border-slate-200 bg-slate-100 text-slate-400",
  );

  const inner = (
    <>
      <div className="flex w-full items-center justify-between">
        <span
          className={cn(
            "text-sm font-black tabular-nums",
            state === "available" && "text-slate-900",
            state === "pending" && "text-amber-950",
            (state === "booked" || state === "customer") && "text-slate-100",
          )}
        >
          {time}
        </span>
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            state === "available" && "bg-brand-700 group-hover:bg-slate-900",
            state === "booked" && "bg-brand-bright",
            state === "customer" && "bg-brand-bright",
            state === "pending" && "bg-amber-400",
            state === "blocked" && "bg-slate-300",
          )}
        />
      </div>
      <div>
        <span
          className={cn(
            "block truncate text-[11px] font-bold",
            state === "available" && "text-slate-600 group-hover:text-slate-800",
            state === "pending" && "text-amber-800/80",
            (state === "booked" || state === "customer") && "text-slate-300",
          )}
        >
          {label}
        </span>
        {detail ? (
          <span
            className={cn(
              "text-xs font-black",
              state === "available" && "text-brand-700 group-hover:text-slate-900",
              state === "pending" && "text-amber-900",
              (state === "booked" || state === "customer") && "text-brand-bright",
            )}
          >
            {detail}
          </span>
        ) : null}
      </div>
    </>
  );

  if (!onClick) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
