# Courte — خريطة المشروع

مرجع سريع للوكيل والمطور: **أين يعيش الكود** و**ماذا يغيّر** عند أي طلب.

## Monorepo

| الجزء | المسار | التقنية | المنفذ (dev) |
|--------|--------|---------|--------------|
| **Backend** | `apps/api` | NestJS + Prisma + PostgreSQL | `3001` (`/api`) |
| **Owner app** | `apps/owner` | Next.js 15 — أصحاب الملاعب | `3000` |
| **Web app** | `apps/web` | Next.js 15 — اللاعبين والحجز | `3002` |
| **Shared** | `packages/shared` | Zod schemas, constants, pricing helpers | يُبنى قبل الـ API والفرونت |

الحزمة المشتركة: `@courte/shared` — **أي حقل API جديد يبدأ هنا** (`schemas.ts`, `court.ts`, `constants.ts`).

```bash
pnpm dev              # shared + api + owner + web
pnpm dev:api          # API فقط
pnpm dev:owner        # owner
pnpm dev:web          # web
pnpm typecheck        # shared + api + owner + web
```

## ماذا يفعل كل تطبيق؟

### `apps/api` (Nest)

- **Auth**: Supabase JWT → `auth.guard.ts` → مستخدم Prisma (`User.accountKind`: `OWNER` | `CUSTOMER`).
- **Venues / resources / pricing / hours / exceptions**: `venues/`, `resources/`.
- **Bookings + calendar + availability engine**: `bookings/`, `calendar/`, `booking-engine/`.
- **Customer bookings**: `bookings/customer-bookings.controller.ts` (`/customer/bookings`).
- **Recurring**: `recurring/`.
- **Discover (public)**: `discover/`.
- **Access rules**: `access/access.service.ts`
  - `assertOwnerAccount` — عمليات إنشاء ملعب / بوابة المالك.
  - `assertPlayerAccount` — حجوزات اللاعب.
  - `assertVenueRole` — إدارة ملعب (يتطلب حساب OWNER، ما عدا `PLATFORM_ADMIN`).

Schema DB: `apps/api/prisma/schema.prisma`.

### `apps/owner` (Next)

- لوحة المالك: حجوزات، جدول، عملاء، إعدادات ملعب، أسعار **لكل مساحة (resource)**.
- Onboarding: `components/onboarding-wizard.tsx` + `/onboarding/*`.
- Auth: Supabase؛ منع حساب اللاعب → `lib/portal-access.ts`, `/owner-only`.
- API client: `src/lib/api.ts` → `NEXT_PUBLIC_API_URL`.

### `apps/web` (Next)

- اكتشاف الملاعب، صفحة ملعب، حجز أونلاين، سلة حجوزات، `/account/*`.
- Auth: Supabase؛ منع حساب المالك → `lib/portal-access.ts`, `/player-only`.
- API: `src/lib/api/*` (booking, customer, venues, …).

## فصل الحسابات

| نوع الحساب | البوابة | Supabase metadata |
|------------|---------|-------------------|
| صاحب ملعب | `apps/owner` | `account_kind: "OWNER"` |
| لاعب / زبون | `apps/web` | `account_kind: "CUSTOMER"` |

لا تخلط البوابات: تحقق في **login + provider/gate + API** عند إضافة مسارات محمية.

## نمط التعديل (مهم)

1. **Schema/DTO**: `packages/shared/src/schemas.ts` (+ types/export في `index.ts` إن لزم).
2. **Backend**: service + controller في `apps/api/src/...`.
3. **Owner UI**: إن كان يخص المالك.
4. **Web UI**: إن كان يخص اللاعب أو العرض العام.
5. **`pnpm run typecheck`** قبل إنهاء المهمة.

### أمثلة سريعة

| الميزة | shared | api | owner | web |
|--------|--------|-----|-------|-----|
| سعر لكل ملعب | `createResourceSchema` | `venues.service` createResource | resources/pricing | booking-panel / venue profile |
| إلغاء حجز لاعب | cancel schemas | customer-bookings | — | account/bookings |
| onboarding | onboardingSchema | venues onboard | onboarding-wizard | — |

## ملفات متكررة

- **Pricing tiers**: `packages/shared/src/court.ts` → `buildTierPricingRules`.
- **Owner venue context**: `apps/owner/src/components/venue-provider.tsx`.
- **Web session**: `apps/web/src/components/session-provider.tsx`.
- **Public venue**: `GET /venues/public/:slug`.

## ما لا تفعله

- لا تكرر Zod في API أو الفرونت — استخدم `@courte/shared`.
- لا تغيّر سلوك بوابة واحدة فقط إذا الطلب يمس الحجز/الحسابات (تحقق الطبقات الثلاث).
- لا commit إلا إذا طلب المستخدم صراحة.

---

*آخر تحديث: يُحدَّث يدوياً عند تغيير هيكل المشروع.*
