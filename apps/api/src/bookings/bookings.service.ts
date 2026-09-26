import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import {
  AddPaymentInput,
  BookingsQuery,
  CreateBookingInput,
  CreateCustomerBookingInput,
  CreateCustomerBookingsBatchInput,
  UpdateBookingInput,
} from "@courte/shared";
import { AccessService } from "../access/access.service";
import { evaluateAvailability } from "../booking-engine";
import { evaluateCancellation } from "../booking-engine/cancel";
import { startOfZonedDay, endOfZonedDay } from "../booking-engine/time";
import { money } from "../common/util";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { derivePaymentStatus } from "../booking-engine/pricing";

const bookingInclude = {
  customer: true,
  resource: { select: { id: true, name: true } },
  venue: {
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      coverImageUrl: true,
      cancellationHours: true,
      cancellationPolicy: true,
      timezone: true,
    },
  },
  payments: { orderBy: { paidAt: "asc" as const } },
  createdBy: { select: { id: true, fullName: true } },
  updatedBy: { select: { id: true, fullName: true } },
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    user: User,
    input: CreateBookingInput,
    options: { asCustomer?: boolean; source?: CreateBookingInput["source"] | "ADMIN" | "CUSTOMER" } = {},
  ) {
    const asCustomer = Boolean(options.asCustomer);
    const source = asCustomer ? "CUSTOMER" : (options.source ?? input.source ?? "MANUAL");
    if (!asCustomer) {
      await this.access.assertVenueRole(user, input.venueId);
    }
    const start = new Date(input.startsAt);
    const end = new Date(input.endsAt);
    const overlapMessage =
      source === "CUSTOMER" && asCustomer ? "This time slot is no longer available." : "This time is already booked.";

    try {
      const booking = await this.prisma.$transaction(
        async (tx) => {
          const resource = await tx.venueResource.findUnique({
            where: { id: input.resourceId },
            include: {
              operatingHours: true,
              exceptions: true,
              pricingRules: true,
              venue: true,
            },
          });
          if (!resource || resource.venueId !== input.venueId) {
            throw new NotFoundException("Resource not found for this venue");
          }

          const overlapping = await tx.booking.findMany({
            where: {
              resourceId: resource.id,
              status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
              startsAt: { lt: end },
              endsAt: { gt: start },
            },
            select: { id: true },
          });

          const decision = evaluateAvailability({
            start,
            end,
            timeZone: resource.venue.timezone,
            resourceActive: resource.isActive,
            minDurationMinutes: resource.minDurationMinutes,
            maxDurationMinutes: resource.maxDurationMinutes,
            hours: resource.operatingHours,
            exceptions: resource.exceptions,
            overlappingBookings: overlapping,
            rules: resource.pricingRules.map((rule) => ({
              name: rule.name,
              dayOfWeek: rule.dayOfWeek,
              startsAt: rule.startsAt,
              endsAt: rule.endsAt,
              priceAmount: money(rule.priceAmount),
              isDefault: rule.isDefault,
              sortOrder: rule.sortOrder,
            })),
            allowOutsideHours: !asCustomer && input.allowOutsideHours,
            now: new Date(),
            minAdvanceHours: resource.venue.minAdvanceHours,
            maxAdvanceDays: resource.venue.maxAdvanceDays,
            enforceAdvanceWindow: asCustomer,
          });

          if (!decision.available) {
            const reason =
              asCustomer && decision.reason?.toLowerCase().includes("already booked")
                ? "This time slot is no longer available."
                : (decision.reason ?? "This time is not available");
            throw new ConflictException(reason);
          }

          const customer = await this.resolveCustomer(tx, user, input);

          const priceAmount =
            asCustomer ? (decision.priceAmount ?? 0) : (input.priceAmount ?? decision.priceAmount ?? 0);
          const paidAmount =
            asCustomer ? 0 : (input.paidAmount ?? (input.paymentStatus === "PAID" ? priceAmount : 0));
          const paymentStatus = asCustomer ? "UNPAID" : derivePaymentStatus(priceAmount, paidAmount);

          return tx.booking.create({
            data: {
              venueId: input.venueId,
              resourceId: resource.id,
              customerId: customer.id,
              createdByUserId: user.id,
              updatedByUserId: user.id,
              source,
              status: asCustomer ? "CONFIRMED" : input.status,
              paymentStatus,
              startsAt: start,
              endsAt: end,
              priceAmount,
              paidAmount,
              notes: input.notes,
              payments:
                !asCustomer && paidAmount > 0
                  ? {
                      create: {
                        amount: paidAmount,
                        method: input.paymentMethod ?? "CASH",
                      },
                    }
                  : undefined,
            },
            include: bookingInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      await this.notifications.enqueueBookingEvent({
        event: booking.status === "CONFIRMED" ? "BOOKING_CONFIRMED" : "BOOKING_CREATED",
        booking,
      });
      return this.serialize(booking);
    } catch (error) {
      if (this.isOverlapError(error)) {
        throw new ConflictException(overlapMessage);
      }
      throw error;
    }
  }

  async list(user: User, venueId: string, query: BookingsQuery) {
    const { venue } = await this.access.assertVenueRole(user, venueId);
    const search = query.q?.trim();

    const bookings = await this.prisma.booking.findMany({
      where: {
        venueId,
        resourceId: query.resourceId,
        status: query.status,
        paymentStatus: query.paymentStatus,
        source: query.source,
        customerId: query.customerId,
        startsAt:
          query.from || query.to
            ? {
                gte: query.from ? startOfZonedDay(query.from, venue.timezone) : undefined,
                lt: query.to ? endOfZonedDay(query.to, venue.timezone) : undefined,
              }
            : undefined,
        ...(search
          ? {
              OR: [
                { customer: { name: { contains: search, mode: "insensitive" } } },
                { customer: { phone: { contains: search } } },
              ],
            }
          : {}),
      },
      include: bookingInclude,
      orderBy: { startsAt: "desc" },
      take: 200,
    });
    return bookings.map((booking) => this.serialize(booking));
  }

  async get(user: User, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (!booking) throw new NotFoundException("Booking not found");
    await this.access.assertVenueRole(user, booking.venueId);
    return this.serialize(booking);
  }

  async update(user: User, bookingId: string, input: UpdateBookingInput) {
    const existing = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        resource: {
          include: { venue: true, operatingHours: true, exceptions: true, pricingRules: true },
        },
      },
    });
    if (!existing) throw new NotFoundException("Booking not found");
    await this.access.assertVenueRole(user, existing.venueId, ["OWNER", "MANAGER", "STAFF"]);

    const start = input.startsAt ? new Date(input.startsAt) : existing.startsAt;
    const end = input.endsAt ? new Date(input.endsAt) : existing.endsAt;

    try {
      const booking = await this.prisma.$transaction(
        async (tx) => {
          if (input.startsAt || input.endsAt) {
            const overlapping = await tx.booking.findMany({
              where: {
                resourceId: existing.resourceId,
                id: { not: existing.id },
                status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
                startsAt: { lt: end },
                endsAt: { gt: start },
              },
              select: { id: true },
            });
            const decision = evaluateAvailability({
              start,
              end,
              timeZone: existing.resource.venue.timezone,
              resourceActive: existing.resource.isActive,
              minDurationMinutes: existing.resource.minDurationMinutes,
              maxDurationMinutes: existing.resource.maxDurationMinutes,
              hours: existing.resource.operatingHours,
              exceptions: existing.resource.exceptions,
              overlappingBookings: overlapping,
              rules: existing.resource.pricingRules.map((rule) => ({
                name: rule.name,
                dayOfWeek: rule.dayOfWeek,
                startsAt: rule.startsAt,
                endsAt: rule.endsAt,
                priceAmount: money(rule.priceAmount),
                isDefault: rule.isDefault,
                sortOrder: rule.sortOrder,
              })),
              allowOutsideHours: input.allowOutsideHours,
            });
            if (!decision.available) {
              throw new ConflictException(decision.reason ?? "This time is not available");
            }
          }

          const nextStatus = input.status ?? existing.status;
          return tx.booking.update({
            where: { id: bookingId },
            data: {
              status: nextStatus,
              paymentStatus: input.paymentStatus,
              notes: input.notes,
              startsAt: start,
              endsAt: end,
              priceAmount: input.priceAmount,
              updatedByUserId: user.id,
              cancelledAt: nextStatus === "CANCELLED" ? new Date() : existing.cancelledAt,
            },
            include: bookingInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (input.status === "CANCELLED" && existing.status !== "CANCELLED") {
        await this.notifications.enqueueBookingEvent({
          event: "BOOKING_CANCELLED",
          booking,
        });
      }
      return this.serialize(booking);
    } catch (error) {
      if (this.isOverlapError(error)) {
        throw new ConflictException("This time is already booked.");
      }
      throw error;
    }
  }

  async addPayment(user: User, bookingId: string, input: AddPaymentInput) {
    const existing = await this.access.assertBookingAccess(user, bookingId);

    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          bookingId,
          amount: input.amount,
          method: input.method,
          notes: input.notes,
        },
      });
      const paidAmount = money(existing.paidAmount) + input.amount;
      const priceAmount = money(existing.priceAmount);
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          paidAmount,
          paymentStatus: derivePaymentStatus(priceAmount, paidAmount),
          updatedByUserId: user.id,
        },
        include: bookingInclude,
      });
    });
    return this.serialize(booking);
  }

  async markPaid(user: User, bookingId: string) {
    const existing = await this.access.assertBookingAccess(user, bookingId);
    const remaining = Math.max(0, money(existing.priceAmount) - money(existing.paidAmount));
    if (remaining <= 0) {
      return this.get(user, bookingId);
    }
    return this.addPayment(user, bookingId, { amount: remaining, method: "CASH" });
  }

  async quote(user: User, resourceId: string, startsAt: string, endsAt: string) {
    const resource = await this.access.loadBookableResource(user, resourceId);
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const overlapping = await this.prisma.booking.findMany({
      where: {
        resourceId,
        status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
      select: { id: true },
    });
    return evaluateAvailability({
      start,
      end,
      timeZone: resource.venue.timezone,
      resourceActive: resource.isActive,
      minDurationMinutes: resource.minDurationMinutes,
      maxDurationMinutes: resource.maxDurationMinutes,
      hours: resource.operatingHours,
      exceptions: resource.exceptions,
      overlappingBookings: overlapping,
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
  }

  async createAsCustomer(user: User, input: CreateCustomerBookingInput) {
    if (!user.fullName || !user.phone) {
      throw new BadRequestException("Add your name and phone number to your profile before booking.");
    }
    const venue = await this.prisma.venue.findUnique({
      where: { id: input.venueId },
      select: { acceptsOnlineBooking: true, isActive: true },
    });
    if (!venue?.isActive || !venue.acceptsOnlineBooking) {
      throw new BadRequestException("Online booking is not available for this venue.");
    }
    const created = await this.create(
      user,
      {
        venueId: input.venueId,
        resourceId: input.resourceId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        notes: input.notes,
        customer: {
          name: user.fullName,
          phone: user.phone,
          whatsapp: user.whatsapp,
        },
        source: "CUSTOMER",
        status: "CONFIRMED",
        paymentStatus: "UNPAID",
        allowOutsideHours: false,
      },
      { asCustomer: true },
    );
    return this.getMine(user, created.id as string);
  }

  async createManyAsCustomer(user: User, input: CreateCustomerBookingsBatchInput) {
    const created: Awaited<ReturnType<typeof this.createAsCustomer>>[] = [];
    for (const booking of input.bookings) {
      created.push(await this.createAsCustomer(user, booking));
    }
    return created;
  }

  async listMine(user: User) {
    const bookings = await this.prisma.booking.findMany({
      where: { createdByUserId: user.id, source: "CUSTOMER" },
      include: bookingInclude,
      orderBy: { startsAt: "desc" },
      take: 200,
    });
    return bookings.map((booking) => this.serializeCustomer(booking));
  }

  async getMine(user: User, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (!booking || booking.createdByUserId !== user.id || booking.source !== "CUSTOMER") {
      throw new NotFoundException("Booking not found");
    }
    return this.serializeCustomer(booking);
  }

  async cancelMine(user: User, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { venue: true },
    });
    if (!booking || booking.createdByUserId !== user.id || booking.source !== "CUSTOMER") {
      throw new NotFoundException("Booking not found");
    }
    const decision = evaluateCancellation({
      status: booking.status,
      startsAt: booking.startsAt,
      cancellationHours: booking.venue.cancellationHours,
    });
    if (!decision.allowed) {
      throw new ForbiddenException(decision.reason ?? "This booking cannot be cancelled.");
    }
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        updatedByUserId: user.id,
      },
      include: bookingInclude,
    });
    await this.notifications.enqueueBookingEvent({
      event: "BOOKING_CANCELLED",
      booking: updated,
    });
    return this.serializeCustomer(updated);
  }

  private serializeCustomer(booking: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    priceAmount: { toString(): string };
    paidAmount: { toString(): string };
    payments: { amount: { toString(): string } }[];
    venue?: {
      cancellationHours: number;
      cancellationPolicy: string | null;
    };
  } & Record<string, unknown>) {
    const serialized = this.serialize(booking);
    const cancel = booking.venue
      ? evaluateCancellation({
          status: booking.status,
          startsAt: booking.startsAt,
          cancellationHours: booking.venue.cancellationHours,
        })
      : { allowed: false, deadline: booking.startsAt };
    return {
      ...serialized,
      canCancel: cancel.allowed,
      cancellationDeadline: cancel.deadline,
      cancellationPolicy: booking.venue?.cancellationPolicy ?? null,
      cancellationHours: booking.venue?.cancellationHours ?? 0,
    };
  }

  private async resolveCustomer(
    tx: Prisma.TransactionClient,
    user: User,
    input: CreateBookingInput,
  ) {
    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer || customer.venueId !== input.venueId) {
        throw new ForbiddenException("Customer does not belong to this venue");
      }
      await this.access.assertVenueRole(user, customer.venueId);
      if (input.customer) {
        return tx.customer.update({
          where: { id: customer.id },
          data: {
            name: input.customer.name,
            whatsapp: input.customer.whatsapp,
            notes: input.customer.notes ?? undefined,
          },
        });
      }
      return customer;
    }

    if (!input.customer) {
      throw new NotFoundException("Customer is required");
    }

    return tx.customer.upsert({
      where: {
        venueId_phone: { venueId: input.venueId, phone: input.customer.phone },
      },
      update: {
        name: input.customer.name,
        whatsapp: input.customer.whatsapp,
        notes: input.customer.notes ?? undefined,
      },
      create: {
        venueId: input.venueId,
        name: input.customer.name,
        phone: input.customer.phone,
        whatsapp: input.customer.whatsapp,
        notes: input.customer.notes,
      },
    });
  }

  private serialize(booking: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    priceAmount: { toString(): string };
    paidAmount: { toString(): string };
    payments: { amount: { toString(): string } }[];
  } & Record<string, unknown>) {
    return {
      ...booking,
      priceAmount: money(booking.priceAmount),
      paidAmount: money(booking.paidAmount),
      durationMinutes: Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000),
      payments: booking.payments.map((payment) => ({
        ...payment,
        amount: money(payment.amount),
      })),
    };
  }

  private isOverlapError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return error.code === "P2002";
    }
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("bookings_no_overlap") || message.includes("23P01");
  }
}
