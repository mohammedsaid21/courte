"use client";

import { addDays, addMinutes, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DateChips } from "@/components/date-chips";
import { EmptyState } from "@/components/empty-state";
import { HourSlot, type HourSlotState } from "@/components/hour-slot";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Field, Input, Label, Select, Textarea } from "@/components/ui";
import {
  CalendarBooking,
  CalendarResponse,
  CustomerSummary,
  Quote,
  ownerApi,
} from "@/lib/api";
import { paymentLabel } from "@/lib/ar";
import {
  cn,
  formatDuration,
  formatMoney,
  formatTime,
  paymentTone,
  sourceLabel,
  statusTone,
  todayYmd,
} from "@/lib/utils";
import { useVenue } from "./venue-provider";

export type Draft = {
  resourceId: string;
  resourceName: string;
  start: string;
  end: string;
  price: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerWhatsapp?: string;
};

export function BookingCalendar() {
  const { venue } = useVenue();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(todayYmd());
  const [resourceId, setResourceId] = useState<string>("all");
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [presetCustomer, setPresetCustomer] = useState<CustomerSummary | null>(null);

  const from = date;
  const to = view === "week" ? format(addDays(new Date(`${date}T00:00:00`), 6), "yyyy-MM-dd") : date;

  async function load() {
    if (!venue) return;
    const calendar = await ownerApi.calendar(
      venue.id,
      from,
      to,
      resourceId === "all" ? undefined : resourceId,
    );
    setData(calendar);
  }

  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (!venue || !customerId) {
      setPresetCustomer(null);
      return;
    }
    void ownerApi.customer(customerId).then((customer) => {
      setPresetCustomer(customer);
    }).catch(() => setPresetCustomer(null));
  }, [searchParams, venue?.id]);

  useEffect(() => {
    void load().catch((error) => toast.error(error.message));
  }, [venue?.id, from, to, resourceId]);

  function openSlot(next: Draft) {
    setDraft(
      presetCustomer
        ? {
            ...next,
            customerId: presetCustomer.id,
            customerName: presetCustomer.name,
            customerPhone: presetCustomer.phone,
            customerWhatsapp: presetCustomer.whatsapp ?? "",
          }
        : next,
    );
  }

  if (!venue) return null;

  if (venue.resources.length === 0) {
    return (
      <EmptyState
        title="أضف أول ملعب"
        body="يظهر الجدول بعد إضافة مساحة قابلة للحجز."
        href="/venue/resources"
        action="إضافة ملعب"
      />
    );
  }

  if (!data) {
    return <div className="py-16 text-center text-text-muted">جاري تحميل الجدول…</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="الجدول"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-night p-1">
              <button className={cn("rounded-md px-3 py-1.5 text-sm font-black", view === "day" ? "bg-brand text-slate-900" : "text-white/70")} onClick={() => setView("day")}>
                يوم
              </button>
              <button className={cn("rounded-md px-3 py-1.5 text-sm font-black", view === "week" ? "bg-brand text-slate-900" : "text-white/70")} onClick={() => setView("week")}>
                أسبوع
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
              <Button variant="ghost" size="sm" onClick={() => setDate(format(addDays(new Date(`${date}T00:00:00`), view === "week" ? -7 : -1), "yyyy-MM-dd"))}>
                <ChevronLeft size={16} />
              </Button>
              <Input className="w-auto min-w-40 border-0 bg-transparent" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Button variant="ghost" size="sm" onClick={() => setDate(format(addDays(new Date(`${date}T00:00:00`), view === "week" ? 7 : 1), "yyyy-MM-dd"))}>
                <ChevronRight size={16} />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setDate(todayYmd())}>اليوم</Button>
            </div>
          </div>
        }
      />
      <DateChips value={date} onChange={setDate} />
      {presetCustomer && (
        <div className="rounded-xl border border-brand/40 bg-brand-light px-4 py-3 text-sm font-semibold text-slate-900">
          حجز لـ {presetCustomer.name} ({presetCustomer.phone}). اضغط ساعة فارغة للتأكيد.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select className="w-56" value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
          <option value="all">كل المساحات</option>
          {venue.resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </Select>
        <Legend />
      </div>
      {view === "day" ? (
        <DayBoard data={data} onSlot={openSlot} onBooking={(booking) => router.push(`/bookings/${booking.id}`)} />
      ) : (
        <div className="space-y-4">
          {data.resources.map((resource) => (
            <WeekBoard
              key={resource.id}
              data={{ ...data, resources: [resource] }}
              onSlot={openSlot}
              onBooking={(booking) => router.push(`/bookings/${booking.id}`)}
            />
          ))}
        </div>
      )}
      {draft && (
        <BookingForm
          venueId={venue.id}
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={async () => {
            setDraft(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs font-medium text-text-muted">
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-brand" /> متاح</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-900" /> مؤكد</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400" /> قيد الانتظار</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-300" /> مغلق</span>
    </div>
  );
}

function bookingDetail(booking: CalendarBooking) {
  const payment = paymentLabel(booking.paymentStatus);
  const repeating = booking.recurringSeriesId ? " · متكرر" : "";
  return `${formatTime(booking.end)} · ${payment} · ${sourceLabel(booking.source)}${repeating}`;
}

function overlappingBooking(bookings: CalendarBooking[], slotStart: string, slotEnd: string) {
  return bookings.find((item) => item.start < slotEnd && item.end > slotStart);
}

function slotState(booking?: CalendarBooking, blocked?: boolean): HourSlotState {
  if (blocked) return "blocked";
  if (!booking) return "available";
  if (booking.status === "PENDING") return "pending";
  if (booking.source === "CUSTOMER") return "customer";
  return "booked";
}

function DayBoard({
  data,
  onSlot,
  onBooking,
}: {
  data: CalendarResponse;
  onSlot: (draft: Draft) => void;
  onBooking: (booking: CalendarBooking) => void;
}) {
  return (
    <div className="space-y-4">
      {data.resources.map((resource) => {
        const day = resource.days[0];
        if (!day) return null;
        return (
          <div key={resource.id} className="overflow-hidden rounded-brand border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border bg-night px-4 py-3 text-white">
              <div>
                <div className="font-bold">{resource.name}</div>
                <div className="text-xs text-white/55">
                  {day.closed ? "مغلق" : `${day.opensAt}–${day.closesAt}`}
                </div>
              </div>
            </div>
            <div className="p-3">
              {day.closed ? (
                <div className="px-3 py-6 text-sm text-text-muted">مغلق</div>
              ) : day.slots.length === 0 ? (
                <div className="px-3 py-6 text-sm text-text-muted">لا توجد ساعات مفتوحة اليوم.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
                  {day.slots.map((slot) => {
                    const booking = overlappingBooking(day.bookings, slot.start, slot.end);
                    const blocked = Boolean(day.blocks.find((item) => item.start < slot.end && item.end > slot.start) || slot.status === "blocked");
                    if (booking) {
                      return (
                        <HourSlot
                          key={slot.start}
                          time={formatTime(slot.start)}
                          label={booking.customerName}
                          detail={bookingDetail(booking)}
                          state={slotState(booking)}
                          onClick={() => onBooking(booking)}
                        />
                      );
                    }
                    if (blocked) {
                      return (
                        <HourSlot
                          key={slot.start}
                          time={formatTime(slot.start)}
                          label="مغلق"
                          state="blocked"
                        />
                      );
                    }
                    return (
                      <HourSlot
                        key={slot.start}
                        time={formatTime(slot.start)}
                        label="متاح"
                        detail={slot.priceAmount != null ? formatMoney(slot.priceAmount) : undefined}
                        state="available"
                        onClick={() =>
                          onSlot({
                            resourceId: resource.id,
                            resourceName: resource.name,
                            start: slot.start,
                            end: slot.end,
                            price: slot.priceAmount ?? 0,
                          })
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekBoard({
  data,
  onSlot,
  onBooking,
}: {
  data: CalendarResponse;
  onSlot: (draft: Draft) => void;
  onBooking: (booking: CalendarBooking) => void;
}) {
  const resource = data.resources[0];
  if (!resource) {
    return <div className="rounded-brand border border-border bg-white p-8 text-sm">اختر مساحة واحدة لعرض الأسبوع.</div>;
  }
  return (
    <div className="calendar-scroll overflow-x-auto rounded-brand border border-border bg-white">
      <div className="grid min-w-[720px] grid-cols-7 divide-x divide-border md:min-w-[980px]">
        {resource.days.map((day) => (
          <div key={day.date} className="min-w-[110px]">
            <div className="border-b border-border bg-night p-3 text-sm font-bold text-white">
              {format(new Date(`${day.date}T00:00:00`), "EEE d")}
            </div>
            <div className="grid grid-cols-1 gap-1.5 p-2">
              {day.closed && <div className="p-2 text-xs text-text-muted">مغلق</div>}
              {day.slots.map((slot) => {
                const booking = overlappingBooking(day.bookings, slot.start, slot.end);
                if (booking) {
                  return (
                    <HourSlot
                      key={slot.start}
                      time={formatTime(slot.start)}
                      label={booking.customerName}
                      detail={bookingDetail(booking)}
                      state={slotState(booking)}
                      onClick={() => onBooking(booking)}
                    />
                  );
                }
                if (slot.status === "blocked") {
                  return <HourSlot key={slot.start} time={formatTime(slot.start)} label="مغلق" state="blocked" />;
                }
                return (
                  <HourSlot
                    key={slot.start}
                    time={formatTime(slot.start)}
                    label="متاح"
                    state="available"
                    onClick={() =>
                      onSlot({
                        resourceId: resource.id,
                        resourceName: resource.name,
                        start: slot.start,
                        end: slot.end,
                        price: slot.priceAmount ?? 0,
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingForm({
  venueId,
  draft,
  onClose,
  onSaved,
}: {
  venueId: string;
  draft: Draft;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CustomerSummary[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(draft.customerId ?? null);
  const [name, setName] = useState(draft.customerName ?? "");
  const [phone, setPhone] = useState(draft.customerPhone ?? "");
  const [whatsapp, setWhatsapp] = useState(draft.customerWhatsapp ?? "");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState(String(draft.price));
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [paidAmount, setPaidAmount] = useState("0");
  const [source, setSource] = useState("MANUAL");
  const [allowOutsideHours, setAllowOutsideHours] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [end, setEnd] = useState(draft.end);

  const durationChoices = useMemo(
    () => [30, 60, 90, 120, 150, 180].map((minutes) => ({
      minutes,
      iso: addMinutes(new Date(draft.start), minutes).toISOString(),
    })),
    [draft.start],
  );

  useEffect(() => {
    void ownerApi.quote(draft.resourceId, draft.start, end).then(setQuote).catch(() => null);
  }, [draft.resourceId, draft.start, end]);

  useEffect(() => {
    if (quote?.priceAmount != null) {
      setPrice(String(quote.priceAmount));
    }
  }, [quote?.priceAmount]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim().length < 2) {
        setMatches([]);
        return;
      }
      void ownerApi.customers(venueId, query.trim()).then(setMatches).catch(() => setMatches([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, venueId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = phone.trim();
      if (customerId || trimmed.length < 6) return;
      void ownerApi.lookupCustomer(venueId, trimmed).then((customer) => {
        if (customer) selectCustomer(customer);
      }).catch(() => null);
    }, 300);
    return () => clearTimeout(handle);
  }, [phone, venueId, customerId]);

  function selectCustomer(customer: CustomerSummary) {
    setCustomerId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setWhatsapp(customer.whatsapp ?? "");
    setQuery("");
    setMatches([]);
  }

  async function save() {
    setSaving(true);
    try {
      const amount = Number(price);
      const received =
        paymentStatus === "PAID" && Number(paidAmount) <= 0 ? amount : Number(paidAmount);
      await ownerApi.createBooking({
        venueId,
        resourceId: draft.resourceId,
        customerId: customerId || undefined,
        customer: { name, phone, whatsapp: whatsapp || null },
        startsAt: draft.start,
        endsAt: end,
        priceAmount: amount,
        notes: notes || null,
        paymentStatus,
        paidAmount: received,
        source,
        status: "CONFIRMED",
        allowOutsideHours,
      });
      toast.success("تم حفظ الحجز");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إنشاء الحجز");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="حجز جديد" onClose={onClose}>
      <div className="mb-5 rounded-xl bg-night p-4 text-white">
        <div className="text-xs font-semibold text-lime">{draft.resourceName}</div>
        <div className="mt-1 text-2xl font-extrabold tabular-nums">
          {formatTime(draft.start)}–{formatTime(end)}
        </div>
        <div className="mt-1 text-sm text-white/60">{formatDuration(Math.round((new Date(end).getTime() - new Date(draft.start).getTime()) / 60000))}</div>
      </div>
      {quote && !quote.available && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {quote.reason} يمكنك حفظه إذا كان حالة خاصة.
          <label className="mt-2 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={allowOutsideHours} onChange={(e) => setAllowOutsideHours(e.target.checked)} />
            السماح خارج ساعات العمل
          </label>
        </div>
      )}
      <div className="grid gap-4">
        <div>
          <Label>المدة</Label>
          <div className="grid grid-cols-3 gap-2">
            {durationChoices.map((choice) => (
              <button
                key={choice.minutes}
                type="button"
                onClick={() => setEnd(choice.iso)}
                className={cn(
                  "min-h-12 rounded-xl text-sm font-bold",
                  end === choice.iso ? "bg-brand text-slate-900 shadow-brand" : "border border-border bg-white hover:border-night",
                )}
              >
                {formatDuration(choice.minutes)}
              </button>
            ))}
          </div>
        </div>
        <Field label="كيف وصل هذا الحجز؟">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="MANUAL">يدوي</option>
            <option value="WHATSAPP">واتساب</option>
            <option value="PHONE">هاتف</option>
            <option value="WALK_IN">حضور مباشر</option>
            <option value="CUSTOMER">المنصة</option>
          </Select>
        </Field>
        <Field label="بحث عن عميل موجود">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="الاسم أو الهاتف"
          />
        </Field>
        {matches.length > 0 && (
          <div className="rounded-xl border border-border bg-bg-subtle p-2">
            {matches.map((customer) => (
              <button
                key={customer.id}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white"
                onClick={() => selectCustomer(customer)}
              >
                <div className="font-medium">{customer.name}</div>
                <div className="text-xs text-text-muted">{customer.phone} · {customer.bookingCount} bookings</div>
              </button>
            ))}
          </div>
        )}
        {customerId && (
          <div className="rounded-lg bg-brand-light px-3 py-2 text-sm font-semibold text-brand-700">
            عميل موجود. <button className="underline" onClick={() => setCustomerId(null)}>إلغاء</button>
          </div>
        )}
        <Field label="اسم العميل"><Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus={!draft.customerId} /></Field>
        <Field label="الهاتف"><Input required value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="واتساب"><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="السعر (د.أ)"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label="الدفع">
            <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="UNPAID">غير مدفوع</option>
              <option value="PARTIAL">جزئي</option>
              <option value="PAID">مدفوع</option>
            </Select>
          </Field>
        </div>
        {paymentStatus !== "UNPAID" && (
          <Field label="المبلغ المستلم">
            <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
          </Field>
        )}
        <Field label="ملاحظات"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
      <div className="sticky bottom-0 mt-6 flex gap-2 bg-white pt-3">
        <Button className="flex-1" onClick={() => void save()} disabled={saving || !name || !phone}>{saving ? "جاري الحفظ…" : "تأكيد الحجز"}</Button>
        <Button variant="outline" onClick={onClose}>إلغاء</Button>
      </div>
    </Sheet>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-night/40">
      <button className="hidden flex-1 sm:block" onClick={onClose} aria-label="إغلاق" />
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-sheet">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-h2">{title}</h2>
          <button onClick={onClose} className="text-sm text-text-muted">إغلاق</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BookingBadges({
  status,
  source,
  paymentStatus,
}: {
  status: string;
  source: string;
  paymentStatus: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone={source === "CUSTOMER" ? "violet" : "blue"}>{sourceLabel(source)}</Badge>
      <Badge tone={statusTone(status)}>{status}</Badge>
      <Badge tone={paymentTone(paymentStatus)}>{paymentStatus}</Badge>
    </div>
  );
}

export function BookingLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/bookings/${id}`} className="block">
      {children}
    </Link>
  );
}
