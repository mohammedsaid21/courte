"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { DateChips } from "@/components/date-chips";
import { EmptyState } from "@/components/empty-state";
import { useVenue } from "@/components/venue-provider";
import { PageHeader, KpiCard } from "@/components/page-header";
import { Button, ButtonLink, Field, Input, Select } from "@/components/ui";
import { Booking, ownerApi } from "@/lib/api";
import { statusLabel } from "@/lib/ar";
import {
  formatDate,
  formatMoney,
  formatTime,
  sourceLabel,
  todayYmd,
} from "@/lib/utils";

export default function BookingsPage() {
  const { venue } = useVenue();
  const [items, setItems] = useState<Booking[] | null>(null);
  const [date, setDate] = useState(todayYmd());
  const [filters, setFilters] = useState({
    resourceId: "",
    status: "",
    paymentStatus: "",
    q: "",
  });

  async function load(nextDate = date, nextFilters = filters) {
    if (!venue) return;
    const result = await ownerApi.bookings(venue.id, {
      from: nextDate,
      to: nextDate,
      resourceId: nextFilters.resourceId || undefined,
      status: nextFilters.status || undefined,
      paymentStatus: nextFilters.paymentStatus || undefined,
      q: nextFilters.q || undefined,
    });
    setItems(result);
  }

  useEffect(() => {
    void load(date, filters).catch((error) => toast.error(error.message));
  }, [venue?.id, date]);

  if (!venue) return null;

  const confirmed = items?.filter((item) => item.status === "CONFIRMED").length ?? 0;
  const pending = items?.filter((item) => item.status === "PENDING").length ?? 0;
  const unpaid = items?.filter((item) => item.paymentStatus !== "PAID" && item.status !== "CANCELLED").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الحجوزات"
        action={
          <ButtonLink href="/calendar">
            <CalendarPlus size={16} />
            فتح الجدول
          </ButtonLink>
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <KpiCard label="مؤكد" value={String(confirmed)} />
        <KpiCard label="قيد الانتظار" value={String(pending)} />
        <KpiCard label="غير مدفوع" value={String(unpaid)} />
      </div>

      <DateChips
        value={date}
        onChange={(next) => {
          setDate(next);
        }}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <Field label="المساحة">
          <Select value={filters.resourceId} onChange={(e) => setFilters({ ...filters, resourceId: e.target.value })}>
            <option value="">كل المساحات</option>
            {venue.resources.map((resource) => (
              <option key={resource.id} value={resource.id}>{resource.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="الحالة">
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">كل الحالات</option>
            <option value="CONFIRMED">مؤكد</option>
            <option value="PENDING">قيد الانتظار</option>
            <option value="COMPLETED">مكتمل</option>
            <option value="CANCELLED">ملغى</option>
          </Select>
        </Field>
        <Field label="العميل / الهاتف">
          <Input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="الاسم أو الهاتف" />
        </Field>
        <div className="flex items-end">
          <Button className="w-full" onClick={() => void load(date, filters).catch((error) => toast.error(error.message))}>
            بحث
          </Button>
        </div>
      </div>

      {items && items.length === 0 ? (
        <EmptyState title="لا حجوزات هذا اليوم" body="لا يوجد ما يطابق هذه الفلاتر." href="/calendar" action="فتح الجدول" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <Link
              key={item.id}
              href={`/bookings/${item.id}`}
              className="flex h-32 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-black tabular-nums text-slate-900">
                    {formatTime(item.startsAt)}–{formatTime(item.endsAt)}
                  </div>
                  <div className="text-xs font-semibold text-slate-400">{formatDate(item.startsAt)}</div>
                </div>
                <span
                  className={
                    item.status === "PENDING"
                      ? "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800"
                      : item.status === "CANCELLED"
                        ? "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500"
                        : "rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-black uppercase text-brand-700"
                  }
                >
                  {statusLabel(item.status)}
                </span>
              </div>
              <div>
                <div className="truncate font-extrabold text-slate-900">{item.customer.name}</div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>{item.resource.name} · {sourceLabel(item.source)}</span>
                  <span className="font-black text-brand-700">{formatMoney(item.priceAmount)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
