import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@prisma/client";
import { AccessService } from "../access/access.service";
import {
  eachYmd,
  evaluateAdvanceWindow,
  generateSlots,
  minutesOpen,
  occupiedMinutes,
  windowForDate,
} from "../booking-engine";
import { money } from "../common/util";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async get(user: User, venueId: string, from: string, to: string, resourceId?: string) {
    const { venue } = await this.access.assertVenueRole(user, venueId);
    const rangeStart = new Date(`${from}T00:00:00.000Z`);
    const rangeEnd = new Date(`${to}T23:59:59.999Z`);

    const [resources, bookings] = await Promise.all([
      this.prisma.venueResource.findMany({
        where: { venueId, id: resourceId, isActive: true },
        include: { operatingHours: true, exceptions: true, pricingRules: true },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.booking.findMany({
        where: {
          venueId,
          resourceId: resourceId,
          status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
          startsAt: { lt: rangeEnd },
          endsAt: { gt: rangeStart },
        },
        include: { customer: true },
        orderBy: { startsAt: "asc" },
      }),
    ]);

    return {
      timezone: venue.timezone,
      from,
      to,
      resources: resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        intervalMinutes: resource.slotIntervalMinutes,
        defaultDurationMinutes: resource.defaultDurationMinutes,
        days: eachYmd(from, to).map((date) => {
          const window = windowForDate({
            date,
            timeZone: venue.timezone,
            hours: resource.operatingHours,
            exceptions: resource.exceptions,
          });
          const dayBookings = bookings.filter(
            (booking) =>
              booking.resourceId === resource.id &&
              (!window.start || !window.end
                ? true
                : booking.startsAt < (window.end ?? rangeEnd) &&
                  booking.endsAt > (window.start ?? rangeStart)),
          );
          const blocks = resource.exceptions.filter(
            (item) =>
              (item.type === "BLOCKED" || item.type === "CLOSED") &&
              (!window.start || !window.end
                ? true
                : item.startsAt < (window.end ?? rangeEnd) && item.endsAt > (window.start ?? rangeStart)),
          );
          const slots = generateSlots({
            timeZone: venue.timezone,
            window,
            intervalMinutes: resource.slotIntervalMinutes,
            durationMinutes: resource.defaultDurationMinutes,
            bookings: dayBookings.map((booking) => ({
              start: booking.startsAt,
              end: booking.endsAt,
            })),
            blocks: blocks.map((item) => ({ start: item.startsAt, end: item.endsAt })),
            rules: resource.pricingRules.map((rule) => ({
              name: rule.name,
              dayOfWeek: rule.dayOfWeek,
              startsAt: rule.startsAt,
              endsAt: rule.endsAt,
              priceAmount: money(rule.priceAmount),
              isDefault: rule.isDefault,
              sortOrder: rule.sortOrder,
            })),
          });
          const occupied = occupiedMinutes(
            dayBookings.map((booking) => ({ start: booking.startsAt, end: booking.endsAt })),
            window,
          );
          return {
            date,
            closed: window.closed,
            opensAt: window.opensAt,
            closesAt: window.closesAt,
            openMinutes: minutesOpen(window),
            occupiedMinutes: occupied,
            bookings: dayBookings.map((booking) => ({
              id: booking.id,
              start: booking.startsAt.toISOString(),
              end: booking.endsAt.toISOString(),
              status: booking.status,
              source: booking.source,
              paymentStatus: booking.paymentStatus,
              recurringSeriesId: booking.recurringSeriesId,
              priceAmount: money(booking.priceAmount),
              durationMinutes: Math.round(
                (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000,
              ),
              customerName: booking.customer.name,
              customerPhone: booking.customer.phone,
              notes: booking.notes,
            })),
            blocks: blocks.map((item) => ({
              id: item.id,
              start: item.startsAt.toISOString(),
              end: item.endsAt.toISOString(),
              type: item.type,
              reason: item.reason,
            })),
            slots: slots.map((slot) => ({
              start: slot.start.toISOString(),
              end: slot.end.toISOString(),
              status: slot.status,
              priceAmount: slot.priceAmount,
            })),
          };
        }),
      })),
    };
  }

  async publicAvailability(venueId: string, resourceId: string, date: string, durationMinutes?: number) {
    const resource = await this.prisma.venueResource.findFirst({
      where: { id: resourceId, venueId, isActive: true },
      include: {
        venue: true,
        operatingHours: true,
        exceptions: true,
        pricingRules: true,
      },
    });
    if (!resource || !resource.venue.isActive) {
      throw new NotFoundException("Resource not found");
    }

    const duration = durationMinutes ?? resource.defaultDurationMinutes;
    const window = windowForDate({
      date,
      timeZone: resource.venue.timezone,
      hours: resource.operatingHours,
      exceptions: resource.exceptions,
    });
    const rangeStart = new Date(`${date}T00:00:00.000Z`);
    const rangeEnd = new Date(`${date}T23:59:59.999Z`);
    const bookings = await this.prisma.booking.findMany({
      where: {
        resourceId: resource.id,
        status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
        startsAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
      },
      select: { startsAt: true, endsAt: true },
    });
    const rules = resource.pricingRules.map((rule) => ({
      name: rule.name,
      dayOfWeek: rule.dayOfWeek,
      startsAt: rule.startsAt,
      endsAt: rule.endsAt,
      priceAmount: money(rule.priceAmount),
      isDefault: rule.isDefault,
      sortOrder: rule.sortOrder,
    }));
    const generated = generateSlots({
      timeZone: resource.venue.timezone,
      window,
      intervalMinutes: resource.slotIntervalMinutes,
      durationMinutes: duration,
      bookings: bookings.map((booking) => ({ start: booking.startsAt, end: booking.endsAt })),
      blocks: resource.exceptions
        .filter((item) => item.type === "BLOCKED" || item.type === "CLOSED")
        .map((item) => ({ start: item.startsAt, end: item.endsAt })),
      rules,
    });
    const now = new Date();
    const slots = generated
      .filter((slot) => slot.status === "available")
      .filter((slot) =>
        evaluateAdvanceWindow({
          start: slot.start,
          now,
          minAdvanceHours: resource.venue.minAdvanceHours,
          maxAdvanceDays: resource.venue.maxAdvanceDays,
        }).available,
      )
      .map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        priceAmount: slot.priceAmount,
      }));

    return {
      timezone: resource.venue.timezone,
      date,
      closed: window.closed,
      opensAt: window.opensAt,
      closesAt: window.closesAt,
      reason: window.reason ?? (window.closed ? "Closed" : undefined),
      durationMinutes: duration,
      minDurationMinutes: resource.minDurationMinutes,
      maxDurationMinutes: resource.maxDurationMinutes,
      resource: { id: resource.id, name: resource.name },
      slots,
    };
  }
}
