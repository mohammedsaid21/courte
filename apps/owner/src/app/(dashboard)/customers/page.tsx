"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useVenue } from "@/components/venue-provider";
import { Button, Field, Input, Select } from "@/components/ui";
import { CustomerSummary, ownerApi } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";

const filters = [
  { id: "", label: "الكل" },
  { id: "upcoming", label: "لديه حجز قادم" },
  { id: "unpaid", label: "غير مدفوع" },
  { id: "cancelled", label: "ملغى" },
];

export default function CustomersPage() {
  const { venue } = useVenue();
  const [items, setItems] = useState<CustomerSummary[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", notes: "" });

  async function load(search = q, nextFilter = filter) {
    if (!venue) return;
    setItems(await ownerApi.customers(venue.id, search || undefined, nextFilter || undefined));
  }

  useEffect(() => {
    void load().catch((error) => toast.error(error.message));
  }, [venue?.id, filter]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!venue) return;
    await ownerApi.createCustomer(venue.id, {
      ...form,
      whatsapp: form.whatsapp || null,
      notes: form.notes || null,
    });
    setForm({ name: "", phone: "", whatsapp: "", notes: "" });
    await load();
    toast.success("تم حفظ العميل");
  }

  if (!venue) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="العملاء" />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-bold text-slate-500">إضافة عميل</p>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
          <Field label="الاسم"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="الهاتف"><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="واتساب"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
          <div className="flex items-end"><Button className="w-full">حفظ العميل</Button></div>
        </form>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الهاتف" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-48">
          {filters.map((item) => (
            <option key={item.id || "all"} value={item.id}>{item.label}</option>
          ))}
        </Select>
        <Button variant="secondary" onClick={() => void load().catch((error) => toast.error(error.message))}>بحث</Button>
      </div>
      {items && items.length === 0 ? (
        <EmptyState
          title="لا يوجد عملاء بعد"
          body="يظهر العملاء هنا عند إنشاء الحجوزات."
          href="/calendar"
          action="إنشاء حجز"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <Link
              key={item.id}
              href={`/customers/${item.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand"
            >
              <div className="text-lg font-black text-slate-900">{item.name}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{item.phone}</div>
              {item.whatsapp && <div className="text-xs font-semibold text-slate-400">WhatsApp {item.whatsapp}</div>}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-400">
                <span>{item.bookingCount} حجوزات</span>
                <span className="text-end font-black text-brand-700">{formatMoney(item.totalSpent)}</span>
                <span>{item.cancelledBookings} ملغى</span>
                <span className="text-end">آخر {item.lastBookingAt ? formatDate(item.lastBookingAt) : "—"}</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">
                القادم: {item.upcomingBookingAt ? formatDate(item.upcomingBookingAt) : "لا يوجد"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
