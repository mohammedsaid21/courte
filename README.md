# Courte

Venue owner dashboard and booking API for sports facilities in the West Bank.

This phase ships the **Owner Dashboard** and the **NestJS booking engine**. The customer marketplace and admin panel are not built yet, but the API already treats customer and admin bookings as first-class sources on the same availability rules.

```
Owner Dashboard (Next.js)  →  NestJS API  →  PostgreSQL (Supabase)
                                      ↳  Supabase Auth
                                      ↳  Supabase Storage
```

Business logic lives in the API: availability, overlap protection, pricing, revenue, authz. Next.js only talks to the API.

## What owners can do

- Sign in and set up a venue (football, padel, gym, pool, and other types)
- Configure courts/fields as separate bookable resources
- Set opening hours, holidays, and blocked times
- Set day vs evening prices
- See a day/week calendar of free, booked, and blocked slots
- Write in a walk-in booking without leaving the notebook workflow
- Keep customer records and payment status
- See today’s occupancy and a simple revenue report
- Preview the future public venue page at `/venues/{slug}`

Manual bookings and future customer bookings use the same engine. Confirmed overlapping bookings are rejected in application code **and** by a Postgres exclusion constraint.

## Setup

1. Create a Supabase project (West Bank venues, `Asia/Hebron`).
2. Enable Email auth.
3. Create a public storage bucket named `venue-media`.
4. Copy env files:

```
apps/api/.env          from apps/api/.env.example
apps/owner/.env.local  from apps/owner/.env.example
```

Use the Supabase **database password**, **JWT secret**, **anon key**, and **service role key**.

`DATABASE_URL` should be the pooled URI. `DIRECT_URL` should be the direct `db.<project>.supabase.co:5432` URI (required for migrations).

5. Install and migrate:

```
npm install
npm run build:shared
npm run db:generate
npm run db:migrate
npm run db:seed
```

If `btree_gist` or the overlap constraint fails on the pooler, run `apps/api/prisma/sql/overlap_constraint.sql` in the Supabase SQL editor against the direct database.

6. Run the apps:

```
npm run dev:api
npm run dev:owner
```

Owner dashboard: http://localhost:3000  
API: http://localhost:3001/api

## Architecture notes

- Roles on `venue_members`: `OWNER`, `MANAGER`, `STAFF`. Only Owner is used in the UI; the others are ready.
- `bookings.source`: `MANUAL` | `CUSTOMER` | `ADMIN`.
- Notifications are queued (`BOOKING_CREATED`, `CONFIRMED`, `CANCELLED`, `REMINDER`) and not sent yet. WhatsApp/SMS can plug into `NotificationsService` later.
- Customer booking endpoints can be added beside `BookingsService.create(..., "CUSTOMER")` without changing availability rules.

## Tests

```
npm test
npm run typecheck
npm run lint
```
