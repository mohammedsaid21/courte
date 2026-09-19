import { fromZonedISO, rangesOverlap } from "./time";
import { evaluateAvailability } from "./availability";
import { quotePrice } from "./pricing";
import { generateSlots } from "./slots";
import { summarizeRevenue } from "./revenue";
import { windowForDate } from "./hours";
import { distanceKm, roundKm } from "./geo";
import { evaluateCancellation } from "./cancel";

const tz = "Asia/Hebron";

const weekdayHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  opensAt: "08:00",
  closesAt: "23:00",
  isClosed: false,
}));

const rules = [
  {
    name: "Day",
    dayOfWeek: null,
    startsAt: "08:00",
    endsAt: "16:00",
    priceAmount: 30,
    isDefault: false,
    sortOrder: 0,
  },
  {
    name: "Evening",
    dayOfWeek: null,
    startsAt: "16:00",
    endsAt: "00:00",
    priceAmount: 40,
    isDefault: false,
    sortOrder: 1,
  },
];

describe("availability engine", () => {
  it("allows a confirmed booking inside operating hours", () => {
    const start = fromZonedISO("2026-09-16", "10:00", tz);
    const end = fromZonedISO("2026-09-16", "11:00", tz);
    const result = evaluateAvailability({
      start,
      end,
      timeZone: tz,
      resourceActive: true,
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      hours: weekdayHours,
      exceptions: [],
      overlappingBookings: [],
      rules,
    });
    expect(result.available).toBe(true);
    expect(result.priceAmount).toBe(30);
  });

  it("rejects overlapping bookings", () => {
    const start = fromZonedISO("2026-09-16", "10:00", tz);
    const end = fromZonedISO("2026-09-16", "11:00", tz);
    const result = evaluateAvailability({
      start,
      end,
      timeZone: tz,
      resourceActive: true,
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      hours: weekdayHours,
      exceptions: [],
      overlappingBookings: [{ id: "existing" }],
      rules,
    });
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/already booked/i);
  });

  it("rejects blocked periods", () => {
    const start = fromZonedISO("2026-09-16", "18:00", tz);
    const end = fromZonedISO("2026-09-16", "19:00", tz);
    const result = evaluateAvailability({
      start,
      end,
      timeZone: tz,
      resourceActive: true,
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      hours: weekdayHours,
      exceptions: [
        {
          type: "BLOCKED",
          startsAt: fromZonedISO("2026-09-16", "17:00", tz),
          endsAt: fromZonedISO("2026-09-16", "20:00", tz),
        },
      ],
      overlappingBookings: [],
      rules,
    });
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/blocked/i);
  });

  it("rejects times outside operating hours unless overridden", () => {
    const start = fromZonedISO("2026-09-16", "06:00", tz);
    const end = fromZonedISO("2026-09-16", "07:00", tz);
    const denied = evaluateAvailability({
      start,
      end,
      timeZone: tz,
      resourceActive: true,
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      hours: weekdayHours,
      exceptions: [],
      overlappingBookings: [],
      rules,
    });
    expect(denied.available).toBe(false);
    const allowed = evaluateAvailability({
      start,
      end,
      timeZone: tz,
      resourceActive: true,
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      hours: weekdayHours,
      exceptions: [],
      overlappingBookings: [],
      rules,
      allowOutsideHours: true,
    });
    expect(allowed.available).toBe(true);
  });
});

describe("pricing", () => {
  it("uses evening price after 16:00", () => {
    const quote = quotePrice({
      start: fromZonedISO("2026-09-16", "17:00", tz),
      end: fromZonedISO("2026-09-16", "18:00", tz),
      timeZone: tz,
      rules,
    });
    expect(quote.amount).toBe(40);
    expect(quote.ruleName).toBe("Evening");
  });
});

describe("slots", () => {
  it("marks booked slots unavailable", () => {
    const window = windowForDate({
      date: "2026-09-16",
      timeZone: tz,
      hours: weekdayHours,
      exceptions: [],
    });
    const slots = generateSlots({
      timeZone: tz,
      window,
      intervalMinutes: 60,
      durationMinutes: 60,
      bookings: [
        {
          start: fromZonedISO("2026-09-16", "10:00", tz),
          end: fromZonedISO("2026-09-16", "11:00", tz),
        },
      ],
      blocks: [],
      rules,
    });
    const ten = slots.find(
      (slot) => slot.start.getTime() === fromZonedISO("2026-09-16", "10:00", tz).getTime(),
    );
    const eleven = slots.find(
      (slot) => slot.start.getTime() === fromZonedISO("2026-09-16", "11:00", tz).getTime(),
    );
    expect(ten?.status).toBe("booked");
    expect(eleven?.status).toBe("available");
  });
});

describe("overlap ranges", () => {
  const existingStart = fromZonedISO("2026-09-16", "09:00", tz);
  const existingEnd = fromZonedISO("2026-09-16", "10:00", tz);

  it("rejects the exact same time", () => {
    expect(
      rangesOverlap(
        existingStart,
        existingEnd,
        fromZonedISO("2026-09-16", "09:00", tz),
        fromZonedISO("2026-09-16", "10:00", tz),
      ),
    ).toBe(true);
  });

  it("rejects a booking that starts during an existing booking", () => {
    expect(
      rangesOverlap(
        existingStart,
        existingEnd,
        fromZonedISO("2026-09-16", "09:30", tz),
        fromZonedISO("2026-09-16", "10:30", tz),
      ),
    ).toBe(true);
  });

  it("rejects a booking that ends during an existing booking", () => {
    expect(
      rangesOverlap(
        existingStart,
        existingEnd,
        fromZonedISO("2026-09-16", "08:30", tz),
        fromZonedISO("2026-09-16", "09:30", tz),
      ),
    ).toBe(true);
  });

  it("rejects a booking that completely contains an existing booking", () => {
    expect(
      rangesOverlap(
        existingStart,
        existingEnd,
        fromZonedISO("2026-09-16", "08:00", tz),
        fromZonedISO("2026-09-16", "11:00", tz),
      ),
    ).toBe(true);
  });

  it("rejects a booking completely contained by an existing booking", () => {
    expect(
      rangesOverlap(
        fromZonedISO("2026-09-16", "08:00", tz),
        fromZonedISO("2026-09-16", "11:00", tz),
        fromZonedISO("2026-09-16", "09:00", tz),
        fromZonedISO("2026-09-16", "10:00", tz),
      ),
    ).toBe(true);
  });

  it("allows adjacent bookings", () => {
    expect(
      rangesOverlap(
        existingStart,
        existingEnd,
        fromZonedISO("2026-09-16", "10:00", tz),
        fromZonedISO("2026-09-16", "11:00", tz),
      ),
    ).toBe(false);
  });
});

describe("advance booking window", () => {
  it("rejects bookings inside the minimum advance window", () => {
    const now = fromZonedISO("2026-09-16", "10:00", tz);
    const start = fromZonedISO("2026-09-16", "11:00", tz);
    const result = evaluateAvailability({
      start,
      end: fromZonedISO("2026-09-16", "12:00", tz),
      timeZone: tz,
      resourceActive: true,
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      hours: weekdayHours,
      exceptions: [],
      overlappingBookings: [],
      rules,
      now,
      minAdvanceHours: 3,
      maxAdvanceDays: 30,
      enforceAdvanceWindow: true,
    });
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/hours in advance/i);
  });

  it("does not enforce the window for owner walk-in bookings", () => {
    const now = fromZonedISO("2026-09-16", "10:00", tz);
    const result = evaluateAvailability({
      start: fromZonedISO("2026-09-16", "11:00", tz),
      end: fromZonedISO("2026-09-16", "12:00", tz),
      timeZone: tz,
      resourceActive: true,
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      hours: weekdayHours,
      exceptions: [],
      overlappingBookings: [],
      rules,
      now,
      minAdvanceHours: 3,
      maxAdvanceDays: 30,
      enforceAdvanceWindow: false,
    });
    expect(result.available).toBe(true);
  });
});

describe("revenue", () => {
  it("ignores cancelled bookings and caps paid amount", () => {
    const summary = summarizeRevenue([
      {
        status: "CONFIRMED",
        priceAmount: 40,
        paidAmount: 40,
        startsAt: fromZonedISO("2026-09-16", "10:00", tz),
        endsAt: fromZonedISO("2026-09-16", "11:00", tz),
      },
      {
        status: "CONFIRMED",
        priceAmount: 30,
        paidAmount: 10,
        startsAt: fromZonedISO("2026-09-16", "11:00", tz),
        endsAt: fromZonedISO("2026-09-16", "12:00", tz),
      },
      {
        status: "CANCELLED",
        priceAmount: 40,
        paidAmount: 0,
        startsAt: fromZonedISO("2026-09-16", "12:00", tz),
        endsAt: fromZonedISO("2026-09-16", "13:00", tz),
      },
    ]);
    expect(summary.totalBookings).toBe(2);
    expect(summary.totalRevenue).toBe(70);
    expect(summary.paidAmount).toBe(50);
    expect(summary.unpaidAmount).toBe(20);
    expect(summary.occupiedHours).toBe(2);
  });
});

describe("geo distance", () => {
  it("returns zero for the same point", () => {
    expect(
      distanceKm(
        { latitude: 31.9038, longitude: 35.2034 },
        { latitude: 31.9038, longitude: 35.2034 },
      ),
    ).toBe(0);
  });

  it("estimates Ramallah to Nablus in a plausible range", () => {
    const km = roundKm(
      distanceKm(
        { latitude: 31.9038, longitude: 35.2034 },
        { latitude: 32.2211, longitude: 35.2544 },
      ),
    );
    expect(km).toBeGreaterThan(30);
    expect(km).toBeLessThan(50);
  });
});

describe("cancellation window", () => {
  const startsAt = new Date("2026-09-16T18:00:00.000Z");

  it("allows cancellation before the deadline", () => {
    const result = evaluateCancellation({
      status: "CONFIRMED",
      startsAt,
      now: new Date("2026-09-16T15:00:00.000Z"),
      cancellationHours: 2,
    });
    expect(result.allowed).toBe(true);
  });

  it("rejects cancellation inside the venue window", () => {
    const result = evaluateCancellation({
      status: "CONFIRMED",
      startsAt,
      now: new Date("2026-09-16T17:00:00.000Z"),
      cancellationHours: 2,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("You can cancel this booking up to 2 hours before the start time.");
  });

  it("rejects already cancelled bookings", () => {
    const result = evaluateCancellation({
      status: "CANCELLED",
      startsAt,
      now: new Date("2026-09-16T10:00:00.000Z"),
      cancellationHours: 2,
    });
    expect(result.allowed).toBe(false);
  });
});
