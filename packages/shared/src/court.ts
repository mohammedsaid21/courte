import {
  BOOKING_DURATIONS,
  COURT_SETTINGS,
  COURT_SIZE_TO_SLUG,
  COURT_SIZES,
  COURT_SURFACES,
  PRICING_RULE_NAMES,
  WEEKEND_DAYS,
  type CourtSetting,
  type CourtSize,
  type CourtSizeSlug,
  type CourtSurface,
} from "./constants";

type TierRule = {
  name: string;
  dayOfWeek: number | null;
  startsAt: string;
  endsAt: string;
  priceAmount: number;
  isDefault: boolean;
  sortOrder: number;
};

export const COURT_SIZE_LABELS: Record<
  CourtSize,
  { ar: string; en: string; slug: CourtSizeSlug }
> = {
  FIVE_V_FIVE: { ar: "5 ضد 5", en: "5 vs 5", slug: "5v5" },
  SEVEN_V_SEVEN: { ar: "7 ضد 7", en: "7 vs 7", slug: "7v7" },
  ELEVEN_V_ELEVEN: { ar: "11 ضد 11", en: "11 vs 11", slug: "11v11" },
};

export const COURT_SURFACE_LABELS: Record<CourtSurface, { ar: string; en: string }> = {
  NATURAL_GRASS: { ar: "عشب طبيعي", en: "Natural grass" },
  ARTIFICIAL_GRASS: { ar: "عشب صناعي", en: "Artificial grass" },
};

export const COURT_SETTING_LABELS: Record<CourtSetting, { ar: string; en: string }> = {
  INDOOR: { ar: "ملعب داخلي", en: "Indoor" },
  OUTDOOR: { ar: "ملعب خارجي", en: "Outdoor" },
};

export function isCourtSize(value: string | null | undefined): value is CourtSize {
  return !!value && (COURT_SIZES as readonly string[]).includes(value);
}

export function isCourtSurface(value: string | null | undefined): value is CourtSurface {
  return !!value && (COURT_SURFACES as readonly string[]).includes(value);
}

export function isCourtSetting(value: string | null | undefined): value is CourtSetting {
  return !!value && (COURT_SETTINGS as readonly string[]).includes(value);
}

export function courtSizeSlug(size: CourtSize | null | undefined): CourtSizeSlug | null {
  if (!size) return null;
  return COURT_SIZE_TO_SLUG[size];
}

export function durationPayload(minutes: number) {
  const duration = (BOOKING_DURATIONS as readonly number[]).includes(minutes) ? minutes : 60;
  return {
    defaultDurationMinutes: duration,
    slotIntervalMinutes: duration,
    minDurationMinutes: duration,
    maxDurationMinutes: duration,
  };
}

export function durationLabel(minutes: number, locale: "ar" | "en" = "ar") {
  if (minutes === 90) return locale === "ar" ? "ساعة ونصف" : "90 minutes";
  if (minutes === 60) return locale === "ar" ? "ساعة" : "1 hour";
  if (minutes < 60) return locale === "ar" ? `${minutes} د` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (locale === "en") {
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }
  return rest ? `${hours} س ${rest} د` : `${hours} س`;
}

export function buildTierPricingRules(input: {
  regularPrice: number;
  peakPrice?: number | null;
  peakStartsAt?: string;
  weekendPrice?: number | null;
}): TierRule[] {
  const peakStartsAt = input.peakStartsAt ?? "16:00";
  const rules: TierRule[] = [
    {
      name: PRICING_RULE_NAMES.REGULAR,
      dayOfWeek: null,
      startsAt: "00:00",
      endsAt: "00:00",
      priceAmount: input.regularPrice,
      isDefault: true,
      sortOrder: 2,
    },
  ];
  if (input.peakPrice != null) {
    rules.push({
      name: PRICING_RULE_NAMES.PEAK,
      dayOfWeek: null,
      startsAt: peakStartsAt,
      endsAt: "00:00",
      priceAmount: input.peakPrice,
      isDefault: false,
      sortOrder: 1,
    });
  }
  if (input.weekendPrice != null) {
    WEEKEND_DAYS.forEach((dayOfWeek, index) => {
      rules.push({
        name: PRICING_RULE_NAMES.WEEKEND,
        dayOfWeek,
        startsAt: "00:00",
        endsAt: "00:00",
        priceAmount: input.weekendPrice!,
        isDefault: false,
        sortOrder: index,
      });
    });
  }
  return rules;
}

export function osmEmbedUrl(latitude: number, longitude: number, delta = 0.012) {
  const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export const RAMALLAH_CENTER = { latitude: 31.9038, longitude: 35.2034 };
