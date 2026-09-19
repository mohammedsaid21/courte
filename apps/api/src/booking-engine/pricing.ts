import { hhmmInTimeZone, weekdayInTimeZone } from "./time";
import { timeOverlapsRule } from "./hours";

export type PricingRule = {
  name: string;
  dayOfWeek: number | null;
  startsAt: string;
  endsAt: string;
  priceAmount: number;
  isDefault: boolean;
  sortOrder: number;
};

export function quotePrice(input: {
  start: Date;
  end: Date;
  timeZone: string;
  rules: PricingRule[];
}): { amount: number; ruleName: string } {
  const { start, end, timeZone, rules } = input;
  if (end <= start) {
    throw new Error("End time must be after start time");
  }

  const weekday = weekdayInTimeZone(start, timeZone);
  const startHHmm = hhmmInTimeZone(start, timeZone);
  const matching = rules
    .filter((rule) => rule.dayOfWeek === null || rule.dayOfWeek === weekday)
    .filter((rule) =>
      timeOverlapsRule(startHHmm, hhmmInTimeZone(end, timeZone), rule.startsAt, rule.endsAt),
    )
    .sort((a, b) => {
      const dayScore = (rule: PricingRule) => (rule.dayOfWeek === weekday ? 0 : 1);
      if (dayScore(a) !== dayScore(b)) return dayScore(a) - dayScore(b);
      return a.sortOrder - b.sortOrder;
    });

  if (matching.length > 0) {
    return { amount: matching[0].priceAmount, ruleName: matching[0].name };
  }

  const fallback =
    rules.find((rule) => rule.isDefault) ??
    rules.find((rule) => rule.dayOfWeek === null);

  if (!fallback) {
    return { amount: 0, ruleName: "Unpriced" };
  }

  return { amount: fallback.priceAmount, ruleName: fallback.name };
}

export function derivePaymentStatus(
  priceAmount: number,
  paidAmount: number,
): "UNPAID" | "PAID" | "PARTIAL" {
  if (paidAmount <= 0) return "UNPAID";
  if (paidAmount >= priceAmount) return "PAID";
  return "PARTIAL";
}
