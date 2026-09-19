"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { BookingPanel } from "@/components/booking-panel";
import { venueService, type PublicVenue } from "@/lib/api";

export default function BookPage() {
  const { slug } = useParams<{ slug: string }>();
  const search = useSearchParams();
  const [venue, setVenue] = useState<PublicVenue | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void venueService
      .getBySlug(slug)
      .then(setVenue)
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState title="الملعب غير موجود" body="هذا الملعب غير متاح للحجز." href="/venues" action="تصفح الملاعب" />
      </div>
    );
  }
  if (!venue) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 md:px-6">
      <div>
        <Link href={`/venues/${venue.slug}`} className="text-sm font-bold text-text-muted">
          {venue.name}
        </Link>
        <h1 className="mt-2 text-h1">احجز وقتًا</h1>
      </div>
      <BookingPanel
        venue={venue}
        initialResourceId={search.get("resourceId") ?? undefined}
        initialDate={search.get("date") ?? undefined}
      />
    </div>
  );
}
