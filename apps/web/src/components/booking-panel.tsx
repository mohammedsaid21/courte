"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Select } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import {
  availabilityService,
  userFacingMessage,
  type AvailabilityResponse,
  type AvailabilitySlot,
  type PublicVenue,
} from "@/lib/api";
import { addDaysYmd, durationOptions, formatDuration, formatMoney, formatTime, todayYmd } from "@/lib/utils";
import { format } from "date-fns";
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
  const [resourceId, setResourceId] = useState(initialResourceId || venue.resources[0]?.id || "");
  const [date, setDate] = useState(initialDate || todayYmd());
  const resource = venue.resources.find((item) => item.id === resourceId) ?? venue.resources[0];
  const [duration, setDuration] = useState(resource?.defaultDurationMinutes ?? 60);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const quickDates = useMemo(() => {
    const start = todayYmd();
    return Array.from({ length: 14 }, (_, index) => addDaysYmd(start, index));
  }, []);

  useEffect(() => {
    const current = venue.resources.find((item) => item.id === resourceId);
    if (!current) return;
    setDuration(current.defaultDurationMinutes);
  }, [resourceId, venue.resources]);

  useEffect(() => {
    if (!resourceId) return;
    let cancelled = false;
    setLoadingSlots(true);
    setError(null);
    setSelectedSlot(null);
    void availabilityService
      .get(venue.id, resourceId, date, duration)
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
  }, [venue.id, resourceId, date, duration]);

  if (venue.resources.length === 0) {
    return <EmptyState title="لا يوجد حجز بعد" body="هذا المكان لم ينشر ملعبًا قابلاً للحجز." />;
  }
  if (!resource) return <Skeleton className="h-40 w-full" />;

  const durations = durationOptions(resource.minDurationMinutes, resource.maxDurationMinutes, resource.slotIntervalMinutes);

  function book() {
    if (!selectedSlot || !resource) return;
    const params = new URLSearchParams({
      resourceId: resource.id,
      start: selectedSlot.start,
      end: selectedSlot.end,
    });
    router.push(`/venues/${venue.slug}/book/review?${params}`);
  }

  return (
    <div className={cn("rounded-[12px] bg-pitch-dark p-5 text-white", compact && "p-4")}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-gold">احجز وقتك</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">العب هنا</h2>
        </div>
        {selectedSlot?.priceAmount != null && (
          <div className="text-end">
            <div className="text-2xl font-extrabold text-gold">{formatMoney(selectedSlot.priceAmount)}</div>
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
        {durations.length > 1 && (
          <Select
            className="border-white/10 bg-night-800 text-white"
            value={String(duration)}
            onChange={(event) => setDuration(Number(event.target.value))}
          >
            {durations.map((item) => (
              <option key={item} value={item}>
                {formatDuration(item)}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-bold text-white/50">اختر التاريخ</p>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-1">
          {quickDates.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDate(item)}
              className={cn(
                "min-h-16 w-[72px] shrink-0 rounded-brand px-2 text-center text-sm font-bold",
                item === date ? "bg-gold text-pitch-deep" : "bg-night-800 text-white",
              )}
            >
              <div>{format(new Date(`${item}T12:00:00`), "EEE")}</div>
              <div className="text-lg leading-none">{format(new Date(`${item}T12:00:00`), "d")}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[11px] font-bold text-white/50">اختر الوقت</p>
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
              const active = selectedSlot?.start === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "min-h-14 rounded-brand px-3 py-2 text-left text-sm font-bold transition",
                    active ? "bg-gold text-pitch-deep" : "bg-night-800 text-white hover:bg-night-700",
                  )}
                >
                  {formatTime(slot.start, availability.timezone)}
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

      <div className="sticky bottom-20 z-10 mt-6 md:static md:bottom-auto">
        <Button className="w-full" disabled={!selectedSlot} onClick={book}>
          احجز هذا الوقت
          {selectedSlot?.priceAmount != null ? ` · ${formatMoney(selectedSlot.priceAmount)}` : ""}
        </Button>
      </div>
    </div>
  );
}
