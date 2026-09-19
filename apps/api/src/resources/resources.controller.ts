import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { User } from "@prisma/client";
import {
  createExceptionSchema,
  createPricingRuleSchema,
  createResourceSchema,
  updatePricingRuleSchema,
  updateResourceSchema,
  upsertOperatingHoursSchema,
} from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { ResourcesService } from "./resources.service";
import { VenuesService } from "../venues/venues.service";

@Controller()
export class ResourcesController {
  constructor(
    private readonly resources: ResourcesService,
    private readonly venues: VenuesService,
  ) {}

  @Get("venues/:venueId/resources")
  list(@CurrentUser() user: User, @Param("venueId") venueId: string) {
    return this.resources.list(user, venueId);
  }

  @Post("venues/:venueId/resources")
  create(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Body(new ZodPipe(createResourceSchema)) body: ReturnType<typeof createResourceSchema.parse>,
  ) {
    return this.venues.createResource(user, venueId, body);
  }

  @Patch("resources/:resourceId")
  update(
    @CurrentUser() user: User,
    @Param("resourceId") resourceId: string,
    @Body(new ZodPipe(updateResourceSchema)) body: ReturnType<typeof updateResourceSchema.parse>,
  ) {
    return this.venues.updateResource(user, resourceId, body);
  }

  @Put("resources/:resourceId/hours")
  hours(
    @CurrentUser() user: User,
    @Param("resourceId") resourceId: string,
    @Body(new ZodPipe(upsertOperatingHoursSchema)) body: ReturnType<typeof upsertOperatingHoursSchema.parse>,
  ) {
    return this.resources.replaceHours(user, resourceId, body.hours);
  }

  @Get("resources/:resourceId/exceptions")
  exceptions(@CurrentUser() user: User, @Param("resourceId") resourceId: string) {
    return this.resources.listExceptions(user, resourceId);
  }

  @Post("resources/:resourceId/exceptions")
  createException(
    @CurrentUser() user: User,
    @Param("resourceId") resourceId: string,
    @Body(new ZodPipe(createExceptionSchema)) body: ReturnType<typeof createExceptionSchema.parse>,
  ) {
    return this.resources.createException(user, resourceId, body);
  }

  @Delete("exceptions/:exceptionId")
  deleteException(@CurrentUser() user: User, @Param("exceptionId") exceptionId: string) {
    return this.resources.deleteException(user, exceptionId);
  }

  @Get("resources/:resourceId/pricing")
  pricing(@CurrentUser() user: User, @Param("resourceId") resourceId: string) {
    return this.resources.listPricing(user, resourceId);
  }

  @Post("resources/:resourceId/pricing")
  createPricing(
    @CurrentUser() user: User,
    @Param("resourceId") resourceId: string,
    @Body(new ZodPipe(createPricingRuleSchema)) body: ReturnType<typeof createPricingRuleSchema.parse>,
  ) {
    return this.resources.createPricing(user, resourceId, body);
  }

  @Patch("pricing/:ruleId")
  updatePricing(
    @CurrentUser() user: User,
    @Param("ruleId") ruleId: string,
    @Body(new ZodPipe(updatePricingRuleSchema)) body: ReturnType<typeof updatePricingRuleSchema.parse>,
  ) {
    return this.resources.updatePricing(user, ruleId, body);
  }

  @Delete("pricing/:ruleId")
  deletePricing(@CurrentUser() user: User, @Param("ruleId") ruleId: string) {
    return this.resources.deletePricing(user, ruleId);
  }
}
