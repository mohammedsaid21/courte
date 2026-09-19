import { Controller, Get, Query } from "@nestjs/common";
import { discoverQuerySchema } from "@courte/shared";
import { Public } from "../common/public.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { DiscoverService } from "./discover.service";

@Controller("discover")
export class DiscoverController {
  constructor(private readonly discover: DiscoverService) {}

  @Public()
  @Get("venues")
  search(@Query(new ZodPipe(discoverQuerySchema)) query: ReturnType<typeof discoverQuerySchema.parse>) {
    return this.discover.search(query);
  }
}
