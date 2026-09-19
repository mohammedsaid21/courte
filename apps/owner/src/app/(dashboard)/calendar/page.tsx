"use client";

import { Suspense } from "react";
import { BookingCalendar } from "@/components/booking-calendar";

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-muted">جاري تحميل الجدول…</div>}>
      <BookingCalendar />
    </Suspense>
  );
}
