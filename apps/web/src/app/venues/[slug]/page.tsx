import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VenueProfile } from "@/components/venue-profile";
import { venueService } from "@/lib/api";
import { SITE_NAME, SITE_URL, venueCoverUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { slug: string };

async function loadVenue(slug: string) {
  try {
    return await venueService.getBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const venue = await loadVenue(slug);
  if (!venue) {
    return { title: "Venue not found" };
  }
  const description =
    venue.description?.slice(0, 160) ||
    venue.descriptionEn?.slice(0, 160) ||
    `Book ${venue.nameEn || venue.name} in ${venue.city}. See available courts, hours, and prices.`;
  const url = `${SITE_URL}/venues/${venue.slug}`;
  return {
    title: `${venue.name} · ${venue.city}`,
    description,
    alternates: { canonical: `/venues/${venue.slug}` },
    openGraph: {
      title: `${venue.name} | ${SITE_NAME}`,
      description,
      url,
      type: "website",
      images: (() => {
        const image = venueCoverUrl(venue);
        return image ? [{ url: image }] : undefined;
      })(),
    },
  };
}

export default async function VenueDetailsPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const venue = await loadVenue(slug);
  if (!venue) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: venue.name,
    alternateName: venue.nameEn,
    description: venue.description || venue.descriptionEn,
    telephone: venue.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address,
      addressLocality: venue.city,
    },
    geo:
      venue.latitude != null && venue.longitude != null
        ? { "@type": "GeoCoordinates", latitude: venue.latitude, longitude: venue.longitude }
        : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VenueProfile venue={venue} />
    </>
  );
}
