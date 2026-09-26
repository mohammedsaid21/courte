import { api } from "./client";
import type { CustomerBooking, RecurringPlan } from "./types";

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
  createBatch: (bookings: {
    venueId: string;
    resourceId: string;
    startsAt: string;
    endsAt: string;
    notes?: string | null;
  }[]) =>
    api<CustomerBooking[]>("/customer/bookings/batch", {
      method: "POST",
      body: JSON.stringify({ bookings }),
    }),
  cancel: (id: string) => api<CustomerBooking>(`/customer/bookings/${id}/cancel`, { method: "POST" }),
  previewRecurring: (body: RecurringBody) =>
    api<RecurringPlan>("/customer/recurring/preview", { method: "POST", body: JSON.stringify(body) }),
  createRecurring: (body: RecurringBody) =>
    api<RecurringPlan & { id: string }>("/customer/recurring", { method: "POST", body: JSON.stringify(body) }),
};

type RecurringBody = {
  venueId: string;
  resourceId: string;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  skipConflicts?: boolean;
};
