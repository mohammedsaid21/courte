import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";
import { z } from "zod";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { StorageService } from "./storage.service";

const uploadSchema = z.object({
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
});

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

  @Post("venues/:venueId/photos")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: User,
    @Param("venueId") venueId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException("Missing image file");
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Use JPG, PNG, or WebP images");
    }
    return this.storage.uploadPhoto(user, venueId, file.buffer, file.mimetype);
  }
}
