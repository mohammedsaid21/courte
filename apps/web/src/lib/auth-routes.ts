export const VENUE_DISCOVERY_PATH = "/venues";

export function loginWithNext(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

export function signupWithNext(next: string) {
  return `/signup?next=${encodeURIComponent(next)}`;
}

/** Listing is public; guests see a preview and sign-in prompt on /venues. */
export function exploreVenuesHref(_isAuthenticated: boolean) {
  return VENUE_DISCOVERY_PATH;
}
