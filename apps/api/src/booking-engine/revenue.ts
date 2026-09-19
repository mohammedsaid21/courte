import { durationMinutes } from "./time";
import { derivePaymentStatus } from "./pricing";

export type RevenueBooking = {
  status: string;
  priceAmount: number;
  paidAmount: number;
  startsAt: Date;
  endsAt: Date;
};

export type RevenueSummary = {
  totalBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  paidAmount: number;
  unpaidAmount: number;
  occupiedHours: number;
};

export function summarizeRevenue(bookings: RevenueBooking[]): RevenueSummary {
  const active = bookings.filter((booking) => booking.status !== "CANCELLED");
  const cancelled = bookings.filter((booking) => booking.status === "CANCELLED");
  const totalRevenue = roundMoney(
    active.reduce((sum, booking) => sum + booking.priceAmount, 0),
  );
  const paidAmount = roundMoney(
    active.reduce((sum, booking) => sum + Math.min(booking.paidAmount, booking.priceAmount), 0),
  );
  const occupiedMinutes = active.reduce(
    (sum, booking) => sum + durationMinutes(booking.startsAt, booking.endsAt),
    0,
  );

  return {
    totalBookings: active.length,
    cancelledBookings: cancelled.length,
    totalRevenue,
    paidAmount,
    unpaidAmount: roundMoney(totalRevenue - paidAmount),
    occupiedHours: roundHours(occupiedMinutes / 60),
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

export function paymentStatusFor(priceAmount: number, paidAmount: number) {
  return derivePaymentStatus(priceAmount, paidAmount);
}
