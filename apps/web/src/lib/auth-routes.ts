export const VENUE_DISCOVERY_PATH = "/venues";

export function loginWithNext(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

export function signupWithNext(next: string) {
  return `/signup?next=${encodeURIComponent(next)}`;
}

export function exploreVenuesHref(isAuthenticated: boolean) {
  return isAuthenticated ? VENUE_DISCOVERY_PATH : loginWithNext(VENUE_DISCOVERY_PATH);
}
