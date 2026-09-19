import { Controller, Get, Param, Query } from "@nestjs/common";
import { User } from "@prisma/client";
import { availabilityQuerySchema, publicAvailabilityQuerySchema } from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { Public } from "../common/public.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { CalendarService } from "./calendar.service";

@Controller()
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get("venues/:venueId/calendar")
  get(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Query(new ZodPipe(availabilityQuerySchema))
    query: ReturnType<typeof availabilityQuerySchema.parse>,
  ) {
    return this.calendar.get(user, venueId, query.from, query.to, query.resourceId);
  }

  @Public()
  @Get("venues/:venueId/resources/:resourceId/availability")
  publicAvailability(
    @Param("venueId") venueId: string,
    @Param("resourceId") resourceId: string,
    @Query(new ZodPipe(publicAvailabilityQuerySchema))
    query: ReturnType<typeof publicAvailabilityQuerySchema.parse>,
  ) {
    return this.calendar.publicAvailability(venueId, resourceId, query.date, query.durationMinutes);
  }
}
