import { Injectable } from "@nestjs/common";
import { DiscoverQuery } from "@courte/shared";
import { evaluateAdvanceWindow, generateSlots, windowForDate } from "../booking-engine";
import { distanceKm, roundKm } from "../booking-engine/geo";
import { hhmmInTimeZone } from "../booking-engine/time";
import { money } from "../common/util";
import { PrismaService } from "../prisma/prisma.service";

type AvailabilityBooking = {
  venueId?: string;
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
};

@Injectable()
export class DiscoverService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: DiscoverQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.q?.trim();

    const venues = await this.prisma.venue.findMany({
      where: {
        isActive: true,
        city: query.city || undefined,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
                {
                  types: {
                    some: { venueType: { name: { contains: search, mode: "insensitive" } } },
                  },
                },
              ],
            }
          : {}),
        ...(query.typeId
          ? { types: { some: { venueTypeId: query.typeId } } }
          : {}),
      },
      include: {
        types: { include: { venueType: true } },
        photos: { orderBy: { sortOrder: "asc" }, take: 1 },
        resources: {
          where: { isActive: true },
          include: { operatingHours: true, exceptions: true, pricingRules: true },
        },
      },
    });

    const origin =
      query.lat != null && query.lng != null
        ? { latitude: query.lat, longitude: query.lng }
        : null;

    const bookingsByVenue = query.date
      ? await this.loadBookingsByVenue(
          venues.map((venue) => venue.id),
          query.date,
        )
      : new Map<string, AvailabilityBooking[]>();

    const mapped = venues.map((venue) => {
      const latitude = venue.latitude ? Number(venue.latitude) : null;
      const longitude = venue.longitude ? Number(venue.longitude) : null;
      const distance =
        origin && latitude != null && longitude != null
          ? roundKm(distanceKm(origin, { latitude, longitude }))
          : null;
      const prices = venue.resources.flatMap((resource) =>
        resource.pricingRules.map((rule) => money(rule.priceAmount)),
      );
      const startingPrice = prices.length > 0 ? Math.min(...prices) : null;
      const hoursStatus = this.hoursStatus(venue);
      const available =
        query.date || query.time
          ? this.hasAvailability(venue, bookingsByVenue.get(venue.id) ?? [], query.date, query.time)
          : true;

      return {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        city: venue.city,
        address: venue.address,
        coverImageUrl: venue.coverImageUrl ?? venue.photos[0]?.url ?? null,
        types: venue.types.map((item) => item.venueType),
        startingPrice,
        currency: "JOD",
        open: hoursStatus.open,
        hoursLabel: hoursStatus.label,
        distanceKm: distance,
        latitude,
        longitude,
        available,
      };
    });

    let items = mapped.filter((item) => item.available);
    if (query.minPrice != null) {
      items = items.filter((item) => item.startingPrice != null && item.startingPrice >= query.minPrice!);
    }
    if (query.maxPrice != null) {
      items = items.filter((item) => item.startingPrice != null && item.startingPrice <= query.maxPrice!);
    }
    if (origin && query.radiusKm) {
      items = items.filter((item) => item.distanceKm == null || item.distanceKm <= query.radiusKm!);
    }

    const sort = query.sort ?? (origin ? "distance" : "name");
    items.sort((a, b) => {
      if (sort === "price") {
        return (a.startingPrice ?? Number.POSITIVE_INFINITY) - (b.startingPrice ?? Number.POSITIVE_INFINITY);
      }
      if (sort === "distance") {
        return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      }
      return a.name.localeCompare(b.name);
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    return {
      page,
      pageSize,
      total,
      items: items.slice(start, start + pageSize),
    };
  }

  private hoursStatus(venue: {
    timezone: string;
    resources: {
      operatingHours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[];
      exceptions: {
        type: "CLOSED" | "SPECIAL_HOURS" | "BLOCKED";
        startsAt: Date;
        endsAt: Date;
        opensAt: string | null;
        closesAt: string | null;
      }[];
    }[];
  }) {
    const now = new Date();
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: venue.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    for (const resource of venue.resources) {
      const window = windowForDate({
        date,
        timeZone: venue.timezone,
        hours: resource.operatingHours,
        exceptions: resource.exceptions,
      });
      if (!window.closed && window.start && window.end && now >= window.start && now < window.end) {
        return { open: true, label: `Open · closes ${window.closesAt}` };
      }
    }
    for (const resource of venue.resources) {
      const window = windowForDate({
        date,
        timeZone: venue.timezone,
        hours: resource.operatingHours,
        exceptions: resource.exceptions,
      });
      if (!window.closed && window.opensAt) {
        return { open: false, label: `Opens ${window.opensAt}` };
      }
    }
    return { open: false, label: "Closed" };
  }

  private async loadBookingsByVenue(venueIds: string[], date: string) {
    const bookingsByVenue = new Map<string, AvailabilityBooking[]>();
    if (venueIds.length === 0) return bookingsByVenue;

    const rangeStart = new Date(`${date}T00:00:00.000Z`);
    const rangeEnd = new Date(`${date}T23:59:59.999Z`);
    const bookings = await this.prisma.booking.findMany({
      where: {
        venueId: { in: venueIds },
        status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
        startsAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
      },
      select: { venueId: true, resourceId: true, startsAt: true, endsAt: true },
    });

    for (const booking of bookings) {
      const list = bookingsByVenue.get(booking.venueId);
      if (list) list.push(booking);
      else bookingsByVenue.set(booking.venueId, [booking]);
    }
    return bookingsByVenue;
  }

  private hasAvailability(
    venue: {
      id: string;
      timezone: string;
      minAdvanceHours: number;
      maxAdvanceDays: number;
      resources: {
        id: string;
        isActive: boolean;
        slotIntervalMinutes: number;
        defaultDurationMinutes: number;
        operatingHours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[];
        exceptions: {
          type: "CLOSED" | "SPECIAL_HOURS" | "BLOCKED";
          startsAt: Date;
          endsAt: Date;
          opensAt: string | null;
          closesAt: string | null;
        }[];
        pricingRules: {
          name: string;
          dayOfWeek: number | null;
          startsAt: string;
          endsAt: string;
          priceAmount: { toString(): string };
          isDefault: boolean;
          sortOrder: number;
        }[];
      }[];
    },
    bookings: AvailabilityBooking[],
    date?: string,
    time?: string,
  ) {
    if (!date) return true;

    for (const resource of venue.resources) {
      const window = windowForDate({
        date,
        timeZone: venue.timezone,
        hours: resource.operatingHours,
        exceptions: resource.exceptions,
      });
      const slots = generateSlots({
        timeZone: venue.timezone,
        window,
        intervalMinutes: resource.slotIntervalMinutes,
        durationMinutes: resource.defaultDurationMinutes,
        bookings: bookings
          .filter((booking) => booking.resourceId === resource.id)
          .map((booking) => ({ start: booking.startsAt, end: booking.endsAt })),
        blocks: resource.exceptions
          .filter((item) => item.type === "BLOCKED" || item.type === "CLOSED")
          .map((item) => ({ start: item.startsAt, end: item.endsAt })),
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
      const openSlots = slots.filter((slot) => {
        if (slot.status !== "available") return false;
        const advance = evaluateAdvanceWindow({
          start: slot.start,
          now: new Date(),
          minAdvanceHours: venue.minAdvanceHours,
          maxAdvanceDays: venue.maxAdvanceDays,
        });
        if (!advance.available) return false;
        if (time && hhmmInTimeZone(slot.start, venue.timezone) !== time) return false;
        return true;
      });
      if (openSlots.length > 0) return true;
    }
    return false;
  }
}
