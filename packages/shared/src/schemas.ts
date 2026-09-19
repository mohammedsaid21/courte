import { z } from "zod";
import {
  BOOKING_SOURCES,
  OWNER_BOOKING_SOURCES,
  BOOKING_STATUSES,
  EXCEPTION_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  WEST_BANK_CITIES,
} from "./constants";

const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm in 24-hour format");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createVenueSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000).optional().nullable(),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().min(6).max(30).optional().nullable(),
  address: z.string().trim().min(4).max(250),
  city: z.string().trim().min(2).max(80),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  venueTypeIds: z.array(z.string().uuid()).min(1),
  amenityIds: z.array(z.string().uuid()).default([]),
  photoUrls: z.array(z.string().url()).max(12).default([]),
});

export const bookingRulesSchema = z.object({
  defaultDurationMinutes: z.number().int().min(15).max(480),
  minAdvanceHours: z.number().int().min(0).max(24 * 30),
  maxAdvanceDays: z.number().int().min(1).max(365),
  cancellationHours: z.number().int().min(0).max(24 * 30),
  cancellationPolicy: z.string().trim().max(2000).optional().nullable(),
});

export const updateVenueSchema = createVenueSchema.partial().extend({
  isActive: z.boolean().optional(),
  slug: z.string().trim().min(2).max(80).optional(),
}).merge(bookingRulesSchema.partial());

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30).optional().nullable(),
  whatsapp: z.string().trim().min(6).max(30).optional().nullable(),
});

export const createResourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  venueTypeId: z.string().uuid().optional().nullable(),
  defaultDurationMinutes: z.number().int().min(15).max(480),
  slotIntervalMinutes: z.number().int().min(15).max(240),
  minDurationMinutes: z.number().int().min(15).max(480),
  maxDurationMinutes: z.number().int().min(15).max(720),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateResourceSchema = createResourceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const operatingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  opensAt: hhmm,
  closesAt: hhmm,
  isClosed: z.boolean(),
});

export const upsertOperatingHoursSchema = z.object({
  hours: z.array(operatingHourSchema).length(7),
});

export const createExceptionSchema = z.object({
  type: z.enum(EXCEPTION_TYPES),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  opensAt: hhmm.optional().nullable(),
  closesAt: hhmm.optional().nullable(),
  reason: z.string().trim().max(250).optional().nullable(),
});

export const createPricingRuleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  startsAt: hhmm,
  endsAt: hhmm,
  priceAmount: z.number().nonnegative(),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
});

export const updatePricingRuleSchema = createPricingRuleSchema.partial();

export const customerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().min(6).max(30).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const createBookingSchema = z
  .object({
    venueId: z.string().uuid(),
    resourceId: z.string().uuid(),
    customerId: z.string().uuid().optional(),
    customer: customerInputSchema.optional(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    priceAmount: z.number().nonnegative().optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
    paymentStatus: z.enum(PAYMENT_STATUSES).default("UNPAID"),
    paidAmount: z.number().nonnegative().optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    source: z.enum(OWNER_BOOKING_SOURCES).default("MANUAL"),
    status: z.enum(["CONFIRMED", "PENDING"]).default("CONFIRMED"),
    allowOutsideHours: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (!value.customerId && !value.customer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select an existing customer or enter a new one",
        path: ["customer"],
      });
    }
  });

export const bookingsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  resourceId: z.string().uuid().optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  source: z.enum(BOOKING_SOURCES).optional(),
  customerId: z.string().uuid().optional(),
  q: z.string().trim().max(80).optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  startsAt: z.string().datetime({ offset: true }).optional(),
  endsAt: z.string().datetime({ offset: true }).optional(),
  priceAmount: z.number().nonnegative().optional(),
  allowOutsideHours: z.boolean().optional(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(PAYMENT_METHODS),
  notes: z.string().trim().max(250).optional().nullable(),
});

export const availabilityQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  resourceId: z.string().uuid().optional(),
});

export const quoteQuerySchema = z.object({
  resourceId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
});

export const revenueQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createCustomerBookingSchema = z.object({
  venueId: z.string().uuid(),
  resourceId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const publicAvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.coerce.number().int().min(15).max(720).optional(),
});

export const discoverQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  typeId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: hhmm.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(200).optional(),
  sort: z.enum(["name", "distance", "price"]).optional(),
});

export const citySchema = z.enum(WEST_BANK_CITIES);

export const onboardingSchema = z.object({
  venue: createVenueSchema,
  resource: createResourceSchema,
  hours: z.array(operatingHourSchema).length(7),
  defaultPrice: z.number().nonnegative(),
  peakPrice: z.number().nonnegative().optional(),
  peakStartsAt: hhmm.optional(),
});

export const createRecurringSeriesSchema = z
  .object({
    venueId: z.string().uuid(),
    resourceId: z.string().uuid(),
    customerId: z.string().uuid().optional(),
    customer: customerInputSchema.optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    startTime: hhmm,
    durationMinutes: z.number().int().min(15).max(720),
    priceAmount: z.number().nonnegative().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source: z.enum(OWNER_BOOKING_SOURCES).default("MANUAL"),
    paymentStatus: z.enum(PAYMENT_STATUSES).default("UNPAID"),
    notes: z.string().trim().max(2000).optional().nullable(),
    skipConflicts: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (!value.customerId && !value.customer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select an existing customer or enter a new one",
        path: ["customer"],
      });
    }
    if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after start date",
        path: ["endDate"],
      });
    }
  });

export const previewRecurringSeriesSchema = createRecurringSeriesSchema;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type OperatingHourInput = z.infer<typeof operatingHourSchema>;
export type CreateExceptionInput = z.infer<typeof createExceptionSchema>;
export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;
export type CustomerInput = z.infer<typeof customerInputSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type BookingSourceValue = (typeof BOOKING_SOURCES)[number];
export type BookingsQuery = z.infer<typeof bookingsQuerySchema>;
export type BookingRulesInput = z.infer<typeof bookingRulesSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCustomerBookingInput = z.infer<typeof createCustomerBookingSchema>;
export type DiscoverQuery = z.infer<typeof discoverQuerySchema>;
export type PublicAvailabilityQuery = z.infer<typeof publicAvailabilityQuerySchema>;
export type CreateRecurringSeriesInput = z.infer<typeof createRecurringSeriesSchema>;
