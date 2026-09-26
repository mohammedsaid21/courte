"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  COURT_SETTING_LABELS,
  COURT_SURFACE_LABELS,
  PRICING_RULE_NAMES,
  durationLabel,
  isCourtSetting,
  isCourtSurface,
} from "@courte/shared";
import {
  ChevronLeft,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { BookingPanel } from "@/components/booking-panel";
import { VenuePlaceholder } from "@/components/court-field";
import { VenueMap } from "@/components/venue-map";
import type { PublicResource, PublicVenue } from "@/lib/api";
import { cancellationCopy, cn, formatMoney, mapsUrl, venueCoverUrl, weekdayLabel } from "@/lib/utils";
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

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `970${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

function hoursSummary(resource: PublicResource | undefined, locale: "ar" | "en") {
  if (!resource) return null;
  const open = resource.hours.filter((hour) => !hour.isClosed);
  if (open.length === 0) return locale === "ar" ? "مغلق" : "Closed";
  const first = open[0];
  const same = open.every((hour) => hour.opensAt === first.opensAt && hour.closesAt === first.closesAt);
  if (same && open.length === 7) {
    return locale === "ar" ? `يومياً ${first.opensAt}–${first.closesAt}` : `Daily ${first.opensAt}–${first.closesAt}`;
  }
  if (same) {
    return locale === "ar" ? `${first.opensAt}–${first.closesAt}` : `${first.opensAt}–${first.closesAt}`;
  }
  return null;
}

export function VenueProfile({ venue }: { venue: PublicVenue }) {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const cover = venueCoverUrl(venue);
  const photos =
    venue.photos.length > 0 ? venue.photos : cover ? [{ url: cover }] : [];
  const name = localizedText(venue.name, venue.nameEn, locale);
  const description = localizedText(venue.description, venue.descriptionEn, locale);
  const address = localizedText(venue.address, venue.addressEn, locale);
  const onlineBooking = venue.acceptsOnlineBooking ?? true;
  const primary = venue.resources[0];
  const hours = hoursSummary(primary, locale);
  const [bookVisible, setBookVisible] = useState(false);

  useEffect(() => {
    const panel = document.getElementById("book");
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) => setBookVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const copy = useMemo(
    () =>
      locale === "ar"
        ? {
            back: "كل الملاعب",
            location: "الموقع",
            openMaps: "افتح في الخرائط",
            amenities: "المرافق",
            courts: "الملاعب",
            noCourts: "هذا المكان لم ينشر ملاعب قابلة للحجز بعد.",
            closed: "مغلق",
            hours: "ساعات العمل",
            cancellation: "سياسة الإلغاء",
            contact: "تواصل مع الملعب",
            phone: "اتصال",
            whatsapp: "واتساب",
            lights: "إنارة ليلية",
            from: "من",
            book: "احجز الآن",
            share: "مشاركة",
            photos: "صور",
          }
        : {
            back: "All venues",
            location: "Location",
            openMaps: "Open in maps",
            amenities: "Amenities",
            courts: "Courts",
            noCourts: "This venue has not published bookable courts yet.",
            closed: "Closed",
            hours: "Hours",
            cancellation: "Cancellation",
            contact: "Contact",
            phone: "Call",
            whatsapp: "WhatsApp",
            lights: "Floodlights",
            from: "From",
            book: "Book now",
            share: "Share",
            photos: "photos",
          },
    [locale],
  );

  const facts = [
    sizeLabel(primary?.size ?? null, locale),
    primary && isCourtSurface(primary.surface) ? COURT_SURFACE_LABELS[primary.surface][locale] : null,
    primary && isCourtSetting(primary.setting) ? COURT_SETTING_LABELS[primary.setting][locale] : null,
    primary?.hasLights ? copy.lights : null,
    hours,
  ].filter(Boolean) as string[];

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
  }

  return (
    <article className="pb-28 md:pb-10">
      <div className="bg-pitch-deep">
        <div className="mx-auto max-w-6xl px-4 pt-4 md:px-6 md:pt-6">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm">
            <Link href="/venues" className="inline-flex items-center gap-1 font-bold text-white/80 hover:text-white">
              <ChevronLeft className="rtl:rotate-180" size={16} />
              {copy.back}
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void share()}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/20"
              >
                <Share2 size={14} />
                {copy.share}
              </button>
              <div className="flex rounded-full bg-white/10 p-1 text-xs font-black text-white">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${locale === "ar" ? "bg-gold text-pitch-deep" : "text-white/70"}`}
                  onClick={() => setLocale("ar")}
                >
                  العربية
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 ${locale === "en" ? "bg-gold text-pitch-deep" : "text-white/70"}`}
                  onClick={() => setLocale("en")}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "grid gap-2 pb-4",
              photos.length > 1 ? "md:grid-cols-[1.7fr_1fr]" : "grid-cols-1",
            )}
          >
            <button
              type="button"
              disabled={photos.length === 0}
              onClick={() => photos[0] && setGalleryIndex(0)}
              className="relative aspect-[16/10] max-h-[min(52vh,440px)] overflow-hidden rounded-[16px]"
            >
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0].url}
                  alt={name}
                  className="h-full w-full object-cover object-center"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <VenuePlaceholder name="" className="h-full w-full" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pitch-deep/85 via-pitch-deep/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-start text-white md:p-7">
                <p className="text-sm font-bold text-gold">{cityAr(venue.city)}</p>
                <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight md:text-5xl">{name}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {venue.types.map((type) => (
                    <Badge key={type.id} tone="lime">
                      {catalogName(type, locale)}
                    </Badge>
                  ))}
                </div>
              </div>
              {photos.length > 1 && (
                <span className="absolute end-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
                  {photos.length} {copy.photos}
                </span>
              )}
            </button>
            {photos.length > 1 && (
              <div className="hidden grid-cols-2 gap-2 md:grid">
                {photos.slice(1, 5).map((photo, index) => (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => setGalleryIndex(index + 1)}
                    className="aspect-[4/3] max-h-36 overflow-hidden rounded-[16px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[minmax(0,1fr)_380px] md:px-6">
        <div className="space-y-6">
          <section className="rounded-[16px] border border-border bg-white p-5 shadow-glass">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text-muted">
                  {address}، {cityAr(venue.city)}
                </p>
                {venue.startingPrice != null && (
                  <p className="mt-2 font-display text-2xl font-extrabold">
                    {copy.from} {formatMoney(venue.startingPrice)}
                    <span className="text-sm font-bold text-text-muted"> / {durationLabel(primary?.defaultDurationMinutes ?? 60, locale)}</span>
                  </p>
                )}
              </div>
              {onlineBooking && venue.resources.length > 0 && (
                <a
                  href="#book"
                  className="inline-flex min-h-11 items-center rounded-[12px] bg-pitch px-4 text-sm font-bold text-white md:hidden"
                >
                  {copy.book}
                </a>
              )}
            </div>
            {facts.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {facts.map((item) => (
                  <span key={item} className="rounded-full bg-pitch-light px-3 py-1.5 text-xs font-bold text-pitch">
                    {item}
                  </span>
                ))}
              </div>
            )}
            {description && <p className="mt-4 text-body">{description}</p>}
          </section>

          <section>
            <h2 className="text-h3">{copy.courts}</h2>
            {venue.resources.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">{copy.noCourts}</p>
            ) : (
              <div className="mt-4 space-y-4">
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
                    <div key={resource.id} className="rounded-[16px] border border-border bg-white p-5 shadow-glass">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-xl font-extrabold tracking-tight">
                            {localizedText(resource.name, resource.nameEn, locale)}
                          </h3>
                          {resource.type && (
                            <p className="mt-0.5 text-sm font-medium text-text-muted">{catalogName(resource.type, locale)}</p>
                          )}
                        </div>
                        {resource.startingPrice != null && (
                          <div className="rounded-full bg-gold-soft px-3 py-1 text-sm font-bold text-pitch-dark">
                            {copy.from} {formatMoney(resource.startingPrice)}
                          </div>
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
                      {localizedText(resource.description, resource.descriptionEn, locale) && (
                        <p className="mt-3 text-sm text-text-muted">
                          {localizedText(resource.description, resource.descriptionEn, locale)}
                        </p>
                      )}
                      {shownPricing.length > 0 && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {shownPricing.map((rule) => (
                            <div
                              key={`${rule!.name}-${rule!.startsAt}-${rule!.dayOfWeek}`}
                              className="rounded-[12px] bg-surface-muted px-3 py-3"
                            >
                              <div className="text-xs font-bold text-text-muted">{pricingLabel(rule!.name, locale)}</div>
                              <div className="mt-1 text-lg font-extrabold">{formatMoney(rule!.priceAmount)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4">
                        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-text-muted">
                          <Clock3 size={14} />
                          {copy.hours}
                        </p>
                        <div className="grid gap-1 text-sm">
                          {resource.hours
                            .slice()
                            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                            .map((hour) => (
                              <div key={hour.dayOfWeek} className="flex justify-between rounded-lg px-1 py-1 even:bg-surface-muted">
                                <span>{weekdayLabel(hour.dayOfWeek)}</span>
                                <span className={hour.isClosed ? "text-text-muted" : "font-bold"}>
                                  {hour.isClosed ? copy.closed : `${hour.opensAt}–${hour.closesAt}`}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[16px] border border-border bg-white p-5 shadow-glass">
            <h2 className="text-h3">{copy.location}</h2>
            <p className="mt-2 text-body">
              {address}، {cityAr(venue.city)}
            </p>
            {venue.latitude != null && venue.longitude != null && (
              <div className="mt-4 overflow-hidden rounded-[12px]">
                <VenueMap latitude={venue.latitude} longitude={venue.longitude} title={name} />
              </div>
            )}
            <a
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-pitch"
              href={mapsUrl(venue)}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={16} />
              {copy.openMaps}
            </a>
          </section>

          {venue.amenities.length > 0 && (
            <section className="rounded-[16px] border border-border bg-white p-5 shadow-glass">
              <h2 className="text-h3">{copy.amenities}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {venue.amenities.map((item) => (
                  <span key={item.id} className="rounded-full bg-pitch-light px-3 py-1.5 text-sm font-bold text-pitch">
                    {catalogName(item, locale)}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[16px] border border-border bg-white p-5 shadow-glass">
              <h2 className="text-h3">{copy.cancellation}</h2>
              <p className="mt-2 text-sm text-text-muted">{cancellationCopy(venue.cancellationHours, venue.cancellationPolicy)}</p>
            </div>
            <div className="rounded-[16px] border border-border bg-white p-5 shadow-glass">
              <h2 className="text-h3">{copy.contact}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={telHref(venue.phone)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-pitch px-4 text-sm font-bold text-white"
                >
                  <Phone size={16} />
                  {copy.phone}
                </a>
                {venue.whatsapp && (
                  <a
                    href={whatsappHref(venue.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-[#25D366] px-4 text-sm font-bold text-white"
                  >
                    <MessageCircle size={16} />
                    {copy.whatsapp}
                  </a>
                )}
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                <MapPin size={14} />
                {venue.phone}
              </p>
            </div>
          </section>
        </div>

        <div id="book" className="md:sticky md:top-24 md:self-start">
          <BookingPanel venue={venue} />
        </div>
      </div>

      {onlineBooking && venue.startingPrice != null && !bookVisible && (
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-white/70 bg-white/90 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-text-muted">{copy.from}</div>
              <div className="font-display text-lg font-extrabold">{formatMoney(venue.startingPrice)}</div>
            </div>
            <a
              href="#book"
              className="inline-flex min-h-12 items-center rounded-[12px] bg-pitch px-5 text-sm font-bold text-white"
            >
              {copy.book}
            </a>
          </div>
        </div>
      )}

      {galleryIndex != null && photos[galleryIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-deep/92 p-4" onClick={() => setGalleryIndex(null)}>
          <button
            type="button"
            className="absolute end-4 top-4 rounded-full bg-white/15 p-2 text-white"
            onClick={() => setGalleryIndex(null)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[galleryIndex].url}
            alt=""
            className="max-h-[88vh] max-w-full rounded-[16px] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}
