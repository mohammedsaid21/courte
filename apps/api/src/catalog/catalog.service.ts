import { Injectable } from "@nestjs/common";
import { Amenity, VenueType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { DEFAULT_AMENITIES, DEFAULT_VENUE_TYPES } from "./defaults";

const CATALOG_TTL_MS = 5 * 60_000;

type Cached<T> = { value: T; expiresAt: number };

@Injectable()
export class CatalogService {
  private venueTypesCache: Cached<VenueType[]> | null = null;
  private amenitiesCache: Cached<Amenity[]> | null = null;
  private ensurePromise: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async venueTypes() {
    await this.ensureDefaults();
    if (this.venueTypesCache && this.venueTypesCache.expiresAt > Date.now()) {
      return this.venueTypesCache.value;
    }
    const value = await this.prisma.venueType.findMany({ orderBy: { sortOrder: "asc" } });
    this.venueTypesCache = { value, expiresAt: Date.now() + CATALOG_TTL_MS };
    return value;
  }

  async amenities() {
    await this.ensureDefaults();
    if (this.amenitiesCache && this.amenitiesCache.expiresAt > Date.now()) {
      return this.amenitiesCache.value;
    }
    const value = await this.prisma.amenity.findMany({ orderBy: { sortOrder: "asc" } });
    this.amenitiesCache = { value, expiresAt: Date.now() + CATALOG_TTL_MS };
    return value;
  }

  private ensureDefaults() {
    if (!this.ensurePromise) {
      this.ensurePromise = this.seedMissing();
    }
    return this.ensurePromise;
  }

  private async seedMissing() {
    for (const type of DEFAULT_VENUE_TYPES) {
      await this.prisma.venueType.upsert({
        where: { slug: type.slug },
        update: { name: type.name, nameAr: type.nameAr, sortOrder: type.sortOrder },
        create: type,
      });
    }
    for (const amenity of DEFAULT_AMENITIES) {
      await this.prisma.amenity.upsert({
        where: { slug: amenity.slug },
        update: { name: amenity.name, nameAr: amenity.nameAr, sortOrder: amenity.sortOrder },
        create: amenity,
      });
    }
    this.venueTypesCache = null;
    this.amenitiesCache = null;
  }
}
