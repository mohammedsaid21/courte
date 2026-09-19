import { Controller, Get, Param, Query } from "@nestjs/common";
import { User } from "@prisma/client";
import { revenueQuerySchema } from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { InsightsService } from "./insights.service";

@Controller()
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get("venues/:venueId/dashboard")
  dashboard(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Query("date") date: string,
  ) {
    return this.insights.dashboard(user, venueId, date);
  }

  @Get("venues/:venueId/revenue")
  revenue(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Query(new ZodPipe(revenueQuerySchema)) query: ReturnType<typeof revenueQuerySchema.parse>,
  ) {
    return this.insights.revenue(user, venueId, query.from, query.to);
  }
}
