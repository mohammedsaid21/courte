import { publicApi } from "./client";
import type { AvailabilityResponse } from "./types";

export const availabilityService = {
  get: (venueId: string, resourceId: string, date: string, durationMinutes?: number) => {
    const params = new URLSearchParams({ date });
    if (durationMinutes) params.set("durationMinutes", String(durationMinutes));
    return publicApi<AvailabilityResponse>(
      `/venues/${venueId}/resources/${resourceId}/availability?${params}`,
    );
  },
};
