CREATE TYPE "AccountKind" AS ENUM ('OWNER', 'CUSTOMER');

ALTER TABLE "users"
  ADD COLUMN "whatsapp" TEXT,
  ADD COLUMN "account_kind" "AccountKind" NOT NULL DEFAULT 'CUSTOMER';

UPDATE "users"
SET "account_kind" = 'OWNER'
WHERE "id" IN (SELECT "user_id" FROM "venue_members");
