import { api } from "./client";
import type { CustomerBooking } from "./types";

export const bookingService = {
  list: () => api<CustomerBooking[]>("/customer/bookings"),
  get: (id: string) => api<CustomerBooking>(`/customer/bookings/${id}`),
  create: (body: {
    venueId: string;
    resourceId: string;
    startsAt: string;
    endsAt: string;
    notes?: string | null;
  }) => api<CustomerBooking>("/customer/bookings", { method: "POST", body: JSON.stringify(body) }),
  cancel: (id: string) => api<CustomerBooking>(`/customer/bookings/${id}/cancel`, { method: "POST" }),
};
