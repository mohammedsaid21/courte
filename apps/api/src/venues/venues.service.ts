import { Injectable, NotFoundException } from "@nestjs/common";
import { User } from "@prisma/client";
import {
  CreateResourceInput,
  CreateVenueInput,
  OnboardingInput,
  UpdateResourceInput,
  UpdateVenueInput,
} from "@courte/shared";
import { AccessService } from "../access/access.service";
import { uniqueSlug, money } from "../common/util";
import { PrismaService } from "../prisma/prisma.service";

const venueInclude = {
  types: { include: { venueType: true } },
  amenities: { include: { amenity: true } },
  photos: { orderBy: { sortOrder: "asc" as const } },
  resources: {
    orderBy: { sortOrder: "asc" as const },
    include: { operatingHours: true, venueType: true },
  },
};

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async listForUser(user: User) {
    const memberships = await this.prisma.venueMember.findMany({
      where: { userId: user.id },
      include: { venue: { include: venueInclude } },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((membership) =>
      this.serialize(membership.venue, membership.role),
    );
  }

  async get(user: User, venueId: string) {
    const [membership, venue] = await Promise.all([
      this.access.assertVenueRole(user, venueId),
      this.prisma.venue.findUnique({
        where: { id: venueId },
        include: venueInclude,
      }),
    ]);
    if (!venue) throw new NotFoundException("Venue not found");
    return this.serialize(venue, membership.role);
  }

  async create(user: User, input: CreateVenueInput) {
    await this.access.assertOwnerAccount(user);
    const venue = await this.prisma.venue.create({
      data: {
        slug: uniqueSlug(input.name),
        name: input.name,
        description: input.description,
        phone: input.phone,
        whatsapp: input.whatsapp,
        address: input.address,
        city: input.city,
        latitude: input.latitude ?? undefined,
        longitude: input.longitude ?? undefined,
        coverImageUrl: input.coverImageUrl,
        types: {
          create: input.venueTypeIds.map((venueTypeId) => ({ venueTypeId })),
        },
        amenities: {
          create: input.amenityIds.map((amenityId) => ({ amenityId })),
        },
        photos: {
          create: input.photoUrls.map((url, sortOrder) => ({ url, sortOrder })),
        },
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
      include: venueInclude,
    });
    return this.serialize(venue, "OWNER");
  }

  async onboard(user: User, input: OnboardingInput) {
    this.access.assertOwnerAccount(user);
    const venue = await this.prisma.$transaction(async (tx) => {
      const created = await tx.venue.create({
        data: {
          slug: uniqueSlug(input.venue.name),
          name: input.venue.name,
          description: input.venue.description,
          phone: input.venue.phone,
          whatsapp: input.venue.whatsapp,
          address: input.venue.address,
          city: input.venue.city,
          latitude: input.venue.latitude ?? undefined,
          longitude: input.venue.longitude ?? undefined,
          coverImageUrl: input.venue.coverImageUrl,
          defaultDurationMinutes: input.resource.defaultDurationMinutes,
          types: {
            create: input.venue.venueTypeIds.map((venueTypeId) => ({ venueTypeId })),
          },
          amenities: {
            create: input.venue.amenityIds.map((amenityId) => ({ amenityId })),
          },
          photos: {
            create: input.venue.photoUrls.map((url, sortOrder) => ({ url, sortOrder })),
          },
          members: { create: { userId: user.id, role: "OWNER" } },
        },
      });

      await tx.venueResource.create({
        data: {
          venueId: created.id,
          name: input.resource.name,
          description: input.resource.description,
          venueTypeId: input.resource.venueTypeId,
          defaultDurationMinutes: input.resource.defaultDurationMinutes,
          slotIntervalMinutes: input.resource.slotIntervalMinutes,
          minDurationMinutes: input.resource.minDurationMinutes,
          maxDurationMinutes: input.resource.maxDurationMinutes,
          operatingHours: {
            create: input.hours.map((hour) => ({
              dayOfWeek: hour.dayOfWeek,
              opensAt: hour.opensAt,
              closesAt: hour.closesAt,
              isClosed: hour.isClosed,
            })),
          },
          pricingRules: {
            create: [
              {
                name: "Day",
                startsAt: "08:00",
                endsAt: input.peakStartsAt ?? "16:00",
                priceAmount: input.defaultPrice,
                isDefault: true,
                sortOrder: 0,
              },
              ...(input.peakPrice != null
                ? [
                    {
                      name: "Evening",
                      startsAt: input.peakStartsAt ?? "16:00",
                      endsAt: "00:00",
                      priceAmount: input.peakPrice,
                      isDefault: false,
                      sortOrder: 1,
                    },
                  ]
                : []),
            ],
          },
        },
      });

      return tx.venue.findUniqueOrThrow({
        where: { id: created.id },
        include: venueInclude,
      });
    });

    return this.serialize(venue, "OWNER");
  }

  async update(user: User, venueId: string, input: UpdateVenueInput) {
    await this.access.assertVenueRole(user, venueId, ["OWNER", "MANAGER"]);
    const venue = await this.prisma.$transaction(async (tx) => {
      if (input.venueTypeIds) {
        await tx.venueTypeAssignment.deleteMany({ where: { venueId } });
        await tx.venueTypeAssignment.createMany({
          data: input.venueTypeIds.map((venueTypeId) => ({ venueId, venueTypeId })),
        });
      }
      if (input.amenityIds) {
        await tx.venueAmenity.deleteMany({ where: { venueId } });
        await tx.venueAmenity.createMany({
          data: input.amenityIds.map((amenityId) => ({ venueId, amenityId })),
        });
      }
      if (input.photoUrls) {
        await tx.venuePhoto.deleteMany({ where: { venueId } });
        await tx.venuePhoto.createMany({
          data: input.photoUrls.map((url, sortOrder) => ({ venueId, url, sortOrder })),
        });
      }
      return tx.venue.update({
        where: { id: venueId },
        data: {
          name: input.name,
          description: input.description,
          phone: input.phone,
          whatsapp: input.whatsapp,
          address: input.address,
          city: input.city,
          latitude: input.latitude ?? undefined,
          longitude: input.longitude ?? undefined,
          coverImageUrl: input.coverImageUrl,
          isActive: input.isActive,
          slug: input.slug,
          defaultDurationMinutes: input.defaultDurationMinutes,
          minAdvanceHours: input.minAdvanceHours,
          maxAdvanceDays: input.maxAdvanceDays,
          cancellationHours: input.cancellationHours,
          cancellationPolicy: input.cancellationPolicy,
        },
        include: venueInclude,
      });
    });
    return this.serialize(venue, "OWNER");
  }

  async publicBySlug(slug: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { slug },
      include: {
        types: { include: { venueType: true } },
        amenities: { include: { amenity: true } },
        photos: { orderBy: { sortOrder: "asc" } },
        resources: {
          where: { isActive: true },
          include: { operatingHours: true, venueType: true, pricingRules: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!venue || !venue.isActive) {
      throw new NotFoundException("Venue not found");
    }
    const resourcePrices = venue.resources.flatMap((resource) =>
      resource.pricingRules.map((rule) => money(rule.priceAmount)),
    );
    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      description: venue.description,
      phone: venue.phone,
      whatsapp: venue.whatsapp,
      address: venue.address,
      city: venue.city,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
      coverImageUrl: venue.coverImageUrl,
      timezone: venue.timezone,
      minAdvanceHours: venue.minAdvanceHours,
      maxAdvanceDays: venue.maxAdvanceDays,
      cancellationHours: venue.cancellationHours,
      cancellationPolicy: venue.cancellationPolicy,
      startingPrice: resourcePrices.length ? Math.min(...resourcePrices) : null,
      types: venue.types.map((item) => item.venueType),
      amenities: venue.amenities.map((item) => item.amenity),
      photos: venue.photos,
      resources: venue.resources.map((resource) => {
        const prices = resource.pricingRules.map((rule) => money(rule.priceAmount));
        return {
          id: resource.id,
          name: resource.name,
          description: resource.description,
          type: resource.venueType,
          defaultDurationMinutes: resource.defaultDurationMinutes,
          slotIntervalMinutes: resource.slotIntervalMinutes,
          minDurationMinutes: resource.minDurationMinutes,
          maxDurationMinutes: resource.maxDurationMinutes,
          hours: resource.operatingHours,
          pricing: resource.pricingRules.map((rule) => ({
            name: rule.name,
            startsAt: rule.startsAt,
            endsAt: rule.endsAt,
            priceAmount: money(rule.priceAmount),
            isDefault: rule.isDefault,
          })),
          startingPrice: prices.length ? Math.min(...prices) : null,
        };
      }),
    };
  }

  async createResource(user: User, venueId: string, input: CreateResourceInput) {
    await this.access.assertVenueRole(user, venueId, ["OWNER", "MANAGER"]);
    const [count, template, venue] = await Promise.all([
      this.prisma.venueResource.count({ where: { venueId } }),
      this.prisma.venueResource.findFirst({
        where: { venueId },
        include: { operatingHours: true, pricingRules: true },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.venue.findUniqueOrThrow({ where: { id: venueId } }),
    ]);
    const hours =
      template?.operatingHours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        opensAt: hour.opensAt,
        closesAt: hour.closesAt,
        isClosed: hour.isClosed,
      })) ??
      Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        opensAt: "08:00",
        closesAt: "23:00",
        isClosed: false,
      }));
    return this.prisma.venueResource.create({
      data: {
        venueId,
        name: input.name,
        description: input.description,
        venueTypeId: input.venueTypeId,
        defaultDurationMinutes: input.defaultDurationMinutes ?? venue.defaultDurationMinutes,
        slotIntervalMinutes: input.slotIntervalMinutes ?? venue.defaultDurationMinutes,
        minDurationMinutes: input.minDurationMinutes,
        maxDurationMinutes: input.maxDurationMinutes,
        sortOrder: input.sortOrder ?? count,
        operatingHours: { create: hours },
        pricingRules: template?.pricingRules.length
          ? {
              create: template.pricingRules.map((rule) => ({
                name: rule.name,
                dayOfWeek: rule.dayOfWeek,
                startsAt: rule.startsAt,
                endsAt: rule.endsAt,
                priceAmount: rule.priceAmount,
                isDefault: rule.isDefault,
                sortOrder: rule.sortOrder,
              })),
            }
          : undefined,
      },
      include: { operatingHours: true, pricingRules: true, venueType: true },
    });
  }

  async updateResource(user: User, resourceId: string, input: UpdateResourceInput) {
    await this.access.assertResourceAccess(user, resourceId, ["OWNER", "MANAGER"]);
    return this.prisma.venueResource.update({
      where: { id: resourceId },
      data: {
        name: input.name,
        description: input.description,
        venueTypeId: input.venueTypeId,
        defaultDurationMinutes: input.defaultDurationMinutes,
        slotIntervalMinutes: input.slotIntervalMinutes,
        minDurationMinutes: input.minDurationMinutes,
        maxDurationMinutes: input.maxDurationMinutes,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      },
      include: { operatingHours: true, pricingRules: true, venueType: true },
    });
  }

  private serialize(
    venue: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      phone: string;
      whatsapp: string | null;
      address: string;
      city: string;
      latitude: { toString(): string } | null;
      longitude: { toString(): string } | null;
      coverImageUrl: string | null;
      isActive: boolean;
      timezone: string;
      defaultDurationMinutes: number;
      minAdvanceHours: number;
      maxAdvanceDays: number;
      cancellationHours: number;
      cancellationPolicy: string | null;
      types: { venueType: unknown }[];
      amenities: { amenity: unknown }[];
      photos: unknown[];
      resources: unknown[];
    },
    role: string,
  ) {
    return {
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      description: venue.description,
      phone: venue.phone,
      whatsapp: venue.whatsapp,
      address: venue.address,
      city: venue.city,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
      coverImageUrl: venue.coverImageUrl,
      isActive: venue.isActive,
      timezone: venue.timezone,
      defaultDurationMinutes: venue.defaultDurationMinutes,
      minAdvanceHours: venue.minAdvanceHours,
      maxAdvanceDays: venue.maxAdvanceDays,
      cancellationHours: venue.cancellationHours,
      cancellationPolicy: venue.cancellationPolicy,
      role,
      types: venue.types.map((item) => item.venueType),
      amenities: venue.amenities.map((item) => item.amenity),
      photos: venue.photos,
      resources: venue.resources,
    };
  }
}
