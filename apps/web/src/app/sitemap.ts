import type { MetadataRoute } from "next";
import { venueService } from "@/lib/api";
import { SITE_URL } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/venues`, lastModified: new Date() },
  ];
  try {
    const result = await venueService.search({ page: 1, pageSize: 100 });
    return [
      ...staticRoutes,
      ...result.items.map((venue) => ({
        url: `${SITE_URL}/venues/${venue.slug}`,
        lastModified: new Date(),
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
