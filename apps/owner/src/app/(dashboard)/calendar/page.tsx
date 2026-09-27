"use client";

import { Suspense } from "react";
import { BookingCalendar } from "@/components/booking-calendar";

function CalendarFallback() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <BookingCalendar />
    </Suspense>
  );
}
