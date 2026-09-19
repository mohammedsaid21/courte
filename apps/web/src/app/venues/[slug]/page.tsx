import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { BookingPanel } from "@/components/booking-panel";
import { VenuePlaceholder } from "@/components/court-field";
import { venueService } from "@/lib/api";
import { cancellationCopy, formatMoney, mapsUrl, SITE_NAME, SITE_URL, weekdayLabel } from "@/lib/utils";
import { cityAr } from "@/lib/ar";

export const revalidate = 60;

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
    `Book ${venue.name} in ${venue.city}. See available courts, hours, and prices.`;
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
      images: venue.coverImageUrl ? [{ url: venue.coverImageUrl }] : undefined,
    },
  };
}

export default async function VenueDetailsPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const venue = await loadVenue(slug);
  if (!venue) notFound();

  const photos = venue.photos.length > 0 ? venue.photos : venue.coverImageUrl ? [{ url: venue.coverImageUrl }] : [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: venue.name,
    description: venue.description,
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
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="bg-night">
        <div className="mx-auto grid max-w-6xl gap-2 px-4 py-4 md:grid-cols-[1.6fr_1fr] md:px-6">
          <div className="relative min-h-[280px] overflow-hidden rounded-brand md:min-h-[420px]">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[0].url} alt="" className="h-full w-full object-cover" />
            ) : (
              <VenuePlaceholder name={venue.name} className="h-full min-h-[280px] md:min-h-[420px]" />
            )}
          </div>
          <div className="hidden grid-cols-2 gap-2 md:grid">
            {(photos.slice(1, 5).length > 0 ? photos.slice(1, 5) : []).map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.url} src={photo.url} alt="" className="h-full min-h-[204px] w-full rounded-brand object-cover" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1fr_380px] md:px-6">
        <div className="space-y-8">
          <header>
            <p className="text-sm font-bold text-text-muted">{cityAr(venue.city)}</p>
            <h1 className="mt-1 text-h1">{venue.name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {venue.types.map((type) => (
                <Badge key={type.id} tone="lime">
                  {type.name}
                </Badge>
              ))}
            </div>
            {venue.startingPrice != null && (
              <p className="mt-4 text-lg font-extrabold">من {formatMoney(venue.startingPrice)}</p>
            )}
          </header>
          {venue.description && <p className="text-body">{venue.description}</p>}

          <section>
            <h2 className="text-h3">الموقع</h2>
            <p className="mt-2 text-body">
              {venue.address}، {cityAr(venue.city)}
            </p>
            <a className="mt-3 inline-flex min-h-11 items-center text-sm font-bold" href={mapsUrl(venue)} target="_blank" rel="noreferrer">
              افتح في الخرائط
            </a>
          </section>

          <section>
            <h2 className="text-h3">المرافق</h2>
            {venue.amenities.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">لا توجد مرافق مدرجة بعد.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {venue.amenities.map((item) => (
                  <span key={item.id} className="rounded-full bg-white px-3 py-1 text-sm font-medium">
                    {item.name}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-h3">الملاعب والساعات</h2>
            {venue.resources.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">هذا المكان لم ينشر ملاعب قابلة للحجز بعد.</p>
            ) : (
              <div className="mt-4 space-y-6">
                {venue.resources.map((resource) => (
                  <div key={resource.id} className="border-t border-border pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold tracking-tight">{resource.name}</h3>
                        {resource.type && <p className="text-sm text-text-muted">{resource.type.name}</p>}
                      </div>
                      {resource.startingPrice != null && (
                        <div className="text-sm font-bold">{formatMoney(resource.startingPrice)}</div>
                      )}
                    </div>
                    {resource.description && <p className="mt-2 text-sm text-text-muted">{resource.description}</p>}
                    <div className="mt-3 grid gap-1 text-sm">
                      {resource.hours
                        .slice()
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((hour) => (
                          <div key={hour.dayOfWeek} className="flex justify-between">
                            <span>{weekdayLabel(hour.dayOfWeek)}</span>
                            <span>{hour.isClosed ? "مغلق" : `${hour.opensAt}–${hour.closesAt}`}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-h3">الإلغاء</h2>
            <p className="mt-2 text-sm text-text-muted">{cancellationCopy(venue.cancellationHours, venue.cancellationPolicy)}</p>
          </section>

          <section>
            <h2 className="text-h3">تواصل</h2>
            <p className="mt-2 text-sm">هاتف {venue.phone}</p>
            {venue.whatsapp && <p className="text-sm">WhatsApp {venue.whatsapp}</p>}
          </section>
        </div>

        <div id="book" className="md:sticky md:top-24 md:self-start">
          <BookingPanel venue={venue} />
        </div>
      </div>
    </article>
  );
}
