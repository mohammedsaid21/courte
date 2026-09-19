import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import {
  CreateExceptionInput,
  CreatePricingRuleInput,
  OperatingHourInput,
  UpdatePricingRuleInput,
} from "@courte/shared";
import { AccessService } from "../access/access.service";
import { PrismaService } from "../prisma/prisma.service";
import { money } from "../common/util";

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async list(user: User, venueId: string) {
    await this.access.assertVenueRole(user, venueId);
    const resources = await this.prisma.venueResource.findMany({
      where: { venueId },
      include: { operatingHours: true, pricingRules: true, venueType: true },
      orderBy: { sortOrder: "asc" },
    });
    return resources.map((resource) => this.serialize(resource));
  }

  async replaceHours(user: User, resourceId: string, hours: OperatingHourInput[]) {
    await this.access.assertResourceAccess(user, resourceId, ["OWNER", "MANAGER"]);
    await this.prisma.$transaction([
      this.prisma.operatingHour.deleteMany({ where: { resourceId } }),
      this.prisma.operatingHour.createMany({
        data: hours.map((hour) => ({
          resourceId,
          dayOfWeek: hour.dayOfWeek,
          opensAt: hour.opensAt,
          closesAt: hour.closesAt,
          isClosed: hour.isClosed,
        })),
      }),
    ]);
    return this.prisma.operatingHour.findMany({
      where: { resourceId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  async listExceptions(user: User, resourceId: string) {
    await this.access.assertResourceAccess(user, resourceId);
    return this.prisma.availabilityException.findMany({
      where: { resourceId },
      orderBy: { startsAt: "asc" },
    });
  }

  async createException(user: User, resourceId: string, input: CreateExceptionInput) {
    await this.access.assertResourceAccess(user, resourceId, ["OWNER", "MANAGER", "STAFF"]);
    return this.prisma.availabilityException.create({
      data: {
        resourceId,
        type: input.type,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        opensAt: input.opensAt,
        closesAt: input.closesAt,
        reason: input.reason,
      },
    });
  }

  async deleteException(user: User, exceptionId: string) {
    const exception = await this.prisma.availabilityException.findUnique({
      where: { id: exceptionId },
    });
    if (!exception) return { ok: true };
    await this.access.assertResourceAccess(user, exception.resourceId);
    await this.prisma.availabilityException.delete({ where: { id: exceptionId } });
    return { ok: true };
  }

  async listPricing(user: User, resourceId: string) {
    await this.access.assertResourceAccess(user, resourceId);
    const rules = await this.prisma.pricingRule.findMany({
      where: { resourceId },
      orderBy: { sortOrder: "asc" },
    });
    return rules.map((rule) => ({ ...rule, priceAmount: money(rule.priceAmount) }));
  }

  async createPricing(user: User, resourceId: string, input: CreatePricingRuleInput) {
    await this.access.assertResourceAccess(user, resourceId, ["OWNER", "MANAGER"]);
    const rule = await this.prisma.pricingRule.create({
      data: {
        resourceId,
        name: input.name,
        dayOfWeek: input.dayOfWeek,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        priceAmount: input.priceAmount,
        isDefault: input.isDefault,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return { ...rule, priceAmount: money(rule.priceAmount) };
  }

  async updatePricing(user: User, ruleId: string, input: UpdatePricingRuleInput) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id: ruleId } });
    if (!rule) return null;
    await this.access.assertResourceAccess(user, rule.resourceId);
    const updated = await this.prisma.pricingRule.update({
      where: { id: ruleId },
      data: {
        name: input.name,
        dayOfWeek: input.dayOfWeek,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        priceAmount: input.priceAmount,
        isDefault: input.isDefault,
        sortOrder: input.sortOrder,
      },
    });
    return { ...updated, priceAmount: money(updated.priceAmount) };
  }

  async deletePricing(user: User, ruleId: string) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id: ruleId } });
    if (!rule) return { ok: true };
    await this.access.assertResourceAccess(user, rule.resourceId);
    await this.prisma.pricingRule.delete({ where: { id: ruleId } });
    return { ok: true };
  }

  private serialize(resource: {
    pricingRules: { priceAmount: { toString(): string } }[];
  } & Record<string, unknown>) {
    return {
      ...resource,
      pricingRules: resource.pricingRules.map((rule) => ({
        ...rule,
        priceAmount: money(rule.priceAmount),
      })),
    };
  }
}
