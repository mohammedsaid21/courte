ALTER TABLE "venues"
  ADD COLUMN "default_duration_minutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "min_advance_hours" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "max_advance_days" INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN "cancellation_hours" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "cancellation_policy" TEXT;

ALTER TABLE "bookings"
  ADD COLUMN "updated_by_user_id" UUID;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
