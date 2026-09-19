"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, KpiCard } from "@/components/page-header";
import { useVenue } from "@/components/venue-provider";
import { Badge, Button, Field, Input, Textarea } from "@/components/ui";
import { CustomerDetail, ownerApi } from "@/lib/api";
import { statusLabel, paymentLabel } from "@/lib/ar";
import { formatDate, formatMoney, formatTime, paymentTone, statusTone } from "@/lib/utils";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { venue } = useVenue();
  const [id, setId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", notes: "" });

  useEffect(() => {
    void params.then((value) => setId(value.id));
  }, [params]);

  async function load(customerId: string) {
    const result = await ownerApi.customer(customerId);
    setCustomer(result);
    setForm({
      name: result.name,
      phone: result.phone,
      whatsapp: result.whatsapp ?? "",
      notes: result.notes ?? "",
    });
  }

  useEffect(() => {
    if (!id) return;
    void load(id).catch((error) => toast.error(error.message));
  }, [id, venue?.id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    await ownerApi.updateCustomer(id, {
      ...form,
      whatsapp: form.whatsapp || null,
      notes: form.notes || null,
    });
    await load(id);
    toast.success("تم تحديث العميل");
  }

  if (!customer) return <div className="py-16 text-center text-text-muted">جاري تحميل العميل…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        kicker="عميل"
        action={
          <div className="flex items-center gap-3">
            <Link
              href={`/calendar?customerId=${customer.id}`}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-black text-slate-900 shadow-brand"
            >
              حجز جديد
            </Link>
            <Link href="/customers" className="text-sm font-black text-slate-500 hover:text-brand">
              كل العملاء
            </Link>
          </div>
        }
      />
      <p className="-mt-4 text-sm font-semibold text-slate-500">
        {customer.phone}
        {customer.whatsapp ? ` · WhatsApp ${customer.whatsapp}` : ""}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="الحجوزات" value={String(customer.bookingCount)} />
        <KpiCard label="مكتمل" value={String(customer.completedBookings)} />
        <KpiCard label="ملغى" value={String(customer.cancelledBookings)} />
        <KpiCard label="إجمالي الصرف" value={formatMoney(customer.totalSpent)} />
        <KpiCard label="مدفوع" value={formatMoney(customer.totalPaid)} />
        <KpiCard label="آخر حجز" value={customer.lastBookingAt ? formatDate(customer.lastBookingAt) : "—"} />
        <KpiCard label="القادم" value={customer.upcomingBookingAt ? formatDate(customer.upcomingBookingAt) : "—"} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label="الاسم"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="الهاتف"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="واتساب"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="ملاحظات"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <Button>حفظ</Button>
        </form>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {customer.bookings.length === 0 && <div className="p-6 text-sm text-slate-400">لا يوجد سجل حجوزات بعد.</div>}
        {customer.bookings.map((booking) => (
          <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50">
            <div>
              <div className="font-black text-slate-900">{booking.resource.name}</div>
              <div className="text-xs font-semibold text-slate-400">
                {formatDate(booking.startsAt)} {formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
              <Badge tone={paymentTone(booking.paymentStatus)}>{paymentLabel(booking.paymentStatus)}</Badge>
              <span className="text-sm font-black text-brand-700">{formatMoney(booking.priceAmount)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
