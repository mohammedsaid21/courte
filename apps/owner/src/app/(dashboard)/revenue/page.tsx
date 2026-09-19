"use client";

import { format, startOfMonth, startOfWeek } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, KpiCard } from "@/components/page-header";
import { useVenue } from "@/components/venue-provider";
import { Button, Field, Input } from "@/components/ui";
import { RevenueData, ownerApi } from "@/lib/api";
import { formatMoney, sourceLabel, todayYmd } from "@/lib/utils";

export default function RevenuePage() {
  const { venue } = useVenue();
  const today = todayYmd();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<RevenueData | null>(null);

  async function load(nextFrom = from, nextTo = to) {
    if (!venue) return;
    const result = await ownerApi.revenue(venue.id, nextFrom, nextTo);
    setData(result);
  }

  useEffect(() => {
    void load().catch((error) => toast.error(error.message));
  }, [venue?.id]);

  function applyPreset(preset: "today" | "week" | "month") {
    const now = new Date(`${today}T00:00:00`);
    if (preset === "today") {
      setFrom(today);
      setTo(today);
      void load(today, today);
    }
    if (preset === "week") {
      const start = format(startOfWeek(now, { weekStartsOn: 6 }), "yyyy-MM-dd");
      setFrom(start);
      setTo(today);
      void load(start, today);
    }
    if (preset === "month") {
      const start = format(startOfMonth(now), "yyyy-MM-dd");
      setFrom(start);
      setTo(today);
      void load(start, today);
    }
  }

  if (!data) return <div className="py-16 text-center text-text-muted">جاري تحميل الإيرادات…</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="الإيرادات" />
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Button variant={from === today && to === today ? "primary" : "outline"} onClick={() => applyPreset("today")}>اليوم</Button>
        <Button variant="outline" onClick={() => applyPreset("week")}>هذا الأسبوع</Button>
        <Button variant="outline" onClick={() => applyPreset("month")}>هذا الشهر</Button>
        <Field label="من"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="إلى"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Button onClick={() => void load()}>تطبيق</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="الحجوزات" value={String(data.totalBookings)} />
        <KpiCard label="الإجمالي" value={formatMoney(data.totalRevenue)} />
        <KpiCard label="مدفوع" value={formatMoney(data.paidAmount)} />
        <KpiCard label="غير مدفوع" value={formatMoney(data.unpaidAmount)} />
        <KpiCard label="ساعات مشغولة" value={String(data.occupiedHours)} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-sm font-black text-slate-400">حسب المصدر</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(data.bySource).map(([source, stats]) => (
            <div key={source} className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs font-black text-slate-400">{sourceLabel(source)}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalBookings}</div>
              <div className="text-sm font-black text-brand-700">{formatMoney(stats.totalRevenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
