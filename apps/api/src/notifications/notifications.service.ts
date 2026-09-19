import { Injectable } from "@nestjs/common";
import { Booking } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueueBookingEvent(input: {
    event: "BOOKING_CREATED" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "BOOKING_REMINDER";
    booking: Booking & { customer?: { name: string; phone: string; whatsapp: string | null } };
    scheduledAt?: Date;
  }) {
    await this.prisma.notification.create({
      data: {
        event: input.event,
        channel: "IN_APP",
        status: "SKIPPED",
        bookingId: input.booking.id,
        scheduledAt: input.scheduledAt ?? new Date(),
        error: "Delivery providers are not configured yet",
        payload: {
          bookingId: input.booking.id,
          venueId: input.booking.venueId,
          resourceId: input.booking.resourceId,
          startsAt: input.booking.startsAt.toISOString(),
          endsAt: input.booking.endsAt.toISOString(),
          customerName: input.booking.customer?.name ?? null,
          customerPhone: input.booking.customer?.phone ?? null,
          customerWhatsapp: input.booking.customer?.whatsapp ?? null,
          delivery: "logged_only",
        },
      },
    });
  }
}
