import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { CreateRecurringSeriesInput } from "@courte/shared";
import { AccessService } from "../access/access.service";
import { evaluateAvailability, generateRecurringOccurrences } from "../booking-engine";
import { money } from "../common/util";
import { PrismaService } from "../prisma/prisma.service";
import { derivePaymentStatus } from "../booking-engine/pricing";

@Injectable()
export class RecurringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async preview(user: User, input: CreateRecurringSeriesInput) {
    const plan = await this.plan(user, input);
    return this.serializePlan(plan);
  }

  async create(user: User, input: CreateRecurringSeriesInput) {
    const plan = await this.plan(user, input);
    if (plan.conflicts.length > 0 && !input.skipConflicts) {
      throw new ConflictException({
        message: `${plan.conflicts.length} date(s) already have a booking or block. Skip those dates or change the series.`,
        ...this.serializePlan(plan),
      });
    }
    if (plan.create.length === 0) {
      throw new BadRequestException("No dates left to create after conflicts.");
    }

    const paidAmount = input.paymentStatus === "PAID" ? plan.priceAmount : 0;
    const paymentStatus = derivePaymentStatus(plan.priceAmount, paidAmount);

    const series = await this.prisma.$transaction(async (tx) => {
      const created = await tx.recurringSeries.create({
        data: {
          venueId: input.venueId,
          resourceId: input.resourceId,
          customerId: plan.customer.id,
          createdByUserId: user.id,
          daysOfWeek: [...new Set(input.daysOfWeek)],
          startTime: input.startTime,
          durationMinutes: input.durationMinutes,
          priceAmount: plan.priceAmount,
          startDate: new Date(`${input.startDate}T00:00:00.000Z`),
          endDate: new Date(`${input.endDate}T00:00:00.000Z`),
          source: input.source,
          paymentStatus,
          notes: input.notes,
        },
      });

      for (const item of plan.create) {
        await tx.booking.create({
          data: {
            venueId: input.venueId,
            resourceId: input.resourceId,
            customerId: plan.customer.id,
            createdByUserId: user.id,
            updatedByUserId: user.id,
            recurringSeriesId: created.id,
            source: input.source,
            status: "CONFIRMED",
            paymentStatus,
            startsAt: item.start,
            endsAt: item.end,
            priceAmount: plan.priceAmount,
            paidAmount,
            notes: input.notes,
            payments:
              paidAmount > 0
                ? { create: { amount: paidAmount, method: "CASH" } }
                : undefined,
          },
        });
      }
      return created;
    });

    return this.get(user, series.id);
  }

  async list(user: User, venueId: string) {
    await this.access.assertVenueRole(user, venueId);
    const series = await this.prisma.recurringSeries.findMany({
      where: { venueId, status: "ACTIVE" },
      include: {
        customer: true,
        resource: { select: { id: true, name: true } },
        _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return series.map((item) => ({
      id: item.id,
      daysOfWeek: item.daysOfWeek,
      startTime: item.startTime,
      durationMinutes: item.durationMinutes,
      priceAmount: money(item.priceAmount),
      startDate: item.startDate.toISOString().slice(0, 10),
      endDate: item.endDate.toISOString().slice(0, 10),
      source: item.source,
      paymentStatus: item.paymentStatus,
      notes: item.notes,
      status: item.status,
      bookingCount: item._count.bookings,
      customer: { id: item.customer.id, name: item.customer.name, phone: item.customer.phone },
      resource: item.resource,
    }));
  }

  async get(user: User, seriesId: string) {
    const series = await this.prisma.recurringSeries.findUnique({
      where: { id: seriesId },
      include: {
        customer: true,
        resource: { select: { id: true, name: true } },
        bookings: {
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
    });
    if (!series) throw new NotFoundException("Recurring series not found");
    await this.access.assertVenueRole(user, series.venueId);
    return {
      id: series.id,
      daysOfWeek: series.daysOfWeek,
      startTime: series.startTime,
      durationMinutes: series.durationMinutes,
      priceAmount: money(series.priceAmount),
      startDate: series.startDate.toISOString().slice(0, 10),
      endDate: series.endDate.toISOString().slice(0, 10),
      source: series.source,
      paymentStatus: series.paymentStatus,
      notes: series.notes,
      status: series.status,
      customer: { id: series.customer.id, name: series.customer.name, phone: series.customer.phone },
      resource: series.resource,
      bookings: series.bookings,
    };
  }

  async cancel(user: User, seriesId: string) {
    const series = await this.prisma.recurringSeries.findUnique({ where: { id: seriesId } });
    if (!series) throw new NotFoundException("Recurring series not found");
    await this.access.assertVenueRole(user, series.venueId);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.recurringSeries.update({
        where: { id: seriesId },
        data: { status: "CANCELLED" },
      }),
      this.prisma.booking.updateMany({
        where: {
          recurringSeriesId: seriesId,
          status: { in: ["CONFIRMED", "PENDING"] },
          startsAt: { gt: now },
        },
        data: { status: "CANCELLED", cancelledAt: now, updatedByUserId: user.id },
      }),
    ]);
    return this.get(user, seriesId);
  }

  private async plan(user: User, input: CreateRecurringSeriesInput) {
    const { venue } = await this.access.assertVenueRole(user, input.venueId);
    const resource = await this.prisma.venueResource.findFirst({
      where: { id: input.resourceId, venueId: input.venueId },
      include: { operatingHours: true, exceptions: true, pricingRules: true },
    });
    if (!resource) throw new NotFoundException("Resource not found for this venue");

    const occurrences = generateRecurringOccurrences({
      startDate: input.startDate,
      endDate: input.endDate,
      daysOfWeek: input.daysOfWeek,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      timeZone: venue.timezone,
    });
    if (occurrences.length === 0) {
      throw new BadRequestException("No matching days in that date range.");
    }

    const rangeStart = occurrences[0].start;
    const rangeEnd = occurrences[occurrences.length - 1].end;
    const existing = await this.prisma.booking.findMany({
      where: {
        resourceId: resource.id,
        status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
        startsAt: { lt: rangeEnd },
        endsAt: { gt: rangeStart },
      },
      include: { customer: { select: { name: true } } },
    });

    const customer = await this.resolveCustomer(input);
    const first = occurrences[0];
    const quote = evaluateAvailability({
      start: first.start,
      end: first.end,
      timeZone: venue.timezone,
      resourceActive: resource.isActive,
      minDurationMinutes: resource.minDurationMinutes,
      maxDurationMinutes: resource.maxDurationMinutes,
      hours: resource.operatingHours,
      exceptions: resource.exceptions,
      overlappingBookings: [],
      rules: resource.pricingRules.map((rule) => ({
        name: rule.name,
        dayOfWeek: rule.dayOfWeek,
        startsAt: rule.startsAt,
        endsAt: rule.endsAt,
        priceAmount: money(rule.priceAmount),
        isDefault: rule.isDefault,
        sortOrder: rule.sortOrder,
      })),
      allowOutsideHours: true,
      enforceAdvanceWindow: false,
    });
    const priceAmount = input.priceAmount ?? quote.priceAmount ?? 0;

    const create: typeof occurrences = [];
    const conflicts: {
      date: string;
      startsAt: Date;
      endsAt: Date;
      reason: string;
      bookingId?: string;
      customerName?: string;
    }[] = [];

    for (const item of occurrences) {
      const overlap = existing.find(
        (booking) => booking.startsAt < item.end && booking.endsAt > item.start,
      );
      const block = resource.exceptions.find(
        (exception) =>
          (exception.type === "BLOCKED" || exception.type === "CLOSED") &&
          exception.startsAt < item.end &&
          exception.endsAt > item.start,
      );
      if (overlap) {
        conflicts.push({
          date: item.date,
          startsAt: item.start,
          endsAt: item.end,
          reason: `Already booked for ${overlap.customer.name}`,
          bookingId: overlap.id,
          customerName: overlap.customer.name,
        });
        continue;
      }
      if (block) {
        conflicts.push({
          date: item.date,
          startsAt: item.start,
          endsAt: item.end,
          reason: block.reason || "Blocked or closed",
        });
        continue;
      }
      create.push(item);
    }

    return { create, conflicts, customer, priceAmount, resourceName: resource.name };
  }

  private serializePlan(plan: Awaited<ReturnType<RecurringService["plan"]>>) {
    return {
      createCount: plan.create.length,
      conflictCount: plan.conflicts.length,
      priceAmount: plan.priceAmount,
      resourceName: plan.resourceName,
      customer: { id: plan.customer.id, name: plan.customer.name, phone: plan.customer.phone },
      create: plan.create.map((item) => ({
        date: item.date,
        startsAt: item.start.toISOString(),
        endsAt: item.end.toISOString(),
      })),
      conflicts: plan.conflicts.map((item) => ({
        date: item.date,
        startsAt: item.startsAt.toISOString(),
        endsAt: item.endsAt.toISOString(),
        reason: item.reason,
        bookingId: item.bookingId,
        customerName: item.customerName,
      })),
    };
  }

  private async resolveCustomer(input: CreateRecurringSeriesInput) {
    if (input.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: input.customerId } });
      if (!customer || customer.venueId !== input.venueId) {
        throw new NotFoundException("Customer does not belong to this venue");
      }
      return customer;
    }
    if (!input.customer) throw new NotFoundException("Customer is required");
    return this.prisma.customer.upsert({
      where: { venueId_phone: { venueId: input.venueId, phone: input.customer.phone } },
      update: {
        name: input.customer.name,
        whatsapp: input.customer.whatsapp,
        notes: input.customer.notes ?? undefined,
      },
      create: {
        venueId: input.venueId,
        ...input.customer,
      },
    });
  }
}
