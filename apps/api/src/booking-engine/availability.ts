import { durationMinutes } from "./time";
import {
  AvailabilityException,
  DayWindow,
  containsBlockedPeriod,
  isWithinWindow,
  windowForDate,
  OperatingHour,
} from "./hours";
import { isValidDuration } from "./slots";
import { quotePrice, PricingRule } from "./pricing";

export type AvailabilityDecision = {
  available: boolean;
  reason?: string;
  priceAmount?: number;
  ruleName?: string;
};

export function evaluateAvailability(input: {
  start: Date;
  end: Date;
  timeZone: string;
  resourceActive: boolean;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  hours: OperatingHour[];
  exceptions: AvailabilityException[];
  overlappingBookings: { id: string }[];
  rules: PricingRule[];
  allowOutsideHours?: boolean;
  now?: Date;
  minAdvanceHours?: number;
  maxAdvanceDays?: number;
  enforceAdvanceWindow?: boolean;
}): AvailabilityDecision {
  const {
    start,
    end,
    timeZone,
    resourceActive,
    minDurationMinutes,
    maxDurationMinutes,
    hours,
    exceptions,
    overlappingBookings,
    rules,
    allowOutsideHours = false,
    now = new Date(),
    minAdvanceHours = 0,
    maxAdvanceDays = 365,
    enforceAdvanceWindow = false,
  } = input;

  if (!resourceActive) {
    return { available: false, reason: "This court or field is inactive." };
  }
  if (end <= start) {
    return { available: false, reason: "End time must be after start time." };
  }

  const minutes = durationMinutes(start, end);
  if (!isValidDuration(minutes, minDurationMinutes, maxDurationMinutes)) {
    return {
      available: false,
      reason: `Duration must be between ${minDurationMinutes} and ${maxDurationMinutes} minutes.`,
    };
  }

  if (enforceAdvanceWindow) {
    const advance = evaluateAdvanceWindow({ start, now, minAdvanceHours, maxAdvanceDays });
    if (!advance.available) {
      return advance;
    }
  }

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(start);
  const window: DayWindow = windowForDate({ date, timeZone, hours, exceptions });

  if (!allowOutsideHours && !isWithinWindow(start, end, window)) {
    return {
      available: false,
      reason: window.closed
        ? "The venue is closed at this time."
        : "This time is outside operating hours.",
    };
  }

  if (containsBlockedPeriod(start, end, exceptions)) {
    return { available: false, reason: "This time is blocked." };
  }

  if (overlappingBookings.length > 0) {
    return { available: false, reason: "This time is already booked." };
  }

  const quote = quotePrice({ start, end, timeZone, rules });
  return {
    available: true,
    priceAmount: quote.amount,
    ruleName: quote.ruleName,
  };
}

export function evaluateAdvanceWindow(input: {
  start: Date;
  now: Date;
  minAdvanceHours: number;
  maxAdvanceDays: number;
}): AvailabilityDecision {
  const minStart = new Date(input.now.getTime() + input.minAdvanceHours * 60 * 60 * 1000);
  const maxStart = new Date(input.now.getTime() + input.maxAdvanceDays * 24 * 60 * 60 * 1000);
  if (input.minAdvanceHours > 0 && input.start < minStart) {
    return {
      available: false,
      reason: `Bookings must be made at least ${input.minAdvanceHours} hours in advance.`,
    };
  }
  if (input.start > maxStart) {
    return {
      available: false,
      reason: `Bookings cannot be made more than ${input.maxAdvanceDays} days in advance.`,
    };
  }
  return { available: true };
}
