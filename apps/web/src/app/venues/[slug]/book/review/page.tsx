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
} from "@/lib/api";
import {
  cancellationCopy,
  formatDateLong,
  formatDuration,
  formatMoney,
  formatTime,
  ymdInZone,
} from "@/lib/utils";

export default function ReviewBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { session, me, loading } = useSession();
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  const resourceId = search.get("resourceId") ?? "";
  const start = search.get("start") ?? "";
  const end = search.get("end") ?? "";
  const nextPath = `/venues/${slug}/book/review?${search.toString()}`;

  useEffect(() => {
    void venueService.getBySlug(slug).then(setVenue).catch(() => setVenue(null));
  }, [slug]);

  useEffect(() => {
    if (!venue || !resourceId || !start) return;
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
  }, [venue, resourceId, start, end]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, session, router, nextPath]);

  if (!start || !end || !resourceId) {
    return <EmptyState title="تفاصيل الحجز ناقصة" body="اختر وقتًا أولاً." href={`/venues/${slug}/book`} action="اختر وقتًا" />;
  }
  if (loading || !session) {
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
        <h1 className="mt-2 text-h1">تأكيد الحجز</h1>
      </div>
      {conflict && (
        <Alert tone="warning" description="هذا الوقت لم يعد متاحًا. اختر وقتًا آخر." />
      )}
      {slotError && !conflict && (
        <Alert tone="danger" description={slotError} />
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
        <Button className="w-full" disabled={submitting || conflict} onClick={() => void confirm()}>
          {submitting ? "جارٍ التأكيد…" : "تأكيد الحجز"}
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
