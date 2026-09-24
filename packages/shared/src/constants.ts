export const WEST_BANK_CITIES = [
  "Ramallah",
  "Al-Bireh",
  "Nablus",
  "Hebron",
  "Bethlehem",
  "Jenin",
  "Tulkarm",
  "Qalqilya",
  "Jericho",
  "Salfit",
  "Tubas",
  "Beit Jala",
  "Beit Sahour",
  "Birzeit",
  "Yatta",
  "Dura",
  "Halhul",
  "Qabatiya",
  "Abu Dis",
  "Al-Eizariya",
] as const;

export const VENUE_TIMEZONE = "Asia/Hebron";
export const DEFAULT_CURRENCY = "JOD";

export const PLATFORM_ROLES = ["USER", "PLATFORM_ADMIN"] as const;
export const ACCOUNT_KINDS = ["OWNER", "CUSTOMER"] as const;
export const VENUE_MEMBER_ROLES = ["OWNER", "MANAGER", "STAFF"] as const;
export const BOOKING_SOURCES = [
  "MANUAL",
  "CUSTOMER",
  "ADMIN",
  "WHATSAPP",
  "PHONE",
  "WALK_IN",
] as const;
export const OWNER_BOOKING_SOURCES = [
  "MANUAL",
  "WHATSAPP",
  "PHONE",
  "WALK_IN",
  "CUSTOMER",
] as const;
export const RECURRING_SERIES_STATUSES = ["ACTIVE", "CANCELLED"] as const;
export const BOOKING_STATUSES = [
  "CONFIRMED",
  "PENDING",
  "CANCELLED",
  "COMPLETED",
] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PAID", "PARTIAL"] as const;
export const EXCEPTION_TYPES = ["CLOSED", "SPECIAL_HOURS", "BLOCKED"] as const;
export const NOTIFICATION_EVENTS = [
  "BOOKING_CREATED",
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "BOOKING_REMINDER",
] as const;
export const NOTIFICATION_CHANNELS = [
  "WHATSAPP",
  "SMS",
  "EMAIL",
  "IN_APP",
] as const;
export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "OTHER"] as const;

export const BOOKING_DURATIONS = [60, 90] as const;

export const COURT_SIZES = ["FIVE_V_FIVE", "SEVEN_V_SEVEN", "ELEVEN_V_ELEVEN"] as const;
export const COURT_SIZE_SLUGS = ["5v5", "7v7", "11v11"] as const;
export const COURT_SURFACES = ["NATURAL_GRASS", "ARTIFICIAL_GRASS"] as const;
export const COURT_SETTINGS = ["INDOOR", "OUTDOOR"] as const;

export const COURT_SIZE_TO_SLUG = {
  FIVE_V_FIVE: "5v5",
  SEVEN_V_SEVEN: "7v7",
  ELEVEN_V_ELEVEN: "11v11",
} as const;

export const COURT_SLUG_TO_SIZE = {
  "5v5": "FIVE_V_FIVE",
  "7v7": "SEVEN_V_SEVEN",
  "11v11": "ELEVEN_V_ELEVEN",
} as const;

/** Friday and Saturday in West Bank. */
export const WEEKEND_DAYS = [5, 6] as const;

export const PRICING_RULE_NAMES = {
  REGULAR: "Regular",
  PEAK: "Peak",
  WEEKEND: "Weekend",
} as const;

export const SPEC_AMENITY_SLUGS = ["indoor", "outdoor", "lights"] as const;

export const ACTIVE_BOOKING_STATUSES = [
  "CONFIRMED",
  "PENDING",
  "COMPLETED",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type AccountKind = (typeof ACCOUNT_KINDS)[number];
export type VenueMemberRole = (typeof VENUE_MEMBER_ROLES)[number];
export type BookingSource = (typeof BOOKING_SOURCES)[number];
export type RecurringSeriesStatus = (typeof RECURRING_SERIES_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ExceptionType = (typeof EXCEPTION_TYPES)[number];
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type BookingDuration = (typeof BOOKING_DURATIONS)[number];
export type CourtSize = (typeof COURT_SIZES)[number];
export type CourtSizeSlug = (typeof COURT_SIZE_SLUGS)[number];
export type CourtSurface = (typeof COURT_SURFACES)[number];
export type CourtSetting = (typeof COURT_SETTINGS)[number];
