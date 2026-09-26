"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useSession } from "@/components/session-provider";
import { Skeleton } from "@/components/skeleton";
import { Alert, Button } from "@/components/ui";
import {
  availabilityService,
  bookingService,
  userFacingMessage,
  venueService,
  type AvailabilitySlot,
  type PublicVenue,
  type RecurringPlan,
} from "@/lib/api";
import { clearBookingCart, loadBookingCart, type BookingCartItem } from "@/lib/booking-cart";
import {
  addMonthsYmd,
  cancellationCopy,
  formatDateLong,
  formatDuration,
  formatMoney,
  formatTime,
  weekdayFromYmd,
  ymdInZone,
} from "@/lib/utils";
import { WEEKDAYS_AR } from "@/lib/ar";

export default function ReviewBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { session, me, loading, profileLoading } = useSession();
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [plan, setPlan] = useState<RecurringPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [cart, setCart] = useState<BookingCartItem[]>([]);

  const cartMode = search.get("cart") === "1";
  const resourceId = search.get("resourceId") ?? "";
  const start = search.get("start") ?? "";
  const end = search.get("end") ?? "";
  const recurring = search.get("recurring") === "1";
  const until = search.get("until") || "";
  const nextPath = `/venues/${slug}/book/review?${search.toString()}`;

  useEffect(() => {
    void venueService.getBySlug(slug).then(setVenue).catch(() => setVenue(null));
  }, [slug]);

  useEffect(() => {
    if (!venue || !cartMode) return;
    setCart(loadBookingCart(venue.id));
  }, [venue, cartMode]);

  useEffect(() => {
    if (!venue || cartMode || !resourceId || !start) return;
    const date = ymdInZone(start, venue.timezone);
    const durationMinutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    void availabilityService
      .get(venue.id, resourceId, date, durationMinutes)
      .then((result) => {
        const match = result.slots.find((item) => item.start === start && item.end === end);
        if (!match) {
          setConflict(true);
          setSlot(null);
          setSlotError("هذا الوقت لم يعد متاحًا.");
          return;
        }
        setSlot(match);
        setConflict(false);
        setSlotError(null);
      })
      .catch((error) => {
        setSlotError(userFacingMessage(error));
      });
  }, [venue, resourceId, start, end, cartMode]);

  useEffect(() => {
    if (!recurring || cartMode || !venue || !resourceId || !start || !end) return;
    const startDate = ymdInZone(start, venue.timezone);
    const endDate = until || addMonthsYmd(startDate, 1);
    const durationMinutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    let cancelled = false;
    void bookingService
      .previewRecurring({
        venueId: venue.id,
        resourceId,
        daysOfWeek: [weekdayFromYmd(startDate)],
        startTime: formatTime(start, venue.timezone),
        durationMinutes,
        startDate,
        endDate,
        skipConflicts: true,
      })
      .then((result) => {
        if (cancelled) return;
        setPlan(result);
        setPlanError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setPlan(null);
        setPlanError(userFacingMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [recurring, venue, resourceId, start, end, until, cartMode]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, session, router, nextPath]);

  if (cartMode) {
    if (loading || profileLoading || !session) {
      return <Skeleton className="h-64 w-full" />;
    }
    if (!venue) return <Skeleton className="h-64 w-full" />;
    if (cart.length === 0) {
      return (
        <EmptyState
          title="لا توجد حجوزات"
          body="أضف أوقاتًا من صفحة الحجز أولاً."
          href={`/venues/${slug}/book`}
          action="اختر أوقاتًا"
        />
      );
    }
    const total = cart.reduce((sum, item) => sum + (item.priceAmount ?? 0), 0);

    async function confirmCart() {
      if (!me?.fullName || !me.phone) {
        router.replace(`/account/profile?next=${encodeURIComponent(nextPath)}`);
        toast.error("أضف اسمك ورقم هاتفك قبل الحجز.");
        return;
      }
      setSubmitting(true);
      try {
        const created = await bookingService.createBatch(
          cart.map((item) => ({
            venueId: venue!.id,
            resourceId: item.resourceId,
            startsAt: item.start,
            endsAt: item.end,
          })),
        );
        clearBookingCart(venue!.id);
        toast.success(`تم تأكيد ${created.length} حجزًا.`);
        router.replace("/account/bookings?confirmed=1");
      } catch (error) {
        toast.error(userFacingMessage(error));
      } finally {
        setSubmitting(false);
      }
    }

    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <Link href={`/venues/${slug}/book`} className="text-sm font-bold text-text-muted">
            العودة للأوقات
          </Link>
          <h1 className="mt-2 text-h1">تأكيد {cart.length} حجزًا</h1>
        </div>
        <div className="rounded-[12px] bg-pitch-dark p-5 text-white">
          <p className="text-[11px] font-bold text-gold">{venue.name}</p>
          <ul className="mt-4 space-y-3">
            {cart.map((item) => (
              <li key={`${item.start}-${item.resourceId}`} className="flex justify-between gap-3 text-sm">
                <div>
                  <div className="font-bold">{item.resourceName}</div>
                  <div className="text-white/60">
                    {formatDateLong(item.start, venue.timezone)} ·{" "}
                    {formatTime(item.start, venue.timezone)}–{formatTime(item.end, venue.timezone)}
                  </div>
                </div>
                {item.priceAmount != null && <span className="font-bold">{formatMoney(item.priceAmount)}</span>}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-white/15 pt-3 text-sm font-bold">
            <span className="text-white/55">الإجمالي</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-extrabold tracking-tight">بياناتك</h2>
          <p className="text-sm">{me?.fullName}</p>
          <p className="text-sm text-text-muted">{me?.phone}</p>
        </div>
        <Button className="w-full" disabled={submitting} onClick={() => void confirmCart()}>
          {submitting ? "جارٍ التأكيد…" : `تأكيد ${cart.length} حجزًا`}
        </Button>
      </div>
    );
  }

  if (!start || !end || !resourceId) {
    return <EmptyState title="تفاصيل الحجز ناقصة" body="اختر وقتًا أولاً." href={`/venues/${slug}/book`} action="اختر وقتًا" />;
  }
  if (loading || profileLoading || !session) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!venue) {
    return <Skeleton className="h-64 w-full" />;
  }

  const resource = venue.resources.find((item) => item.id === resourceId);
  if (!resource) {
    return <EmptyState title="الملعب غير موجود" body="هذا الملعب لم يعد مدرجًا." href={`/venues/${slug}`} action="العودة للملعب" />;
  }

  const durationMinutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  const quotedPrice = slot?.priceAmount ?? null;

  async function confirm() {
    if (!me?.fullName || !me.phone) {
      router.replace(`/account/profile?next=${encodeURIComponent(nextPath)}`);
      toast.error("أضف اسمك ورقم هاتفك قبل الحجز.");
      return;
    }
    setSubmitting(true);
    setConflict(false);
    try {
      if (recurring) {
        const startDate = ymdInZone(start, venue!.timezone);
        const created = await bookingService.createRecurring({
          venueId: venue!.id,
          resourceId,
          daysOfWeek: [weekdayFromYmd(startDate)],
          startTime: formatTime(start, venue!.timezone),
          durationMinutes,
          startDate,
          endDate: until || addMonthsYmd(startDate, 1),
          skipConflicts: true,
        });
        toast.success(`تم إنشاء ${created.createCount} حجزًا متكررًا.`);
        router.replace("/account/bookings?confirmed=1");
        return;
      }
      const booking = await bookingService.create({
        venueId: venue!.id,
        resourceId,
        startsAt: start,
        endsAt: end,
      });
      router.replace(`/account/bookings/${booking.id}?confirmed=1`);
    } catch (error) {
      const message = userFacingMessage(error);
      if (message.includes("no longer available")) {
        setConflict(true);
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 md:px-6">
      <div>
        <Link href={`/venues/${slug}/book?resourceId=${resourceId}`} className="text-sm font-bold text-text-muted">
          العودة للأوقات
        </Link>
        <h1 className="mt-2 text-h1">{recurring ? "تأكيد الحجز المتكرر" : "تأكيد الحجز"}</h1>
      </div>
      {conflict && (
        <Alert tone="warning" description="هذا الوقت لم يعد متاحًا. اختر وقتًا آخر." />
      )}
      {slotError && !conflict && (
        <Alert tone="danger" description={slotError} />
      )}
      {planError && <Alert tone="danger" description={planError} />}
      {recurring && plan && plan.conflictCount > 0 && (
        <Alert
          tone="warning"
          description={`${plan.conflictCount} يومًا غير متاح وسيُتخطى. يتأكد ${plan.createCount} حجزًا فقط.`}
        />
      )}
      <div className="rounded-[12px] bg-pitch-dark p-5 text-white">
        <p className="text-[11px] font-bold text-gold">مباراتك</p>
        <div className="mt-4 space-y-3">
          <Row label="الملعب" value={venue.name} />
          <Row label="المساحة" value={resource.name} />
          <Row label="التاريخ" value={formatDateLong(start, venue.timezone)} />
          <Row label="الوقت" value={`${formatTime(start, venue.timezone)}–${formatTime(end, venue.timezone)}`} />
          <Row label="المدة" value={formatDuration(durationMinutes)} />
          <Row label="السعر" value={quotedPrice != null ? formatMoney(quotedPrice) : "يُحسب عند التأكيد"} />
          {recurring && (
            <>
              <Row label="التكرار" value={`كل ${WEEKDAYS_AR[weekdayFromYmd(ymdInZone(start, venue.timezone))]}`} />
              <Row label="حتى" value={until || addMonthsYmd(ymdInZone(start, venue.timezone), 1)} />
              <Row label="الحجوزات المتاحة" value={plan ? String(plan.createCount) : "…"} />
            </>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-extrabold tracking-tight">بياناتك</h2>
        <p className="text-sm">{me?.fullName}</p>
        <p className="text-sm text-text-muted">{me?.phone}</p>
        {me?.whatsapp && <p className="text-sm text-text-muted">واتساب {me.whatsapp}</p>}
        <p className="text-sm text-text-muted">{me?.email}</p>
        <Link href={`/account/profile?next=${encodeURIComponent(nextPath)}`} className="text-sm font-bold">
          تعديل الملف
        </Link>
      </div>
      <div>
        <h2 className="text-h3">سياسة الإلغاء</h2>
        <p className="mt-2 text-sm text-text-muted">{cancellationCopy(venue.cancellationHours, venue.cancellationPolicy)}</p>
      </div>
      <p className="text-xs text-text-muted">
        الدفع عند الملعب. يُحفظ الحجز كغير مدفوع حتى يؤشره صاحب الملعب.
      </p>
      <div className="fixed inset-x-0 bottom-20 z-20 p-3 md:static md:p-0">
        <Button className="w-full" disabled={submitting || conflict || Boolean(planError)} onClick={() => void confirm()}>
          {submitting ? "جارٍ التأكيد…" : recurring ? "تأكيد الحجوزات المتكررة" : "تأكيد الحجز"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-white/55">{label}</span>
      <span className="text-start font-bold">{value}</span>
    </div>
  );
}
