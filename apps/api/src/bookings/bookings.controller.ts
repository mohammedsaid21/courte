import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { User } from "@prisma/client";
import {
  addPaymentSchema,
  bookingsQuerySchema,
  createBookingSchema,
  quoteQuerySchema,
  updateBookingSchema,
} from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { BookingsService } from "./bookings.service";

@Controller()
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post("bookings")
  create(
    @CurrentUser() user: User,
    @Body(new ZodPipe(createBookingSchema)) body: ReturnType<typeof createBookingSchema.parse>,
  ) {
    return this.bookings.create(user, body);
  }

  @Get("venues/:venueId/bookings")
  list(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Query(new ZodPipe(bookingsQuerySchema)) query: ReturnType<typeof bookingsQuerySchema.parse>,
  ) {
    return this.bookings.list(user, venueId, query);
  }

  @Get("bookings/:bookingId")
  get(@CurrentUser() user: User, @Param("bookingId") bookingId: string) {
    return this.bookings.get(user, bookingId);
  }

  @Patch("bookings/:bookingId")
  update(
    @CurrentUser() user: User,
    @Param("bookingId") bookingId: string,
    @Body(new ZodPipe(updateBookingSchema)) body: ReturnType<typeof updateBookingSchema.parse>,
  ) {
    return this.bookings.update(user, bookingId, body);
  }

  @Post("bookings/:bookingId/payments")
  pay(
    @CurrentUser() user: User,
    @Param("bookingId") bookingId: string,
    @Body(new ZodPipe(addPaymentSchema)) body: ReturnType<typeof addPaymentSchema.parse>,
  ) {
    return this.bookings.addPayment(user, bookingId, body);
  }

  @Post("bookings/:bookingId/mark-paid")
  markPaid(@CurrentUser() user: User, @Param("bookingId") bookingId: string) {
    return this.bookings.markPaid(user, bookingId);
  }

  @Get("availability/quote")
  quote(
    @CurrentUser() user: User,
    @Query(new ZodPipe(quoteQuerySchema)) query: ReturnType<typeof quoteQuerySchema.parse>,
  ) {
    return this.bookings.quote(user, query.resourceId, query.startsAt, query.endsAt);
  }
}
