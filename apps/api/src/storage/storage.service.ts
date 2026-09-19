import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { User } from "@prisma/client";
import { AccessService } from "../access/access.service";
import { uniqueSlug } from "../common/util";

@Injectable()
export class StorageService {
  private supabase: ReturnType<typeof createClient> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly access: AccessService,
  ) {}

  async signedUpload(user: User, venueId: string, contentType: string) {
    await this.access.assertVenueRole(user, venueId, ["OWNER", "MANAGER"]);
    const supabase = this.getClient();
    const bucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET") ?? "venue-media";
    const ext = contentType.split("/")[1] ?? "jpg";
    const path = `${venueId}/${uniqueSlug("photo")}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      throw error ?? new Error("Could not create upload URL");
    }
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return {
      path,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl,
    };
  }

  private getClient() {
    if (this.supabase) return this.supabase;
    const url =
      this.config.get<string>("SUPABASE_URL") ?? this.config.getOrThrow<string>("NEXT_PUBLIC_SUPABASE_URL");
    const key = this.config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY");
    this.supabase = createClient(url, key);
    return this.supabase;
  }
}
