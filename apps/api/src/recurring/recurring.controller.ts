import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { User } from "@prisma/client";
import { createRecurringSeriesSchema } from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { RecurringService } from "./recurring.service";

@Controller()
export class RecurringController {
  constructor(private readonly recurring: RecurringService) {}

  @Post("recurring/preview")
  preview(
    @CurrentUser() user: User,
    @Body(new ZodPipe(createRecurringSeriesSchema)) body: ReturnType<typeof createRecurringSeriesSchema.parse>,
  ) {
    return this.recurring.preview(user, body);
  }

  @Post("recurring")
  create(
    @CurrentUser() user: User,
    @Body(new ZodPipe(createRecurringSeriesSchema)) body: ReturnType<typeof createRecurringSeriesSchema.parse>,
  ) {
    return this.recurring.create(user, body);
  }

  @Get("venues/:venueId/recurring")
  list(@CurrentUser() user: User, @Param("venueId") venueId: string) {
    return this.recurring.list(user, venueId);
  }

  @Get("recurring/:seriesId")
  get(@CurrentUser() user: User, @Param("seriesId") seriesId: string) {
    return this.recurring.get(user, seriesId);
  }

  @Post("recurring/:seriesId/cancel")
  cancel(@CurrentUser() user: User, @Param("seriesId") seriesId: string) {
    return this.recurring.cancel(user, seriesId);
  }
}
