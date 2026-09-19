-- CreateSchema
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'PLATFORM_ADMIN');
CREATE TYPE "VenueMemberRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
CREATE TYPE "BookingSource" AS ENUM ('MANUAL', 'CUSTOMER', 'ADMIN');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'PARTIAL');
CREATE TYPE "ExceptionType" AS ENUM ('CLOSED', 'SPECIAL_HOURS', 'BLOCKED');
CREATE TYPE "NotificationEvent" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER');
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'IN_APP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supabase_auth_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "platform_role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_supabase_auth_id_key" ON "users"("supabase_auth_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "venue_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "venue_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "venue_types_slug_key" ON "venue_types"("slug");

CREATE TABLE "amenities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "amenities_slug_key" ON "amenities"("slug");

CREATE TABLE "venues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "cover_image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Hebron',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "venues_slug_key" ON "venues"("slug");
CREATE INDEX "venues_city_idx" ON "venues"("city");
CREATE INDEX "venues_is_active_idx" ON "venues"("is_active");

CREATE TABLE "venue_type_assignments" (
    "venue_id" UUID NOT NULL,
    "venue_type_id" UUID NOT NULL,
    CONSTRAINT "venue_type_assignments_pkey" PRIMARY KEY ("venue_id","venue_type_id")
);

CREATE TABLE "venue_amenities" (
    "venue_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,
    CONSTRAINT "venue_amenities_pkey" PRIMARY KEY ("venue_id","amenity_id")
);

CREATE TABLE "venue_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venue_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "venue_photos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "venue_photos_venue_id_idx" ON "venue_photos"("venue_id");

CREATE TABLE "venue_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venue_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "VenueMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "venue_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "venue_members_venue_id_user_id_key" ON "venue_members"("venue_id","user_id");
CREATE INDEX "venue_members_user_id_idx" ON "venue_members"("user_id");

CREATE TABLE "venue_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venue_id" UUID NOT NULL,
    "venue_type_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "default_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "min_duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_duration_minutes" INTEGER NOT NULL DEFAULT 180,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "venue_resources_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "venue_resources_venue_id_is_active_idx" ON "venue_resources"("venue_id","is_active");

CREATE TABLE "operating_hours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "opens_at" TEXT NOT NULL,
    "closes_at" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "operating_hours_resource_id_day_of_week_key" ON "operating_hours"("resource_id","day_of_week");

CREATE TABLE "availability_exceptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource_id" UUID NOT NULL,
    "type" "ExceptionType" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "opens_at" TEXT,
    "closes_at" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "availability_exceptions_resource_id_starts_at_ends_at_idx" ON "availability_exceptions"("resource_id","starts_at","ends_at");

CREATE TABLE "pricing_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "day_of_week" INTEGER,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "price_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pricing_rules_resource_id_idx" ON "pricing_rules"("resource_id");

CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venue_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customers_venue_id_phone_key" ON "customers"("venue_id","phone");
CREATE INDEX "customers_venue_id_name_idx" ON "customers"("venue_id","name");

CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venue_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "source" "BookingSource" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "price_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "notes" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bookings_resource_id_starts_at_ends_at_idx" ON "bookings"("resource_id","starts_at","ends_at");
CREATE INDEX "bookings_venue_id_starts_at_idx" ON "bookings"("venue_id","starts_at");
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");
CREATE INDEX "bookings_status_starts_at_idx" ON "bookings"("status","starts_at");

CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event" "NotificationEvent" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "booking_id" UUID,
    "user_id" UUID,
    "payload" JSONB NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_status_scheduled_at_idx" ON "notifications"("status","scheduled_at");

ALTER TABLE "venue_type_assignments" ADD CONSTRAINT "venue_type_assignments_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_type_assignments" ADD CONSTRAINT "venue_type_assignments_venue_type_id_fkey" FOREIGN KEY ("venue_type_id") REFERENCES "venue_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "venue_amenities" ADD CONSTRAINT "venue_amenities_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_amenities" ADD CONSTRAINT "venue_amenities_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "venue_photos" ADD CONSTRAINT "venue_photos_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_members" ADD CONSTRAINT "venue_members_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_members" ADD CONSTRAINT "venue_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_resources" ADD CONSTRAINT "venue_resources_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_resources" ADD CONSTRAINT "venue_resources_venue_type_id_fkey" FOREIGN KEY ("venue_type_id") REFERENCES "venue_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "venue_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "venue_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "venue_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "venue_resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    resource_id WITH =,
    tsrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status IN ('CONFIRMED', 'PENDING', 'COMPLETED'));
