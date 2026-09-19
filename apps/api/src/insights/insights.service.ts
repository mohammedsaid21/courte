import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { addDays } from "date-fns";
import { AccessService } from "../access/access.service";
import { eachYmd, minutesOpen, occupiedMinutes, summarizeRevenue, windowForDate } from "../booking-engine";
import { endOfZonedDay, startOfZonedDay, ymdInTimeZone } from "../booking-engine/time";
import { money } from "../common/util";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async dashboard(user: User, venueId: string, date: string) {
    const { venue } = await this.access.assertVenueRole(user, venueId);
    const dayStart = startOfZonedDay(date, venue.timezone);
    const dayEnd = endOfZonedDay(date, venue.timezone);
    const upcomingEnd = addDays(dayEnd, 7);
    const trendFrom = ymdInTimeZone(addDays(dayStart, -6), venue.timezone);

    const now = new Date();
    const [todayBookings, upcoming, recent, completed, unpaid, resources, trendBookings] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          venueId,
          startsAt: { gte: dayStart, lt: dayEnd },
        },
        include: { customer: true, resource: { select: { id: true, name: true } } },
        orderBy: { startsAt: "asc" },
      }),
      this.prisma.booking.findMany({
        where: {
          venueId,
          status: { in: ["CONFIRMED", "PENDING"] },
          startsAt: { gte: now, lt: upcomingEnd },
        },
        include: { customer: true, resource: { select: { id: true, name: true } } },
        orderBy: { startsAt: "asc" },
        take: 12,
      }),
      this.prisma.booking.findMany({
        where: { venueId },
        include: { customer: true, resource: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      this.prisma.booking.findMany({
        where: {
          venueId,
          status: { not: "CANCELLED" },
          endsAt: { lte: now, gte: addDays(dayStart, -2) },
        },
        include: { customer: true, resource: { select: { id: true, name: true } } },
        orderBy: { endsAt: "desc" },
        take: 8,
      }),
      this.prisma.booking.findMany({
        where: {
          venueId,
          status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
          paymentStatus: { in: ["UNPAID", "PARTIAL"] },
          startsAt: { gte: dayStart, lt: upcomingEnd },
        },
        include: { customer: true, resource: { select: { id: true, name: true } } },
        orderBy: { startsAt: "asc" },
        take: 20,
      }),
      this.prisma.venueResource.findMany({
        where: { venueId, isActive: true },
        include: { operatingHours: true, exceptions: true },
      }),
      this.prisma.booking.findMany({
        where: {
          venueId,
          status: { not: "CANCELLED" },
          startsAt: { gte: startOfZonedDay(trendFrom, venue.timezone), lt: dayEnd },
        },
      }),
    ]);

    const todayActive = todayBookings.filter((booking) => booking.status !== "CANCELLED");
    const revenue = summarizeRevenue(
      todayActive.map((booking) => ({
        status: booking.status,
        priceAmount: money(booking.priceAmount),
        paidAmount: money(booking.paidAmount),
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
      })),
    );

    let availableMinutes = 0;
    let occupied = 0;
    for (const resource of resources) {
      const window = windowForDate({
        date,
        timeZone: venue.timezone,
        hours: resource.operatingHours,
        exceptions: resource.exceptions,
      });
      availableMinutes += minutesOpen(window);
      occupied += occupiedMinutes(
        todayActive
          .filter((booking) => booking.resourceId === resource.id)
          .map((booking) => ({ start: booking.startsAt, end: booking.endsAt })),
        window,
      );
    }

    const trend = eachYmd(trendFrom, date).map((day) => {
      const start = startOfZonedDay(day, venue.timezone);
      const end = endOfZonedDay(day, venue.timezone);
      const items = trendBookings.filter(
        (booking) => booking.startsAt >= start && booking.startsAt < end,
      );
      return {
        date: day,
        revenue: summarizeRevenue(
          items.map((booking) => ({
            status: booking.status,
            priceAmount: money(booking.priceAmount),
            paidAmount: money(booking.paidAmount),
            startsAt: booking.startsAt,
            endsAt: booking.endsAt,
          })),
        ).totalRevenue,
        bookings: items.length,
      };
    });

    const issues: {
      type: "pending" | "overlap" | "unpaid_started" | "closed_with_bookings";
      message: string;
      bookingId?: string;
    }[] = [];

    for (const booking of todayActive) {
      if (booking.status === "PENDING") {
        issues.push({
          type: "pending",
          message: `${booking.customer.name} on ${booking.resource.name} is still pending.`,
          bookingId: booking.id,
        });
      }
      if (
        (booking.paymentStatus === "UNPAID" || booking.paymentStatus === "PARTIAL") &&
        booking.startsAt <= now
      ) {
        issues.push({
          type: "unpaid_started",
          message: `${booking.customer.name} started without full payment (${booking.paymentStatus.toLowerCase()}).`,
          bookingId: booking.id,
        });
      }
    }

    const byResource = new Map<string, typeof todayActive>();
    for (const booking of todayActive) {
      const list = byResource.get(booking.resourceId) ?? [];
      list.push(booking);
      byResource.set(booking.resourceId, list);
    }
    for (const [resourceId, list] of byResource) {
      const sorted = [...list].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1];
        const current = sorted[index];
        if (previous.endsAt > current.startsAt) {
          issues.push({
            type: "overlap",
            message: `${previous.customer.name} and ${current.customer.name} overlap on ${current.resource.name}.`,
            bookingId: current.id,
          });
        }
      }
      const resource = resources.find((item) => item.id === resourceId);
      if (!resource) continue;
      const window = windowForDate({
        date,
        timeZone: venue.timezone,
        hours: resource.operatingHours,
        exceptions: resource.exceptions,
      });
      if (window.closed && list.length > 0) {
        issues.push({
          type: "closed_with_bookings",
          message: `${resource.name} is closed today but still has ${list.length} booking(s).`,
          bookingId: list[0].id,
        });
      }
    }

    return {
      date,
      timezone: venue.timezone,
      today: {
        bookings: todayActive.length,
        occupiedHours: Math.round((occupied / 60) * 100) / 100,
        availableHours: Math.round((availableMinutes / 60) * 100) / 100,
        occupancyRate:
          availableMinutes === 0 ? 0 : Math.round((occupied / availableMinutes) * 100),
        revenue: revenue.totalRevenue,
        paidAmount: revenue.paidAmount,
        unpaidAmount: revenue.unpaidAmount,
        unpaidCount: unpaid.length,
        issueCount: issues.length,
      },
      upcoming: upcoming.map((booking) => this.brief(booking)),
      recent: recent.map((booking) => this.brief(booking)),
      completed: completed.map((booking) => this.brief(booking)),
      unpaid: unpaid.map((booking) => this.brief(booking)),
      issues,
      todayBookings: todayActive.map((booking) => this.brief(booking)),
      trend,
    };
  }

  async revenue(user: User, venueId: string, from: string, to: string) {
    const { venue } = await this.access.assertVenueRole(user, venueId);
    const bookings = await this.prisma.booking.findMany({
      where: {
        venueId,
        startsAt: {
          gte: startOfZonedDay(from, venue.timezone),
          lt: endOfZonedDay(to, venue.timezone),
        },
      },
      include: { resource: { select: { name: true } }, customer: true },
      orderBy: { startsAt: "asc" },
    });
    const summary = summarizeRevenue(
      bookings.map((booking) => ({
        status: booking.status,
        priceAmount: money(booking.priceAmount),
        paidAmount: money(booking.paidAmount),
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
      })),
    );
    return {
      from,
      to,
      currency: "JOD",
      ...summary,
      bySource: Object.fromEntries(
        [...new Set(bookings.map((booking) => booking.source))].map((source) => [
          source,
          this.sourceSummary(bookings, source),
        ]),
      ),
      bookings: bookings.map((booking) => this.brief(booking)),
    };
  }

  private sourceSummary(
    bookings: {
      source: string;
      status: string;
      priceAmount: { toString(): string };
      paidAmount: { toString(): string };
      startsAt: Date;
      endsAt: Date;
    }[],
    source: string,
  ) {
    return summarizeRevenue(
      bookings
        .filter((booking) => booking.source === source)
        .map((booking) => ({
          status: booking.status,
          priceAmount: money(booking.priceAmount),
          paidAmount: money(booking.paidAmount),
          startsAt: booking.startsAt,
          endsAt: booking.endsAt,
        })),
    );
  }

  private brief(booking: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    source: string;
    paymentStatus: string;
    priceAmount: { toString(): string };
    paidAmount: { toString(): string };
    notes: string | null;
    customer: { name: string; phone: string };
    resource: { id?: string; name: string };
    resourceId?: string;
  }) {
    return {
      id: booking.id,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
      source: booking.source,
      paymentStatus: booking.paymentStatus,
      priceAmount: money(booking.priceAmount),
      paidAmount: money(booking.paidAmount),
      notes: booking.notes,
      customerName: booking.customer.name,
      customerPhone: booking.customer.phone,
      resourceName: booking.resource.name,
      resourceId: booking.resource.id ?? booking.resourceId ?? null,
    };
  }
}
