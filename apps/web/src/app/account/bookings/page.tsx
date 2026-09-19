"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, Tabs } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { Badge, ButtonLink } from "@/components/ui";
import { bookingService, userFacingMessage, type CustomerBooking } from "@/lib/api";
import { formatDate, formatMoney, formatTime, statusLabel } from "@/lib/utils";

type Tab = "upcoming" | "past" | "cancelled";

function tone(status: string): "green" | "red" | "blue" | "amber" {
  if (status === "CANCELLED") return "red";
  if (status === "PENDING") return "amber";
  if (status === "COMPLETED") return "green";
  return "blue";
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");

  useEffect(() => {
    void bookingService
      .list()
      .then(setBookings)
      .catch((err) => setError(userFacingMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: bookings.filter((item) => item.status !== "CANCELLED" && new Date(item.startsAt).getTime() >= now),
      past: bookings.filter((item) => item.status !== "CANCELLED" && new Date(item.startsAt).getTime() < now),
      cancelled: bookings.filter((item) => item.status === "CANCELLED"),
    };
  }, [bookings]);

  const items = grouped[tab];
  const nextGame = grouped.upcoming[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <h1 className="text-h1">حجوزاتك</h1>
      {nextGame && tab === "upcoming" && (
        <div className="rounded-[12px] bg-pitch-dark p-6 text-white">
          <p className="text-[11px] font-bold text-gold">المباراة القادمة</p>
          <div className="mt-3 font-display text-3xl font-extrabold tracking-tight">
            {formatDate(nextGame.startsAt, nextGame.venue.timezone)}
          </div>
          <div className="mt-1 text-lg text-white/80">
            {formatTime(nextGame.startsAt, nextGame.venue.timezone)} – {formatTime(nextGame.endsAt, nextGame.venue.timezone)}
          </div>
          <div className="mt-4 font-bold">{nextGame.venue.name}</div>
          <div className="text-sm text-white/60">{nextGame.resource.name}</div>
          <ButtonLink href={`/account/bookings/${nextGame.id}`} className="mt-6">
            عرض الحجز
          </ButtonLink>
        </div>
      )}
      <Tabs
        items={[
          { key: "upcoming", label: "القادمة" },
          { key: "past", label: "السابقة" },
          { key: "cancelled", label: "الملغاة" },
        ]}
        value={tab}
        onChange={(key) => setTab(key as Tab)}
      />
      {error && <Alert tone="danger" description={error} />}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? "لا حجوزات قادمة" : tab === "past" ? "لا حجوزات سابقة" : "لا حجوزات ملغاة"}
          body={tab === "upcoming" ? "ابحث عن ملعب واحجز وقتًا شاغرًا." : "ستظهر الحجوزات هنا."}
          href={tab === "upcoming" ? "/venues" : undefined}
          action={tab === "upcoming" ? "ابحث عن ملعب" : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((booking) => (
            <Link key={booking.id} href={`/account/bookings/${booking.id}`} className="block rounded-[12px] border border-border bg-white p-4 hover:border-pitch">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold tracking-tight">{booking.venue.name}</div>
                  <div className="text-sm text-text-muted">{booking.resource.name}</div>
                </div>
                <Badge tone={tone(booking.status)}>{statusLabel(booking.status)}</Badge>
              </div>
              <div className="mt-3 text-sm text-text-muted">
                {formatDate(booking.startsAt, booking.venue.timezone)} · {formatTime(booking.startsAt, booking.venue.timezone)}–
                {formatTime(booking.endsAt, booking.venue.timezone)}
              </div>
              <div className="mt-1 text-sm font-bold">{formatMoney(booking.priceAmount)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
