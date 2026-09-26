export type BookingCartItem = {
  resourceId: string;
  resourceName: string;
  start: string;
  end: string;
  date: string;
  priceAmount: number | null;
};

const keyFor = (venueId: string) => `courte.booking-cart.${venueId}`;

export function loadBookingCart(venueId: string): BookingCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(keyFor(venueId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookingCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookingCart(venueId: string, items: BookingCartItem[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(keyFor(venueId), JSON.stringify(items));
}

export function clearBookingCart(venueId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(keyFor(venueId));
}
