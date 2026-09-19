const VENUE_KEY = "courte.venueId";

export function getStoredVenueId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VENUE_KEY);
}

export function setStoredVenueId(id: string) {
  localStorage.setItem(VENUE_KEY, id);
}
