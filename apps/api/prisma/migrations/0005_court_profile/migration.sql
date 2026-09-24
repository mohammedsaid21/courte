-- CreateEnum
CREATE TYPE "CourtSize" AS ENUM ('FIVE_V_FIVE', 'SEVEN_V_SEVEN', 'ELEVEN_V_ELEVEN');

-- CreateEnum
CREATE TYPE "CourtSurface" AS ENUM ('NATURAL_GRASS', 'ARTIFICIAL_GRASS');

-- CreateEnum
CREATE TYPE "CourtSetting" AS ENUM ('INDOOR', 'OUTDOOR');

-- AlterTable
ALTER TABLE "venues"
  ADD COLUMN "name_en" TEXT,
  ADD COLUMN "description_en" TEXT,
  ADD COLUMN "address_en" TEXT;

-- AlterTable
ALTER TABLE "venue_resources"
  ADD COLUMN "name_en" TEXT,
  ADD COLUMN "description_en" TEXT,
  ADD COLUMN "size" "CourtSize",
  ADD COLUMN "surface" "CourtSurface",
  ADD COLUMN "setting" "CourtSetting",
  ADD COLUMN "has_lights" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "venue_resources_size_idx" ON "venue_resources"("size");
