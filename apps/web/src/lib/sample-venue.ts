import type { DiscoverVenue } from "@/lib/api";

/** Illustrative venue for guests on /venues — not a real listing. */
export const SAMPLE_DISCOVER_VENUE: DiscoverVenue = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "sample-preview",
  name: "مثال — ملعب خماسي",
  nameEn: "Sample — 5-a-side pitch",
  city: "Ramallah",
  address: "منطقة تجريبية",
  addressEn: "Sample area",
  coverImageUrl: null,
  types: [{ id: "sample-type", name: "Football", nameAr: "كرة القدم", slug: "football" }],
  sizes: ["5v5"],
  surfaces: ["ARTIFICIAL_GRASS"],
  startingPrice: null,
  currency: "ILS",
  open: true,
  hoursLabel: "16:00 – 23:00",
  distanceKm: null,
  latitude: null,
  longitude: null,
  available: true,
  acceptsOnlineBooking: true,
};
