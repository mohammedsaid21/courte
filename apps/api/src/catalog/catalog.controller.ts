import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/public.decorator";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get("venue-types")
  venueTypes() {
    return this.catalog.venueTypes();
  }

  @Public()
  @Get("amenities")
  amenities() {
    return this.catalog.amenities();
  }
}
