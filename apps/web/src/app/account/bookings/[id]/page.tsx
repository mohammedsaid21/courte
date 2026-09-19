"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { Badge, Button } from "@/components/ui";
import { bookingService, userFacingMessage, type CustomerBooking } from "@/lib/api";
import { cancellationCopy, formatDateLong, formatMoney, formatTime, statusLabel } from "@/lib/utils";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const confirmed = search.get("confirmed") === "1";
  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [missing, setMissing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    void bookingService
      .get(id)
      .then(setBooking)
      .catch(() => setMissing(true));
  }, [id]);

  async function cancel() {
    if (!booking) return;
    const ok = window.confirm(
      cancellationCopy(booking.cancellationHours, booking.cancellationPolicy) + "\n\nإلغاء هذا الحجز؟",
    );
    if (!ok) return;
    setCancelling(true);
    try {
      setBooking(await bookingService.cancel(booking.id));
      toast.success("تم إلغاء الحجز.");
    } catch (error) {
      toast.error(userFacingMessage(error));
    } finally {
      setCancelling(false);
    }
  }

  if (missing) {
    return <EmptyState title="الحجز غير موجود" body="هذا الحجز ليس في حسابك." href="/account/bookings" action="حجوزاتك" />;
  }
  if (!booking) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8 md:px-6">
      {confirmed && booking.status !== "CANCELLED" && (
        <Alert tone="success" description="تم تأكيد حجزك." />
      )}
      <div>
        <Link href="/account/bookings" className="text-sm font-bold text-text-muted">
          كل الحجوزات
        </Link>
        <h1 className="mt-2 text-h1">{confirmed ? "حجزك جاهز" : "تفاصيل الحجز"}</h1>
      </div>
      <div className="rounded-[12px] bg-pitch-dark p-5 text-white">
        <p className="text-[11px] font-bold text-gold">{booking.venue.name}</p>
        <div className="mt-3 text-3xl font-extrabold tracking-tight">
          {formatDateLong(booking.startsAt, booking.venue.timezone)}
        </div>
        <div className="mt-1 text-white/75">
          {formatTime(booking.startsAt, booking.venue.timezone)}–{formatTime(booking.endsAt, booking.venue.timezone)} · {booking.resource.name}
        </div>
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-white/55">السعر</span>
          <span className="font-extrabold text-gold">{formatMoney(booking.priceAmount)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-white/55">الحالة</span>
          <Badge tone={booking.status === "CANCELLED" ? "red" : "lime"}>{statusLabel(booking.status)}</Badge>
        </div>
      </div>
      <div>
        <h2 className="text-h3">سياسة الإلغاء</h2>
        <p className="mt-2 text-sm text-text-muted">
          {cancellationCopy(booking.cancellationHours, booking.cancellationPolicy)}
        </p>
      </div>
      {booking.canCancel && (
        <Button variant="danger" className="w-full" disabled={cancelling} onClick={() => void cancel()}>
          {cancelling ? "جارٍ الإلغاء…" : "إلغاء الحجز"}
        </Button>
      )}
      <Link href={`/venues/${booking.venue.slug}`} className="block text-center text-sm font-bold">
        عرض الملعب
      </Link>
    </div>
  );
}
