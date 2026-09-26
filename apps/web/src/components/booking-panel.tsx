"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Select } from "@/components/ui";
import { BookingDatePicker } from "@/components/booking-date-picker";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import {
  availabilityService,
  userFacingMessage,
  type AvailabilityResponse,
  type AvailabilitySlot,
  type PublicVenue,
} from "@/lib/api";
import { loadBookingCart, saveBookingCart, type BookingCartItem } from "@/lib/booking-cart";
import { addDaysYmd, addMonthsYmd, formatDuration, formatMoney, formatTime, todayYmd, weekdayFromYmd } from "@/lib/utils";
import { WEEKDAYS_AR } from "@/lib/ar";
import { cn } from "@/lib/utils";

export function BookingPanel({
  venue,
  initialResourceId,
  initialDate,
  compact = false,
}: {
  venue: PublicVenue;
  initialResourceId?: string;
  initialDate?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const onlineBooking = (venue.acceptsOnlineBooking ?? true) && venue.resources.length > 0;
  const [resourceId, setResourceId] = useState(initialResourceId || venue.resources[0]?.id || "");
  const [date, setDate] = useState(initialDate || todayYmd());
  const resource = venue.resources.find((item) => item.id === resourceId) ?? venue.resources[0];
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<AvailabilitySlot | null>(null);
  const [selected, setSelected] = useState<AvailabilitySlot[]>([]);
  const [quoted, setQuoted] = useState<AvailabilitySlot | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [recurringUntil, setRecurringUntil] = useState(addMonthsYmd(todayYmd(), 1));
  const [cart, setCart] = useState<BookingCartItem[]>([]);

  const slotMinutes = resource?.slotIntervalMinutes || 60;

  useEffect(() => {
    setCart(loadBookingCart(venue.id));
  }, [venue.id]);

  useEffect(() => {
    if (!onlineBooking || !resourceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setError(null);
    setAnchor(null);
    setSelected([]);
    setQuoted(null);
    void availabilityService
      .get(venue.id, resourceId, date, slotMinutes)
      .then((result) => {
        if (!cancelled) setAvailability(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setAvailability(null);
          setError(userFacingMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [venue.id, resourceId, date, slotMinutes, onlineBooking]);

  useEffect(() => {
    if (!resource || selected.length === 0) {
      setQuoted(null);
      return;
    }
    const start = selected[0].start;
    const end = selected[selected.length - 1].end;
    const durationMinutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    let cancelled = false;
    void availabilityService
      .get(venue.id, resource.id, date, durationMinutes)
      .then((result) => {
        if (cancelled) return;
        setQuoted(result.slots.find((item) => item.start === start && item.end === end) ?? null);
      })
      .catch(() => {
        if (!cancelled) setQuoted(null);
      });
    return () => {
      cancelled = true;
    };
  }, [venue.id, resource, date, selected]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.priceAmount ?? 0), 0),
    [cart],
  );

  if (venue.acceptsOnlineBooking === false) {
    return (
      <div className={cn("rounded-[12px] bg-pitch-dark p-5 text-white", compact && "p-4")}>
        <p className="text-[11px] font-bold text-gold">الحجز</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">تواصل مع الملعب</h2>
        <p className="mt-3 text-sm text-white/70">
          هذا المكان معروض للتعريف فقط. للحجز اتصل أو راسلهم مباشرة عبر الهاتف أو واتساب في الصفحة.
        </p>
      </div>
    );
  }

  if (venue.resources.length === 0) {
    return <EmptyState title="لا يوجد حجز بعد" body="هذا المكان لم ينشر ملعبًا قابلاً للحجز." />;
  }
  if (!resource) return <Skeleton className="h-40 w-full" />;

  const maxSlots = Math.max(1, Math.floor(resource.maxDurationMinutes / slotMinutes));
  const selectedStart = selected[0];
  const selectedEnd = selected[selected.length - 1];
  const durationMinutes = selectedStart && selectedEnd
    ? Math.round((new Date(selectedEnd.end).getTime() - new Date(selectedStart.start).getTime()) / 60000)
    : 0;
  const price = quoted?.priceAmount ?? selected.reduce((sum, slot) => sum + (slot.priceAmount ?? 0), 0);
  const weekday = weekdayFromYmd(date);

  function pickSlot(slot: AvailabilitySlot) {
    const slots = availability?.slots ?? [];
    if (!anchor) {
      setAnchor(slot);
      setSelected([slot]);
      return;
    }
    const range = consecutiveRange(slots, anchor, slot);
    if (!range || range.length > maxSlots) {
      setAnchor(slot);
      setSelected([slot]);
      return;
    }
    setSelected(range);
  }

  function addToCart() {
    if (!selectedStart || !selectedEnd || !resource) return;
    const item: BookingCartItem = {
      resourceId: resource.id,
      resourceName: resource.name,
      start: selectedStart.start,
      end: selectedEnd.end,
      date,
      priceAmount: price,
    };
    const duplicate = cart.some((entry) => entry.start === item.start && entry.end === item.end && entry.resourceId === item.resourceId);
    if (duplicate) {
      setError("هذا الوقت مضاف بالفعل إلى الحجز.");
      return;
    }
    const next = [...cart, item];
    setCart(next);
    saveBookingCart(venue.id, next);
    setAnchor(null);
    setSelected([]);
    setQuoted(null);
    setError(null);
  }

  function removeFromCart(index: number) {
    const next = cart.filter((_, itemIndex) => itemIndex !== index);
    setCart(next);
    saveBookingCart(venue.id, next);
  }

  function checkout() {
    if (cart.length === 0) {
      bookSingle();
      return;
    }
    router.push(`/venues/${venue.slug}/book/review?cart=1`);
  }

  function bookSingle() {
    if (!selectedStart || !selectedEnd || !resource) return;
    const params = new URLSearchParams({
      resourceId: resource.id,
      start: selectedStart.start,
      end: selectedEnd.end,
    });
    if (recurring) {
      params.set("recurring", "1");
      params.set("until", recurringUntil);
    }
    router.push(`/venues/${venue.slug}/book/review?${params}`);
  }

  return (
    <div className={cn("rounded-[12px] bg-pitch-dark p-5 text-white", compact && "p-4")}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-gold">احجز وقتك</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">العب هنا</h2>
        </div>
        {(selected.length > 0 || cart.length > 0) && (
          <div className="text-end">
            <div className="text-2xl font-extrabold text-gold">
              {formatMoney(selected.length > 0 ? price : cartTotal)}
            </div>
            {selected.length > 0 && (
              <div className="text-xs text-white/60">{formatDuration(durationMinutes)}</div>
            )}
            {cart.length > 0 && (
              <div className="text-xs text-white/60">{cart.length} حجز في السلة</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <Select
          className="border-white/10 bg-night-800 text-white"
          value={resource.id}
          onChange={(event) => setResourceId(event.target.value)}
        >
          {venue.resources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.startingPrice != null ? ` · من ${formatMoney(item.startingPrice)}` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold text-white/50">اختر التاريخ</p>
        <div className="mt-3">
          <BookingDatePicker
            value={date}
            onChange={setDate}
            maxAdvanceDays={venue.maxAdvanceDays}
          />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-bold text-white/50">اختر الوقت</p>
        <p className="mt-1 text-xs text-white/55">
          يمكنك اختيار أكثر من ساعة متتالية، ثم إضافة حجوزات لأيام أخرى قبل التأكيد.
        </p>
        {error && <div className="mt-3"><Alert tone="danger" description={error} /></div>}
        {loadingSlots ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 bg-white/10" />
            ))}
          </div>
        ) : availability?.closed ? (
          <p className="mt-3 text-sm text-white/60">{availability.reason || "مغلق هذا اليوم."}</p>
        ) : !availability || availability.slots.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">لا توجد أوقات هذا اليوم. جرّب تاريخًا آخر.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availability.slots.map((slot) => {
              const active = selected.some((item) => item.start === slot.start);
              return (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => pickSlot(slot)}
                  className={cn(
                    "min-h-14 rounded-brand px-3 py-2 text-left text-sm font-bold transition",
                    active ? "bg-gold text-pitch-deep" : "bg-night-800 text-white hover:bg-night-700",
                  )}
                >
                  {formatTime(slot.start, availability.timezone)}–{formatTime(slot.end, availability.timezone)}
                  {slot.priceAmount != null && (
                    <div className={cn("text-xs font-medium", active ? "text-night/70" : "text-white/55")}>
                      {formatMoney(slot.priceAmount)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="mt-6 rounded-[12px] bg-night-800 p-4">
          <p className="text-xs font-bold text-gold">حجوزاتك ({cart.length})</p>
          <ul className="mt-3 space-y-2">
            {cart.map((item, index) => (
              <li key={`${item.start}-${item.resourceId}`} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="font-bold">{item.resourceName}</div>
                  <div className="text-white/60">
                    {item.date} · {formatTime(item.start, venue.timezone)}–{formatTime(item.end, venue.timezone)}
                  </div>
                </div>
                <div className="text-end">
                  {item.priceAmount != null && <div className="font-bold">{formatMoney(item.priceAmount)}</div>}
                  <button
                    type="button"
                    className="text-xs font-bold text-red-300"
                    onClick={() => removeFromCart(index)}
                  >
                    إزالة
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-[12px] bg-night-800 p-4">
        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(event) => setRecurring(event.target.checked)}
            className="h-4 w-4 accent-gold"
            disabled={cart.length > 0}
          />
          حجز متكرر كل {WEEKDAYS_AR[weekday]}
        </label>
        {recurring && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-white/60">
              ينشئ النظام الحجوزات في الأيام المتاحة حتى تاريخ النهاية. الأوقات المحجوزة تُتخطى.
            </p>
            <label className="block text-xs font-bold text-white/60">
              حتى تاريخ
              <input
                type="date"
                min={date}
                value={recurringUntil < date ? date : recurringUntil}
                onChange={(event) => setRecurringUntil(event.target.value)}
                className="mt-1 h-11 w-full rounded-[12px] border-0 bg-white px-3 text-sm font-bold text-text"
              />
            </label>
          </div>
        )}
      </div>

      <div className="sticky bottom-20 z-10 mt-6 space-y-2 md:static md:bottom-auto">
        {selected.length > 0 && !recurring && (
          <Button type="button" variant="secondary" className="w-full" onClick={addToCart}>
            أضف إلى الحجز
          </Button>
        )}
        <Button
          className="w-full"
          disabled={cart.length === 0 && selected.length === 0}
          onClick={checkout}
        >
          {cart.length > 0
            ? `تأكيد ${cart.length} حجزًا · ${formatMoney(cartTotal)}`
            : recurring
              ? "متابعة الحجز المتكرر"
              : "احجز هذا الوقت"}
          {cart.length === 0 && selected.length > 0 ? ` · ${formatDuration(durationMinutes)}` : ""}
          {cart.length === 0 && selected.length > 0 ? ` · ${formatMoney(price)}` : ""}
        </Button>
      </div>
    </div>
  );
}

function consecutiveRange(slots: AvailabilitySlot[], from: AvailabilitySlot, to: AvailabilitySlot) {
  const startIndex = slots.findIndex((item) => item.start === from.start);
  const endIndex = slots.findIndex((item) => item.start === to.start);
  if (startIndex < 0 || endIndex < 0) return null;
  const slice = slots.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
  for (let index = 1; index < slice.length; index += 1) {
    if (slice[index - 1].end !== slice[index].start) return null;
  }
  return slice;
}
