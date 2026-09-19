import { addMinutes } from "./time";
import { DayWindow } from "./hours";
import { quotePrice, PricingRule } from "./pricing";

export type OccupiedRange = {
  start: Date;
  end: Date;
};

export type GeneratedSlot = {
  start: Date;
  end: Date;
  status: "available" | "booked" | "blocked" | "outside";
  priceAmount: number | null;
};

export function generateSlots(input: {
  timeZone: string;
  window: DayWindow;
  intervalMinutes: number;
  durationMinutes: number;
  bookings: OccupiedRange[];
  blocks: OccupiedRange[];
  rules: PricingRule[];
}): GeneratedSlot[] {
  const {
    timeZone,
    window,
    intervalMinutes,
    durationMinutes,
    bookings,
    blocks,
    rules,
  } = input;

  if (window.closed || !window.start || !window.end || intervalMinutes <= 0) {
    return [];
  }

  const slots: GeneratedSlot[] = [];
  let cursor = window.start;
  let guard = 0;
  while (addMinutes(cursor, durationMinutes) <= window.end && guard < 200) {
    const start = cursor;
    const end = addMinutes(cursor, durationMinutes);
    const blocked = blocks.some((item) => start < item.end && item.start < end);
    const booked = bookings.some((item) => start < item.end && item.start < end);
    const price = quotePrice({ start, end, timeZone, rules });
    slots.push({
      start,
      end,
      status: blocked ? "blocked" : booked ? "booked" : "available",
      priceAmount: price.amount,
    });
    cursor = addMinutes(cursor, intervalMinutes);
    guard += 1;
  }

  return slots;
}

export function occupiedMinutes(ranges: OccupiedRange[], window: DayWindow): number {
  if (!window.start || !window.end) return 0;
  let total = 0;
  for (const range of ranges) {
    const start = range.start < window.start ? window.start : range.start;
    const end = range.end > window.end ? window.end : range.end;
    if (end > start) {
      total += (end.getTime() - start.getTime()) / 60000;
    }
  }
  return total;
}

export function isValidDuration(
  minutes: number,
  minDuration: number,
  maxDuration: number,
): boolean {
  return minutes >= minDuration && minutes <= maxDuration && minutes > 0;
}
