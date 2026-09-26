import { publicApi } from "./client";
import type { CatalogItem, DiscoverQuery, DiscoverResponse, PublicVenue } from "./types";

function toParams(query: DiscoverQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  return params.toString();
}

export const venueService = {
  types: () => publicApi<CatalogItem[]>("/venue-types", { next: { revalidate: 300 } }),
  amenities: () => publicApi<CatalogItem[]>("/amenities", { next: { revalidate: 300 } }),
  search: (query: DiscoverQuery) => {
    const q = toParams(query);
    return publicApi<DiscoverResponse>(`/discover/venues${q ? `?${q}` : ""}`);
  },
  getBySlug: (slug: string) =>
    publicApi<PublicVenue>(`/venues/public/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    }),
};
