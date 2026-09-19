import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AccessService } from "./access/access.service";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/auth.guard";
import { BookingsController } from "./bookings/bookings.controller";
import { BookingsService } from "./bookings/bookings.service";
import { CalendarController } from "./calendar/calendar.controller";
import { CalendarService } from "./calendar/calendar.service";
import { CustomerBookingsController } from "./bookings/customer-bookings.controller";
import { DiscoverController } from "./discover/discover.controller";
import { DiscoverService } from "./discover/discover.service";
import { CatalogController } from "./catalog/catalog.controller";
import { CatalogService } from "./catalog/catalog.service";
import { CustomersController } from "./customers/customers.controller";
import { CustomersService } from "./customers/customers.service";
import { InsightsController } from "./insights/insights.controller";
import { InsightsService } from "./insights/insights.service";
import { NotificationsService } from "./notifications/notifications.service";
import { PrismaModule } from "./prisma/prisma.module";
import { RecurringController } from "./recurring/recurring.controller";
import { RecurringService } from "./recurring/recurring.service";
import { ResourcesController } from "./resources/resources.controller";
import { ResourcesService } from "./resources/resources.service";
import { StorageController } from "./storage/storage.controller";
import { StorageService } from "./storage/storage.service";
import { VenuesController } from "./venues/venues.controller";
import { VenuesService } from "./venues/venues.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local", "../../.env"],
    }),
    PrismaModule,
  ],
  controllers: [
    AuthController,
    CatalogController,
    VenuesController,
    ResourcesController,
    BookingsController,
    CustomerBookingsController,
    CalendarController,
    CustomersController,
    InsightsController,
    StorageController,
    DiscoverController,
    RecurringController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    AccessService,
    CatalogService,
    VenuesService,
    ResourcesService,
    BookingsService,
    CalendarService,
    CustomersService,
    InsightsService,
    StorageService,
    NotificationsService,
    DiscoverService,
    RecurringService,
  ],
})
export class AppModule {}
