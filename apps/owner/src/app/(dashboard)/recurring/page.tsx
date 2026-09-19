"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useVenue } from "@/components/venue-provider";
import {
  ApiError,
  CustomerSummary,
  RecurringPlan,
  RecurringSeriesSummary,
  ownerApi,
} from "@/lib/api";
import { formatMoney, formatTime, sourceLabel, todayYmd, weekdayShort } from "@/lib/utils";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function RecurringPage() {
  const { venue } = useVenue();
  const [series, setSeries] = useState<RecurringSeriesSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CustomerSummary[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([4]);
  const [startTime, setStartTime] = useState("20:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState(todayYmd());
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 3), "yyyy-MM-dd"));
  const [source, setSource] = useState("MANUAL");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<RecurringPlan | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!venue) return;
    setSeries(await ownerApi.recurring(venue.id));
  }

  useEffect(() => {
    if (!venue) return;
    if (!resourceId && venue.resources[0]) setResourceId(venue.resources[0].id);
    void load().catch((error) => toast.error(error.message));
  }, [venue?.id]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!venue || query.trim().length < 2) {
        setMatches([]);
        return;
      }
      void ownerApi.customers(venue.id, query.trim()).then(setMatches).catch(() => setMatches([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, venue?.id]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!venue || customerId || phone.trim().length < 6) return;
      void ownerApi.lookupCustomer(venue.id, phone.trim()).then((customer) => {
        if (customer) selectCustomer(customer);
      }).catch(() => null);
    }, 300);
    return () => clearTimeout(handle);
  }, [phone, venue?.id, customerId]);

  const body = useMemo(() => {
    if (!venue) return null;
    return {
      venueId: venue.id,
      resourceId,
      customerId: customerId || undefined,
      customer: { name, phone, whatsapp: whatsapp || null },
      daysOfWeek,
      startTime,
      durationMinutes: Number(durationMinutes),
      priceAmount: price ? Number(price) : undefined,
      startDate,
      endDate,
      source,
      paymentStatus,
      notes: notes || null,
    };
  }, [venue, resourceId, customerId, name, phone, whatsapp, daysOfWeek, startTime, durationMinutes, price, startDate, endDate, source, paymentStatus, notes]);

  function selectCustomer(customer: CustomerSummary) {
    setCustomerId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setWhatsapp(customer.whatsapp ?? "");
    setQuery("");
    setMatches([]);
  }

  function toggleDay(day: number) {
    setDaysOfWeek((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  }

  async function preview(event: FormEvent) {
    event.preventDefault();
    if (!body) return;
    setSaving(true);
    try {
      setPlan(await ownerApi.previewRecurring(body));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر التحقق من التواريخ");
    } finally {
      setSaving(false);
    }
  }

  async function create(skipConflicts = false) {
    if (!body) return;
    setSaving(true);
    try {
      const created = await ownerApi.createRecurring({ ...body, skipConflicts });
      toast.success(`تم إنشاء ${created.bookings.filter((item) => item.status !== "CANCELLED").length} حجوزات`);
      setPlan(null);
      await load();
    } catch (error) {
      const conflict = readConflict(error);
      if (conflict) {
        setPlan(conflict);
        toast.error(error instanceof Error ? error.message : "يوجد تعارض في المواعيد");
      } else {
        toast.error(error instanceof Error ? error.message : "تعذر إنشاء السلسلة");
      }
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: string) {
    await ownerApi.cancelRecurring(id);
    toast.success("أُلغيت الحجوزات القادمة في هذه السلسلة");
    await load();
  }

  if (!venue) return null;

  if (venue.resources.length === 0) {
    return (
      <EmptyState
        title="أضف ملعباً أولاً"
        body="الحجوزات المتكررة تحتاج مساحة على الجدول."
        href="/venue/resources"
        action="إضافة ملعب"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الحجوزات المتكررة"
        action={
          <Link href="/calendar" className="text-sm font-black text-slate-500 hover:text-brand">
            فتح الجدول
          </Link>
        }
      />

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2" onSubmit={preview}>
        <Field label="المساحة">
          <Select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
            {venue.resources.map((resource) => (
              <option key={resource.id} value={resource.id}>{resource.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="المصدر">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="MANUAL">يدوي</option>
            <option value="WHATSAPP">واتساب</option>
            <option value="PHONE">هاتف</option>
            <option value="WALK_IN">حضور مباشر</option>
            <option value="CUSTOMER">المنصة</option>
          </Select>
        </Field>
        <div className="lg:col-span-2">
          <Field label="بحث عن عميل موجود">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="الاسم أو الهاتف" />
          </Field>
          {matches.length > 0 && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              {matches.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-white"
                  onClick={() => selectCustomer(customer)}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-xs text-slate-500">{customer.phone}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {customerId && (
          <div className="rounded-lg bg-brand-light px-3 py-2 text-sm font-semibold text-brand-700 lg:col-span-2">
            استخدام {name}. <button type="button" className="underline" onClick={() => setCustomerId(null)}>إلغاء</button>
          </div>
        )}
        <Field label="اسم العميل"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="الهاتف"><Input required value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <div className="lg:col-span-2">
          <p className="mb-2 text-sm font-semibold">الأيام</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={
                  daysOfWeek.includes(day)
                    ? "rounded-xl bg-brand px-3 py-2 text-sm font-black text-slate-900"
                    : "rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500"
                }
              >
                {weekdayShort(day)}
              </button>
            ))}
          </div>
        </div>
        <Field label="وقت البداية"><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
        <Field label="المدة (دقائق)"><Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} /></Field>
        <Field label="تاريخ البداية"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="تاريخ النهاية"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
        <Field label="السعر (د.أ)"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="يُحسب تلقائياً إن تُرك فارغاً" /></Field>
        <Field label="الدفع">
          <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="UNPAID">غير مدفوع</option>
            <option value="PAID">مدفوع</option>
          </Select>
        </Field>
        <div className="lg:col-span-2">
          <Field label="ملاحظات"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
        <div className="lg:col-span-2">
          <Button disabled={saving || !name || !phone || daysOfWeek.length === 0}>
            {saving ? "جاري التحقق…" : "تحقق من التواريخ"}
          </Button>
        </div>
      </form>

      {plan && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">معاينة</h2>
          <p className="mt-1 text-sm text-slate-500">
            {plan.createCount} تواريخ متاحة. {plan.conflictCount} تعارض.
            السعر {formatMoney(plan.priceAmount)} على {plan.resourceName}.
          </p>
          {plan.conflicts.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-950">تعارضات — لم يُستبدل أي حجز</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {plan.conflicts.map((item) => (
                  <li key={item.startsAt}>
                    {item.date} {formatTime(item.startsAt)} — {item.reason}
                    {item.bookingId && (
                      <> · <Link className="font-bold underline" href={`/bookings/${item.bookingId}`}>فتح الحجز</Link></>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={saving || plan.createCount === 0} onClick={() => void create(plan.conflictCount > 0)}>
              {plan.conflictCount > 0 ? `إنشاء ${plan.createCount} تواريخ متاحة` : `إنشاء ${plan.createCount} حجوزات`}
            </Button>
            {plan.conflictCount > 0 && (
              <p className="self-center text-xs font-semibold text-slate-500">
                التواريخ المتعارضة ستُتخطى. غيّر السلسلة إذا احتجت تلك الأيام.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-black">السلاسل النشطة</h2>
        </div>
        {(series ?? []).length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">لا حجوزات متكررة بعد.</p>
        ) : (
          (series ?? []).map((item) => (
            <div key={item.id} className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 last:border-0 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-black text-slate-900">{item.customer.name} · {item.resource.name}</div>
                <div className="text-xs font-semibold text-slate-400">
                  {item.daysOfWeek.map((day) => weekdayShort(day)).join("، ")} الساعة {item.startTime}
                  · {item.startDate} إلى {item.endDate}
                  · {item.bookingCount} حجوزات
                  · {sourceLabel(item.source)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black">{formatMoney(item.priceAmount)}</span>
                <Button variant="danger" size="sm" onClick={() => void cancel(item.id).catch((error) => toast.error(error.message))}>
                  Cancel series
                </Button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function readConflict(error: unknown): RecurringPlan | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const details = error.details;
  if (!details || typeof details !== "object" || !("message" in details)) return null;
  const message = (details as { message: unknown }).message;
  if (!message || typeof message !== "object" || !("conflicts" in message)) return null;
  return message as RecurringPlan;
}
