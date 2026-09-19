import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { User } from "@prisma/client";
import { customerInputSchema } from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { CustomersService } from "./customers.service";

@Controller()
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get("venues/:venueId/customers")
  list(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Query("q") q?: string,
    @Query("filter") filter?: string,
  ) {
    return this.customers.list(user, venueId, q, filter);
  }

  @Get("venues/:venueId/customers/lookup")
  lookup(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Query("phone") phone?: string,
  ) {
    return this.customers.lookup(user, venueId, phone ?? "");
  }

  @Post("venues/:venueId/customers")
  create(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Body(new ZodPipe(customerInputSchema)) body: ReturnType<typeof customerInputSchema.parse>,
  ) {
    return this.customers.create(user, venueId, body);
  }

  @Get("customers/:customerId")
  get(@CurrentUser() user: User, @Param("customerId") customerId: string) {
    return this.customers.get(user, customerId);
  }

  @Patch("customers/:customerId")
  update(
    @CurrentUser() user: User,
    @Param("customerId") customerId: string,
    @Body(new ZodPipe(customerInputSchema.partial()))
    body: Partial<ReturnType<typeof customerInputSchema.parse>>,
  ) {
    return this.customers.update(user, customerId, body);
  }
}
