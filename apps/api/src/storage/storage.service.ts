import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { User } from "@prisma/client";
import { AccessService } from "../access/access.service";
import { uniqueSlug } from "../common/util";

const DEFAULT_BUCKET = "venue-media";
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class StorageService {
  private supabase: ReturnType<typeof createClient> | null = null;
  private ensureBucketPromise: Promise<void> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly access: AccessService,
  ) {}

  async signedUpload(user: User, venueId: string, contentType: string) {
    await this.access.assertVenueRole(user, venueId, ["OWNER", "MANAGER"]);
    const supabase = this.getClient();
    const bucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET")?.trim() || DEFAULT_BUCKET;
    await this.ensureBucket(supabase, bucket);
    const ext = IMAGE_EXT[contentType] ?? "jpg";
    const path = `${venueId}/${uniqueSlug("photo")}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      throw new InternalServerErrorException(error?.message ?? "Could not create upload URL");
    }
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return {
      path,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl,
    };
  }

  async uploadPhoto(user: User, venueId: string, bytes: Buffer, contentType: string) {
    await this.access.assertVenueRole(user, venueId, ["OWNER", "MANAGER"]);
    const supabase = this.getClient();
    const bucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET")?.trim() || DEFAULT_BUCKET;
    await this.ensureBucket(supabase, bucket);
    const ext = IMAGE_EXT[contentType] ?? "jpg";
    const path = `${venueId}/${uniqueSlug("photo")}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return { path, publicUrl };
  }

  private getClient() {
    if (this.supabase) return this.supabase;
    const url =
      this.config.get<string>("SUPABASE_URL") ?? this.config.get<string>("NEXT_PUBLIC_SUPABASE_URL");
    const key = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      throw new InternalServerErrorException("Storage is not configured");
    }
    this.supabase = createClient(url, key);
    return this.supabase;
  }

  private ensureBucket(supabase: ReturnType<typeof createClient>, bucket: string) {
    if (!this.ensureBucketPromise) {
      this.ensureBucketPromise = this.createBucketIfMissing(supabase, bucket).catch((error) => {
        this.ensureBucketPromise = null;
        throw error;
      });
    }
    return this.ensureBucketPromise;
  }

  private async createBucketIfMissing(supabase: ReturnType<typeof createClient>, bucket: string) {
    const existing = await supabase.storage.getBucket(bucket);
    if (existing.data) return;
    const created = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "8MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (created.error && !/already exists/i.test(created.error.message)) {
      throw new InternalServerErrorException(created.error.message);
    }
  }
}
