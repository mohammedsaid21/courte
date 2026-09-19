import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@prisma/client";
import { CustomerInput } from "@courte/shared";
import { AccessService } from "../access/access.service";
import { money } from "../common/util";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(user: User, venueId: string, q?: string, filter?: string) {
    await this.access.assertVenueRole(user, venueId);
    const search = q?.trim();
    const now = new Date();
    const customers = await this.prisma.customer.findMany({
      where: {
        venueId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { whatsapp: { contains: search } },
              ],
            }
          : {}),
        ...(filter === "upcoming"
          ? {
              bookings: {
                some: { status: { in: ["CONFIRMED", "PENDING"] }, startsAt: { gte: now } },
              },
            }
          : {}),
        ...(filter === "unpaid"
          ? {
              bookings: {
                some: {
                  status: { not: "CANCELLED" },
                  paymentStatus: { in: ["UNPAID", "PARTIAL"] },
                },
              },
            }
          : {}),
        ...(filter === "cancelled"
          ? { bookings: { some: { status: "CANCELLED" } } }
          : {}),
      },
      include: {
        bookings: {
          select: {
            status: true,
            paymentStatus: true,
            priceAmount: true,
            paidAmount: true,
            startsAt: true,
            endsAt: true,
          },
          orderBy: { startsAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    });
    return customers.map((customer) => this.serialize(customer, now));
  }

  async lookup(user: User, venueId: string, phone: string) {
    await this.access.assertVenueRole(user, venueId);
    const trimmed = phone.trim();
    if (!trimmed) return null;
    const customer = await this.prisma.customer.findUnique({
      where: { venueId_phone: { venueId, phone: trimmed } },
      include: {
        bookings: {
          select: {
            status: true,
            paymentStatus: true,
            priceAmount: true,
            paidAmount: true,
            startsAt: true,
            endsAt: true,
          },
          orderBy: { startsAt: "desc" },
        },
      },
    });
    return customer ? this.serialize(customer) : null;
  }

  async get(user: User, customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        bookings: {
          include: { resource: { select: { id: true, name: true } } },
          orderBy: { startsAt: "desc" },
        },
      },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    await this.access.assertVenueRole(user, customer.venueId);
    return {
      ...this.serialize(customer),
      bookings: customer.bookings.map((booking) => ({
        id: booking.id,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
        source: booking.source,
        paymentStatus: booking.paymentStatus,
        priceAmount: money(booking.priceAmount),
        paidAmount: money(booking.paidAmount),
        resource: booking.resource,
        notes: booking.notes,
      })),
    };
  }

  async create(user: User, venueId: string, input: CustomerInput) {
    await this.access.assertVenueRole(user, venueId);
    return this.prisma.customer.upsert({
      where: { venueId_phone: { venueId, phone: input.phone } },
      update: input,
      create: { venueId, ...input },
    });
  }

  async update(user: User, customerId: string, input: Partial<CustomerInput>) {
    const customer = await this.access.assertCustomerAccess(user, customerId);
    return this.prisma.customer.update({ where: { id: customer.id }, data: input });
  }

  private serialize(
    customer: {
      id: string;
      name: string;
      phone: string;
      whatsapp: string | null;
      notes: string | null;
      bookings: {
        status: string;
        paymentStatus?: string;
        priceAmount: { toString(): string };
        paidAmount: { toString(): string };
        startsAt: Date;
        endsAt?: Date;
      }[];
    },
    now = new Date(),
  ) {
    const completed = customer.bookings.filter((booking) => booking.status === "COMPLETED");
    const cancelled = customer.bookings.filter((booking) => booking.status === "CANCELLED");
    const paidBookings = customer.bookings.filter((booking) => booking.status !== "CANCELLED");
    const totalPaid = paidBookings.reduce((sum, booking) => sum + money(booking.paidAmount), 0);
    const upcoming = [...customer.bookings]
      .filter((booking) => ["CONFIRMED", "PENDING"].includes(booking.status) && booking.startsAt >= now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
    const last = [...customer.bookings].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      notes: customer.notes,
      bookingCount: customer.bookings.length,
      completedBookings: completed.length,
      cancelledBookings: cancelled.length,
      totalSpent: Math.round(
        paidBookings.reduce((sum, booking) => sum + money(booking.priceAmount), 0) * 100,
      ) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      lastBookingAt: last?.startsAt ?? null,
      upcomingBookingAt: upcoming?.startsAt ?? null,
    };
  }
}
