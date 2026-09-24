"use client";

import { useMemo, useState } from "react";
import {
  COURT_SETTING_LABELS,
  COURT_SURFACE_LABELS,
  PRICING_RULE_NAMES,
  durationLabel,
  isCourtSetting,
  isCourtSurface,
} from "@courte/shared";
import { Badge } from "@/components/ui";
import { BookingPanel } from "@/components/booking-panel";
import { VenuePlaceholder } from "@/components/court-field";
import { VenueMap } from "@/components/venue-map";
import type { PublicVenue } from "@/lib/api";
import { cancellationCopy, formatMoney, mapsUrl, weekdayLabel } from "@/lib/utils";
import { COURT_SIZES, catalogName, cityAr, localizedText } from "@/lib/ar";

function sizeLabel(size: string | null, locale: "ar" | "en") {
  const match = COURT_SIZES.find((item) => item.id === size);
  if (!match) return null;
  return locale === "en" ? match.labelEn : match.label;
}

function pricingLabel(name: string, locale: "ar" | "en") {
  if (name === PRICING_RULE_NAMES.REGULAR) return locale === "ar" ? "أوقات عادية" : "Regular hours";
  if (name === PRICING_RULE_NAMES.PEAK) return locale === "ar" ? "أوقات الذروة" : "Peak hours";
  if (name === PRICING_RULE_NAMES.WEEKEND) return locale === "ar" ? "عطلة نهاية الأسبوع" : "Weekend";
  return name;
}

export function VenueProfile({ venue }: { venue: PublicVenue }) {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const photos = venue.photos.length > 0 ? venue.photos : venue.coverImageUrl ? [{ url: venue.coverImageUrl }] : [];
  const name = localizedText(venue.name, venue.nameEn, locale);
  const description = localizedText(venue.description, venue.descriptionEn, locale);
  const address = localizedText(venue.address, venue.addressEn, locale);

  const copy = useMemo(
    () =>
      locale === "ar"
        ? {
            location: "الموقع",
            openMaps: "افتح في الخرائط",
            amenities: "المرافق",
            noAmenities: "لا توجد مرافق مدرجة بعد.",
            courts: "الملاعب والساعات",
            noCourts: "هذا المكان لم ينشر ملاعب قابلة للحجز بعد.",
            closed: "مغلق",
            cancellation: "الإلغاء",
            contact: "تواصل",
            phone: "هاتف",
            lights: "إنارة ليلية",
            from: "من",
          }
        : {
            location: "Location",
            openMaps: "Open in maps",
            amenities: "Amenities",
            noAmenities: "No amenities listed yet.",
            courts: "Courts and hours",
            noCourts: "This venue has not published bookable courts yet.",
            closed: "Closed",
            cancellation: "Cancellation",
            contact: "Contact",
            phone: "Phone",
            lights: "Floodlights",
            from: "From",
          },
    [locale],
  );

  return (
    <article>
      <div className="bg-night">
        <div className="mx-auto grid max-w-6xl gap-2 px-4 py-4 md:grid-cols-[1.6fr_1fr] md:px-6">
          <div className="relative min-h-[280px] overflow-hidden rounded-brand md:min-h-[420px]">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[0].url} alt="" className="h-full w-full object-cover" />
            ) : (
              <VenuePlaceholder name={name} className="h-full min-h-[280px] md:min-h-[420px]" />
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-text-muted">{cityAr(venue.city)}</p>
              <div className="flex rounded-full bg-white p-1 text-xs font-black">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${locale === "ar" ? "bg-pitch text-white" : "text-text-muted"}`}
                  onClick={() => setLocale("ar")}
                >
                  العربية
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${locale === "en" ? "bg-pitch text-white" : "text-text-muted"}`}
                  onClick={() => setLocale("en")}
                >
                  English
                </button>
              </div>
            </div>
            <h1 className="mt-1 text-h1">{name}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {venue.types.map((type) => (
                <Badge key={type.id} tone="lime">
                  {catalogName(type, locale)}
                </Badge>
              ))}
            </div>
            {venue.startingPrice != null && (
              <p className="mt-4 text-lg font-extrabold">
                {copy.from} {formatMoney(venue.startingPrice)}
              </p>
            )}
          </header>
          {description && <p className="text-body">{description}</p>}

          <section>
            <h2 className="text-h3">{copy.location}</h2>
            <p className="mt-2 text-body">
              {address}، {cityAr(venue.city)}
            </p>
            {venue.latitude != null && venue.longitude != null && (
              <div className="mt-4">
                <VenueMap latitude={venue.latitude} longitude={venue.longitude} title={name} />
              </div>
            )}
            <a className="mt-3 inline-flex min-h-11 items-center text-sm font-bold" href={mapsUrl(venue)} target="_blank" rel="noreferrer">
              {copy.openMaps}
            </a>
          </section>

          <section>
            <h2 className="text-h3">{copy.amenities}</h2>
            {venue.amenities.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">{copy.noAmenities}</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {venue.amenities.map((item) => (
                  <span key={item.id} className="rounded-full bg-white px-3 py-1 text-sm font-medium">
                    {catalogName(item, locale)}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-h3">{copy.courts}</h2>
            {venue.resources.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">{copy.noCourts}</p>
            ) : (
              <div className="mt-4 space-y-6">
                {venue.resources.map((resource) => {
                  const specs = [
                    sizeLabel(resource.size, locale),
                    isCourtSurface(resource.surface) ? COURT_SURFACE_LABELS[resource.surface][locale] : null,
                    isCourtSetting(resource.setting) ? COURT_SETTING_LABELS[resource.setting][locale] : null,
                    resource.hasLights ? copy.lights : null,
                    durationLabel(resource.defaultDurationMinutes, locale),
                  ].filter(Boolean);
                  const weekend = resource.pricing.filter((rule) => rule.name === PRICING_RULE_NAMES.WEEKEND);
                  const shownPricing = [
                    ...resource.pricing.filter((rule) => rule.name !== PRICING_RULE_NAMES.WEEKEND),
                    weekend[0] ?? null,
                  ].filter(Boolean);
                  return (
                    <div key={resource.id} className="border-t border-border pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-extrabold tracking-tight">
                            {localizedText(resource.name, resource.nameEn, locale)}
                          </h3>
                          {resource.type && <p className="text-sm text-text-muted">{catalogName(resource.type, locale)}</p>}
                        </div>
                        {resource.startingPrice != null && (
                          <div className="text-sm font-bold">{formatMoney(resource.startingPrice)}</div>
                        )}
                      </div>
                      {specs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {specs.map((item) => (
                            <span key={String(item)} className="rounded-full bg-pitch-light px-3 py-1 text-xs font-bold text-pitch">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                      {(localizedText(resource.description, resource.descriptionEn, locale)) && (
                        <p className="mt-2 text-sm text-text-muted">
                          {localizedText(resource.description, resource.descriptionEn, locale)}
                        </p>
                      )}
                      {shownPricing.length > 0 && (
                        <div className="mt-3 grid gap-1 text-sm">
                          {shownPricing.map((rule) => (
                            <div key={`${rule!.name}-${rule!.startsAt}-${rule!.dayOfWeek}`} className="flex justify-between">
                              <span>{pricingLabel(rule!.name, locale)}</span>
                              <span>{formatMoney(rule!.priceAmount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 grid gap-1 text-sm">
                        {resource.hours
                          .slice()
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((hour) => (
                            <div key={hour.dayOfWeek} className="flex justify-between">
                              <span>{weekdayLabel(hour.dayOfWeek)}</span>
                              <span>{hour.isClosed ? copy.closed : `${hour.opensAt}–${hour.closesAt}`}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-h3">{copy.cancellation}</h2>
            <p className="mt-2 text-sm text-text-muted">{cancellationCopy(venue.cancellationHours, venue.cancellationPolicy)}</p>
          </section>

          <section>
            <h2 className="text-h3">{copy.contact}</h2>
            <p className="mt-2 text-sm">{copy.phone} {venue.phone}</p>
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
