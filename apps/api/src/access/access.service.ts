import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { User, Venue, VenueMemberRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type VenueAccess = {
  venue: Venue;
  role: VenueMemberRole;
};

const bookableResourceInclude = {
  venue: true,
  operatingHours: true,
  exceptions: true,
  pricingRules: true,
} as const;

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertVenueRole(
    user: User,
    venueId: string,
    roles: VenueMemberRole[] = ["OWNER", "MANAGER", "STAFF"],
  ): Promise<VenueAccess> {
    if (user.platformRole === "PLATFORM_ADMIN") {
      const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
      if (!venue) throw new NotFoundException("Venue not found");
      return { venue, role: "OWNER" };
    }

    const membership = await this.prisma.venueMember.findUnique({
      where: { venueId_userId: { venueId, userId: user.id } },
      include: { venue: true },
    });
    if (!membership) {
      throw new ForbiddenException("You do not have access to this venue");
    }
    if (!roles.includes(membership.role)) {
      throw new ForbiddenException("You do not have permission for this action");
    }
    return { venue: membership.venue, role: membership.role };
  }

  assertOwnerAccount(user: User) {
    if (user.accountKind === "CUSTOMER") {
      throw new ForbiddenException("This action is for venue owners");
    }
    return user;
  }

  async assertCustomerAccess(user: User, customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    await this.assertVenueRole(user, customer.venueId);
    return customer;
  }

  async assertBookingAccess(user: User, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }
    await this.assertVenueRole(user, booking.venueId);
    return booking;
  }

  async assertResourceAccess(
    user: User,
    resourceId: string,
    roles?: VenueMemberRole[],
  ) {
    const resource = await this.prisma.venueResource.findUnique({
      where: { id: resourceId },
      select: { id: true, venueId: true },
    });
    if (!resource) {
      throw new NotFoundException("Resource not found");
    }
    await this.assertVenueRole(user, resource.venueId, roles);
    return resource;
  }

  async loadBookableResource(
    user: User,
    resourceId: string,
    roles?: VenueMemberRole[],
  ) {
    const resource = await this.prisma.venueResource.findUnique({
      where: { id: resourceId },
      include: bookableResourceInclude,
    });
    if (!resource) {
      throw new NotFoundException("Resource not found");
    }
    await this.assertVenueRole(user, resource.venueId, roles);
    return resource;
  }
}
