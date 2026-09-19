import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { cityAr } from "@/lib/ar";
import type { DiscoverVenue } from "@/lib/api";
import { VenuePlaceholder } from "./court-field";

export function VenueCard({ venue }: { venue: DiscoverVenue }) {
  const sport = venue.types[0]?.name ?? "كرة قدم";

  return (
    <Link href={`/venues/${venue.slug}`} className="group block overflow-hidden rounded-[12px] border border-white/80 bg-white shadow-glass">
      <div className="relative aspect-[16/10] overflow-hidden bg-pitch-light">
        {venue.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={venue.coverImageUrl}
            alt={venue.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <VenuePlaceholder name="" className="h-full w-full" />
        )}
        <div className="absolute start-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-pitch backdrop-blur">
          {venue.open ? "مفتوح الآن" : venue.hoursLabel || "ساعات متفاوتة"}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div>
          <h2 className="font-display text-lg font-extrabold">{venue.name}</h2>
          <p className="mt-0.5 text-sm font-medium text-text-muted">
            {sport} · {cityAr(venue.city)}
          </p>
        </div>
        {venue.startingPrice != null && (
          <div className="font-display text-lg font-extrabold">
            {formatMoney(venue.startingPrice, venue.currency)}
            <span className="text-sm font-bold text-text-muted">/ساعة</span>
          </div>
        )}
      </div>
    </Link>
  );
}
