-- AlterEnum
ALTER TYPE "BookingSource" ADD VALUE IF NOT EXISTS 'WHATSAPP';
ALTER TYPE "BookingSource" ADD VALUE IF NOT EXISTS 'PHONE';
ALTER TYPE "BookingSource" ADD VALUE IF NOT EXISTS 'WALK_IN';

-- CreateEnum
CREATE TYPE "RecurringSeriesStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "recurring_series_id" UUID;

-- CreateTable
CREATE TABLE "recurring_series" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venue_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "days_of_week" INTEGER[],
    "start_time" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "price_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "source" "BookingSource" NOT NULL DEFAULT 'MANUAL',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "status" "RecurringSeriesStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "recurring_series_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recurring_series_venue_id_status_idx" ON "recurring_series"("venue_id", "status");
CREATE INDEX "recurring_series_resource_id_idx" ON "recurring_series"("resource_id");
CREATE INDEX "bookings_recurring_series_id_idx" ON "bookings"("recurring_series_id");

ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "venue_resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_recurring_series_id_fkey" FOREIGN KEY ("recurring_series_id") REFERENCES "recurring_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
