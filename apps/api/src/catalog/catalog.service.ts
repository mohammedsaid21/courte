import { Injectable } from "@nestjs/common";
import { Amenity, VenueType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const CATALOG_TTL_MS = 5 * 60_000;

type Cached<T> = { value: T; expiresAt: number };

@Injectable()
export class CatalogService {
  private venueTypesCache: Cached<VenueType[]> | null = null;
  private amenitiesCache: Cached<Amenity[]> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async venueTypes() {
    if (this.venueTypesCache && this.venueTypesCache.expiresAt > Date.now()) {
      return this.venueTypesCache.value;
    }
    const value = await this.prisma.venueType.findMany({ orderBy: { sortOrder: "asc" } });
    this.venueTypesCache = { value, expiresAt: Date.now() + CATALOG_TTL_MS };
    return value;
  }

  async amenities() {
    if (this.amenitiesCache && this.amenitiesCache.expiresAt > Date.now()) {
      return this.amenitiesCache.value;
    }
    const value = await this.prisma.amenity.findMany({ orderBy: { sortOrder: "asc" } });
    this.amenitiesCache = { value, expiresAt: Date.now() + CATALOG_TTL_MS };
    return value;
  }
}
