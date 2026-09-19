import { Body, Controller, Param, Post } from "@nestjs/common";
import { User } from "@prisma/client";
import { z } from "zod";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { StorageService } from "./storage.service";

const uploadSchema = z.object({
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
});

@Controller()
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post("venues/:venueId/uploads")
  upload(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @Body(new ZodPipe(uploadSchema)) body: z.infer<typeof uploadSchema>,
  ) {
    return this.storage.signedUpload(user, venueId, body.contentType);
  }
}
