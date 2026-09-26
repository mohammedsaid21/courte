import { createClient } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function extractErrorMessage(details: unknown, status: number) {
  if (typeof details === "string" && details.trim()) return details;
  if (details && typeof details === "object" && "message" in details) {
    const message = (details as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (message && typeof message === "object" && "message" in message) {
      const nested = (message as { message: unknown }).message;
      if (typeof nested === "string") return nested;
    }
  }
  return `Request failed (${status})`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function token() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function publicApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiError(extractErrorMessage(details, response.status), response.status, details);
  }
  return response.json() as Promise<T>;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await token();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    const message = extractErrorMessage(details, response.status);
    throw new ApiError(message, response.status, details);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export type BookingFilters = {
  from?: string;
  to?: string;
  resourceId?: string;
  status?: string;
  paymentStatus?: string;
  source?: string;
  customerId?: string;
  q?: string;
};

export const ownerApi = {
  me: () => api<Me>("/auth/me"),
  updateMe: (body: unknown) => api<Me>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
  venueTypes: () => api<CatalogItem[]>("/venue-types"),
  amenities: () => api<CatalogItem[]>("/amenities"),
  venues: () => api<Venue[]>("/venues"),
  venue: (id: string) => api<Venue>(`/venues/${id}`),
  publicVenue: (slug: string) => publicApi<PublicVenue>(`/venues/public/${encodeURIComponent(slug)}`),
  onboard: (body: unknown) => api<Venue>("/venues/onboarding", { method: "POST", body: JSON.stringify(body) }),
  updateVenue: (id: string, body: unknown) =>
    api<Venue>(`/venues/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  upload: (venueId: string, contentType: string) =>
    api<{ signedUrl: string; publicUrl: string }>(`/venues/${venueId}/uploads`, {
      method: "POST",
      body: JSON.stringify({ contentType }),
    }),
  resources: (venueId: string) => api<Resource[]>(`/venues/${venueId}/resources`),
  createResource: (venueId: string, body: unknown) =>
    api<Resource>(`/venues/${venueId}/resources`, { method: "POST", body: JSON.stringify(body) }),
  updateResource: (id: string, body: unknown) =>
    api<Resource>(`/resources/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  replaceHours: (resourceId: string, hours: unknown) =>
    api(`/resources/${resourceId}/hours`, { method: "PUT", body: JSON.stringify({ hours }) }),
  exceptions: (resourceId: string) => api<AvailabilityException[]>(`/resources/${resourceId}/exceptions`),
  createException: (resourceId: string, body: unknown) =>
    api(`/resources/${resourceId}/exceptions`, { method: "POST", body: JSON.stringify(body) }),
  deleteException: (id: string) => api(`/exceptions/${id}`, { method: "DELETE" }),
  pricing: (resourceId: string) => api<PricingRule[]>(`/resources/${resourceId}/pricing`),
  createPricing: (resourceId: string, body: unknown) =>
    api(`/resources/${resourceId}/pricing`, { method: "POST", body: JSON.stringify(body) }),
  replacePricing: (resourceId: string, body: unknown) =>
    api<PricingRule[]>(`/resources/${resourceId}/pricing`, { method: "PUT", body: JSON.stringify(body) }),
  updatePricing: (id: string, body: unknown) =>
    api(`/pricing/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePricing: (id: string) => api(`/pricing/${id}`, { method: "DELETE" }),
  calendar: (venueId: string, from: string, to: string, resourceId?: string) => {
    const params = new URLSearchParams({ from, to });
    if (resourceId) params.set("resourceId", resourceId);
    return api<CalendarResponse>(`/venues/${venueId}/calendar?${params}`);
  },
  quote: (resourceId: string, startsAt: string, endsAt: string) =>
    api<Quote>(`/availability/quote?resourceId=${resourceId}&startsAt=${encodeURIComponent(startsAt)}&endsAt=${encodeURIComponent(endsAt)}`),
  createBooking: (body: unknown) => api<Booking>("/bookings", { method: "POST", body: JSON.stringify(body) }),
  bookings: (venueId: string, filters: BookingFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const q = params.toString();
    return api<Booking[]>(`/venues/${venueId}/bookings${q ? `?${q}` : ""}`);
  },
  booking: (id: string) => api<Booking>(`/bookings/${id}`),
  updateBooking: (id: string, body: unknown) =>
    api<Booking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  addPayment: (id: string, body: unknown) =>
    api<Booking>(`/bookings/${id}/payments`, { method: "POST", body: JSON.stringify(body) }),
  markPaid: (id: string) => api<Booking>(`/bookings/${id}/mark-paid`, { method: "POST", body: "{}" }),
  customers: (venueId: string, q?: string, filter?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    const query = params.toString();
    return api<CustomerSummary[]>(`/venues/${venueId}/customers${query ? `?${query}` : ""}`);
  },
  lookupCustomer: (venueId: string, phone: string) =>
    api<CustomerSummary | null>(`/venues/${venueId}/customers/lookup?phone=${encodeURIComponent(phone)}`),
  customer: (id: string) => api<CustomerDetail>(`/customers/${id}`),
  createCustomer: (venueId: string, body: unknown) =>
    api<CustomerSummary>(`/venues/${venueId}/customers`, { method: "POST", body: JSON.stringify(body) }),
  updateCustomer: (id: string, body: unknown) =>
    api<CustomerSummary>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  dashboard: (venueId: string, date: string) =>
    api<DashboardData>(`/venues/${venueId}/dashboard?date=${date}`),
  revenue: (venueId: string, from: string, to: string) =>
    api<RevenueData>(`/venues/${venueId}/revenue?from=${from}&to=${to}`),
  recurring: (venueId: string) => api<RecurringSeriesSummary[]>(`/venues/${venueId}/recurring`),
  previewRecurring: (body: unknown) =>
    api<RecurringPlan>("/recurring/preview", { method: "POST", body: JSON.stringify(body) }),
  createRecurring: (body: unknown) =>
    api<RecurringSeriesDetail>("/recurring", { method: "POST", body: JSON.stringify(body) }),
  recurringSeries: (id: string) => api<RecurringSeriesDetail>(`/recurring/${id}`),
  cancelRecurring: (id: string) =>
    api<RecurringSeriesDetail>(`/recurring/${id}/cancel`, { method: "POST", body: "{}" }),
};

export type CatalogItem = { id: string; slug: string; name: string; nameAr?: string | null };
export type Me = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  accountKind?: "OWNER" | "CUSTOMER";
  venues: { id: string; name: string; slug: string; city: string; isActive: boolean; role: string }[];
};
export type Venue = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  phone: string;
  whatsapp: string | null;
  address: string;
  addressEn: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  isActive: boolean;
  acceptsOnlineBooking: boolean;
  timezone: string;
  defaultDurationMinutes: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationHours: number;
  cancellationPolicy: string | null;
  role?: string;
  types: CatalogItem[];
  amenities: CatalogItem[];
  photos: { id: string; url: string }[];
  resources: Resource[];
};
export type Resource = {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  size: "FIVE_V_FIVE" | "SEVEN_V_SEVEN" | "ELEVEN_V_ELEVEN" | null;
  surface: "NATURAL_GRASS" | "ARTIFICIAL_GRASS" | null;
  setting: "INDOOR" | "OUTDOOR" | null;
  hasLights: boolean;
  isActive: boolean;
  defaultDurationMinutes: number;
  slotIntervalMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  venueTypeId?: string | null;
  venueType?: CatalogItem | null;
  operatingHours?: {
    dayOfWeek: number;
    opensAt: string;
    closesAt: string;
    isClosed: boolean;
  }[];
  pricingRules?: PricingRule[];
};
export type PricingRule = {
  id: string;
  name: string;
  dayOfWeek: number | null;
  startsAt: string;
  endsAt: string;
  priceAmount: number;
  isDefault: boolean;
};
export type AvailabilityException = {
  id: string;
  type: "CLOSED" | "SPECIAL_HOURS" | "BLOCKED";
  startsAt: string;
  endsAt: string;
  opensAt: string | null;
  closesAt: string | null;
  reason: string | null;
};
export type CalendarSlot = {
  start: string;
  end: string;
  status: "available" | "booked" | "blocked" | "outside";
  priceAmount: number | null;
};
export type CalendarBooking = {
  id: string;
  start: string;
  end: string;
  status: string;
  source: string;
  paymentStatus: string;
  recurringSeriesId?: string | null;
  priceAmount: number;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  notes: string | null;
};
export type CalendarDay = {
  date: string;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  openMinutes: number;
  occupiedMinutes: number;
  bookings: CalendarBooking[];
  blocks: { id: string; start: string; end: string; type: string; reason: string | null }[];
  slots: CalendarSlot[];
};
export type CalendarResponse = {
  timezone: string;
  from: string;
  to: string;
  resources: {
    id: string;
    name: string;
    intervalMinutes: number;
    defaultDurationMinutes: number;
    days: CalendarDay[];
  }[];
};
export type Quote = { available: boolean; reason?: string; priceAmount?: number; ruleName?: string };
export type Booking = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
  paymentStatus: string;
  priceAmount: number;
  paidAmount: number;
  durationMinutes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  recurringSeriesId?: string | null;
  customer: { id: string; name: string; phone: string; whatsapp: string | null };
  resource: { id: string; name: string };
  createdBy?: { id: string; fullName: string } | null;
  updatedBy?: { id: string; fullName: string } | null;
  payments?: { id: string; amount: number; method: string; paidAt: string }[];
};
export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  notes: string | null;
  bookingCount: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  totalPaid: number;
  lastBookingAt: string | null;
  upcomingBookingAt: string | null;
};
export type CustomerDetail = CustomerSummary & {
  bookings: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: string;
    source: string;
    paymentStatus: string;
    priceAmount: number;
    paidAmount: number;
    resource: { name: string };
    notes: string | null;
  }[];
};
export type DashboardData = {
  date: string;
  timezone: string;
  today: {
    bookings: number;
    occupiedHours: number;
    availableHours: number;
    occupancyRate: number;
    revenue: number;
    paidAmount: number;
    unpaidAmount: number;
    unpaidCount: number;
    issueCount: number;
  };
  upcoming: BookingBrief[];
  recent: BookingBrief[];
  completed: BookingBrief[];
  unpaid: BookingBrief[];
  issues: { type: string; message: string; bookingId?: string }[];
  todayBookings: BookingBrief[];
  trend: { date: string; revenue: number; bookings: number }[];
};
export type BookingBrief = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  source: string;
  paymentStatus: string;
  priceAmount: number;
  paidAmount?: number;
  customerName: string;
  customerPhone: string;
  resourceName: string;
  resourceId?: string | null;
};
export type RecurringPlan = {
  createCount: number;
  conflictCount: number;
  priceAmount: number;
  resourceName: string;
  customer: { id: string; name: string; phone: string };
  create: { date: string; startsAt: string; endsAt: string }[];
  conflicts: {
    date: string;
    startsAt: string;
    endsAt: string;
    reason: string;
    bookingId?: string;
    customerName?: string;
  }[];
};
export type RecurringSeriesSummary = {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  priceAmount: number;
  startDate: string;
  endDate: string;
  source: string;
  paymentStatus: string;
  notes: string | null;
  status: string;
  bookingCount: number;
  customer: { id: string; name: string; phone: string };
  resource: { id: string; name: string };
};
export type RecurringSeriesDetail = RecurringSeriesSummary & {
  bookings: { id: string; startsAt: string; endsAt: string; status: string; paymentStatus: string }[];
};
export type RevenueData = {
  from: string;
  to: string;
  currency: string;
  totalBookings: number;
  totalRevenue: number;
  paidAmount: number;
  unpaidAmount: number;
  occupiedHours: number;
  bySource: Record<string, { totalBookings: number; totalRevenue: number }>;
  bookings: BookingBrief[];
};
export type PublicVenue = {
  id: string;
  slug: string;
  name: string;
  nameEn?: string | null;
  description: string | null;
  descriptionEn?: string | null;
  phone: string;
  whatsapp: string | null;
  address: string;
  addressEn?: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  cancellationHours?: number;
  cancellationPolicy?: string | null;
  types: CatalogItem[];
  amenities: CatalogItem[];
  photos: { url: string }[];
  resources: {
    id: string;
    name: string;
    nameEn?: string | null;
    size?: string | null;
    surface?: string | null;
    setting?: string | null;
    hasLights?: boolean;
    type: CatalogItem | null;
    hours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[];
    pricing?: { name: string; dayOfWeek: number | null; startsAt: string; endsAt: string; priceAmount: number; isDefault: boolean }[];
  }[];
};
