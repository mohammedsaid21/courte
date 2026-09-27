"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { Badge, Button, ButtonLink } from "@/components/ui";
import { bookingService, userFacingMessage, type CustomerBooking } from "@/lib/api";
import { cityAr } from "@/lib/ar";
import {
  cancellationCopy,
  formatDateLong,
  formatDuration,
  formatMoney,
  formatTime,
  statusLabel,
} from "@/lib/utils";

function statusTone(status: string): "green" | "red" | "blue" | "amber" {
  if (status === "CANCELLED") return "red";
  if (status === "PENDING") return "amber";
  if (status === "COMPLETED") return "green";
  return "blue";
}

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

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 md:px-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const cancelled = booking.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 pb-28 md:px-6 md:pb-8">
      {confirmed && !cancelled && <Alert tone="success" description="تم تأكيد حجزك — نراك في الملعب!" />}

      <div>
        <Link
          href="/account/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-text-muted transition hover:text-pitch"
        >
          <ArrowRight size={16} className="rotate-180" />
          كل الحجوزات
        </Link>
        <h1 className="mt-3 font-display text-h1">{confirmed ? "حجزك جاهز" : "تفاصيل الحجز"}</h1>
        <p className="mt-1 text-sm text-text-muted">رقم الحجز · {booking.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="relative bg-pitch-dark p-6 text-white">
          {booking.venue.coverImageUrl ? (
            <>
              <img
                src={booking.venue.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pitch-dark via-pitch-dark/85 to-pitch-dark/50" />
            </>
          ) : (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,255,0,0.12),transparent_55%)]" />
          )}
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{booking.venue.name}</p>
              <Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>
            </div>
            <div className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {formatDateLong(booking.startsAt, booking.venue.timezone)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
                <Clock size={15} className="text-gold" />
                {formatTime(booking.startsAt, booking.venue.timezone)}–{formatTime(booking.endsAt, booking.venue.timezone)}
              </span>
              <span className="text-white/50">·</span>
              <span>{formatDuration(booking.durationMinutes)}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-white/90">{booking.resource.name}</p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <InfoTile icon={<MapPin size={18} />} label="المدينة" value={cityAr(booking.venue.city)} />
          <InfoTile icon={<Ticket size={18} />} label="السعر" value={formatMoney(booking.priceAmount)} highlight />
          <InfoTile icon={<Calendar size={18} />} label="تاريخ الحجز" value={formatDateLong(booking.startsAt, booking.venue.timezone)} />
          <InfoTile
            icon={<Clock size={18} />}
            label="المدة"
            value={formatDuration(booking.durationMinutes)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bg-subtle p-5">
        <h2 className="text-h3">سياسة الإلغاء</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          {cancellationCopy(booking.cancellationHours, booking.cancellationPolicy)}
        </p>
        {booking.canCancel && !cancelled && (
          <p className="mt-3 text-xs font-bold text-pitch">يمكنك الإلغاء من الزر أدناه قبل انتهاء المهلة.</p>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row">
          <ButtonLink href={`/venues/${booking.venue.slug}`} className="flex-1" variant="secondary">
            عرض الملعب
          </ButtonLink>
          {booking.canCancel && !cancelled && (
            <Button variant="danger" className="flex-1" disabled={cancelling} onClick={() => void cancel()}>
              {cancelling ? "جارٍ الإلغاء…" : "إلغاء الحجز"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/80 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitch-dark/5 text-pitch">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-text-muted">{label}</div>
        <div className={`mt-0.5 truncate font-extrabold ${highlight ? "text-lg text-gold" : "text-text"}`}>{value}</div>
      </div>
    </div>
  );
}
