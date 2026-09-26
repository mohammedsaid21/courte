import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { User } from "@prisma/client";
import { createCustomerBookingSchema, createCustomerBookingsBatchSchema } from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { BookingsService } from "../bookings/bookings.service";

@Controller("customer/bookings")
export class CustomerBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.bookings.listMine(user);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodPipe(createCustomerBookingSchema))
    body: ReturnType<typeof createCustomerBookingSchema.parse>,
  ) {
    return this.bookings.createAsCustomer(user, body);
  }

  @Post("batch")
  createBatch(
    @CurrentUser() user: User,
    @Body(new ZodPipe(createCustomerBookingsBatchSchema))
    body: ReturnType<typeof createCustomerBookingsBatchSchema.parse>,
  ) {
    return this.bookings.createManyAsCustomer(user, body);
  }

  @Get(":bookingId")
  get(@CurrentUser() user: User, @Param("bookingId") bookingId: string) {
    return this.bookings.getMine(user, bookingId);
  }

  @Post(":bookingId/cancel")
  cancel(@CurrentUser() user: User, @Param("bookingId") bookingId: string) {
    return this.bookings.cancelMine(user, bookingId);
  }
}
