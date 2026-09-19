import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { User } from "@prisma/client";
import {
  createVenueSchema,
  onboardingSchema,
  updateVenueSchema,
} from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Public } from "../common/public.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { VenuesService } from "./venues.service";

@Controller("venues")
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.venues.listForUser(user);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodPipe(createVenueSchema)) body: ReturnType<typeof createVenueSchema.parse>,
  ) {
    return this.venues.create(user, body);
  }

  @Post("onboarding")
  onboard(
    @CurrentUser() user: User,
    @Body(new ZodPipe(onboardingSchema)) body: ReturnType<typeof onboardingSchema.parse>,
  ) {
    return this.venues.onboard(user, body);
  }

  @Public()
  @Get("public/:slug")
  publicBySlug(@Param("slug") slug: string) {
    return this.venues.publicBySlug(slug);
  }

  @Get(":venueId")
  get(@CurrentUser() user: User, @Param("venueId") venueId: string) {
    return this.venues.get(user, venueId);
  }

  @Patch(":venueId")
  update(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Body(new ZodPipe(updateVenueSchema)) body: ReturnType<typeof updateVenueSchema.parse>,
  ) {
    return this.venues.update(user, venueId, body);
  }
}
