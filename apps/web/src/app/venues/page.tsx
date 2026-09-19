import type { Metadata } from "next";
import { Suspense } from "react";
import VenuesPage from "./page-client";
import { VenueCardSkeleton } from "@/components/skeleton";

export const metadata: Metadata = {
  title: "الملاعب",
  description: "ابحث عن ملاعب كرة قدم في الضفة واحجز وقتًا شاغرًا.",
  alternates: { canonical: "/venues" },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <VenueCardSkeleton key={index} />
          ))}
        </div>
      }
    >
      <VenuesPage />
    </Suspense>
  );
}
