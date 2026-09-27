import Link from "next/link";
import { formatMoney, venueCoverUrl } from "@/lib/utils";
import { COURT_SIZES, cityAr } from "@/lib/ar";
import type { DiscoverVenue } from "@/lib/api";
import { VenuePlaceholder } from "./court-field";

export function VenueCard({ venue, preview = false }: { venue: DiscoverVenue; preview?: boolean }) {
  const sport =
    venue.types.map((type) => type.nameAr || type.name).filter(Boolean).join(" · ") || "رياضة";
  const size = venue.sizes?.[0];
  const sizeLabel = COURT_SIZES.find((item) => item.id === size)?.label;

  const imageUrl = venueCoverUrl(venue);

  const href = preview ? "#" : `/venues/${venue.slug}`;

  return (
    <Link
      href={href}
      className={`group block overflow-hidden rounded-[12px] border border-white/80 bg-white shadow-glass ${preview ? "pointer-events-none" : ""}`}
      aria-disabled={preview}
      onClick={preview ? (e) => e.preventDefault() : undefined}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-pitch-light">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={venue.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <VenuePlaceholder name={venue.name} className="h-full w-full" />
        )}
        <div className="absolute start-3 top-3 flex flex-wrap gap-1">
          {preview && (
            <span className="rounded-full bg-arena-lime px-2.5 py-1 text-[11px] font-black text-arena-stadium">مثال توضيحي</span>
          )}
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-pitch backdrop-blur">
            {preview ? venue.hoursLabel : venue.open ? "مفتوح الآن" : venue.hoursLabel || "ساعات متفاوتة"}
          </span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div>
          <h2 className="font-display text-lg font-extrabold">{venue.name}</h2>
          <p className="mt-0.5 text-sm font-medium text-text-muted">
            {sport} · {cityAr(venue.city)}
            {sizeLabel ? ` · ${sizeLabel}` : ""}
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
