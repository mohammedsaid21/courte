export type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  nameAr?: string | null;
};

export type Me = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  whatsapp: string | null;
  accountKind: "OWNER" | "CUSTOMER";
  venues: { id: string; name: string; slug: string; city: string; isActive: boolean; role: string }[];
};

export type DiscoverQuery = {
  q?: string;
  city?: string;
  typeId?: string;
  date?: string;
  time?: string;
  minPrice?: number;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: "name" | "distance" | "price";
  page?: number;
  pageSize?: number;
};

export type DiscoverVenue = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  coverImageUrl: string | null;
  types: CatalogItem[];
  startingPrice: number | null;
  currency: string;
  open: boolean;
  hoursLabel: string;
  distanceKm: number | null;
  latitude: number | null;
  longitude: number | null;
  available: boolean;
};

export type DiscoverResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: DiscoverVenue[];
};

export type PublicResource = {
  id: string;
  name: string;
  description: string | null;
  type: CatalogItem | null;
  defaultDurationMinutes: number;
  slotIntervalMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  hours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[];
  pricing: {
    name: string;
    startsAt: string;
    endsAt: string;
    priceAmount: number;
    isDefault: boolean;
  }[];
  startingPrice: number | null;
};

export type PublicVenue = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  phone: string;
  whatsapp: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  timezone: string;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationHours: number;
  cancellationPolicy: string | null;
  startingPrice: number | null;
  types: CatalogItem[];
  amenities: CatalogItem[];
  photos: { url: string }[];
  resources: PublicResource[];
};

export type AvailabilitySlot = {
  start: string;
  end: string;
  priceAmount: number | null;
};

export type AvailabilityResponse = {
  timezone: string;
  date: string;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  reason?: string;
  durationMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  resource: { id: string; name: string };
  slots: AvailabilitySlot[];
};

export type CustomerBooking = {
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
  cancelledAt: string | null;
  canCancel: boolean;
  cancellationDeadline: string;
  cancellationPolicy: string | null;
  cancellationHours: number;
  customer: { id: string; name: string; phone: string; whatsapp: string | null };
  resource: { id: string; name: string };
  venue: {
    id: string;
    name: string;
    slug: string;
    city: string;
    coverImageUrl: string | null;
    cancellationHours: number;
    cancellationPolicy: string | null;
    timezone: string;
  };
};
