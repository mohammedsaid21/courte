import { closesAtMoment, fromZonedISO, parseMinutes, weekdayInTimeZone, endOfZonedDay } from "./time";

export type OperatingHour = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};

export type AvailabilityException = {
  type: "CLOSED" | "SPECIAL_HOURS" | "BLOCKED";
  startsAt: Date;
  endsAt: Date;
  opensAt?: string | null;
  closesAt?: string | null;
};

export type DayWindow = {
  date: string;
  closed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  start: Date | null;
  end: Date | null;
  reason?: string;
};

function overlapsRange(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

export function windowForDate(input: {
  date: string;
  timeZone: string;
  hours: OperatingHour[];
  exceptions: AvailabilityException[];
}): DayWindow {
  const { date, timeZone, hours, exceptions } = input;
  const dayStart = fromZonedISO(date, "00:00", timeZone);
  const dayEnd = endOfZonedDay(date, timeZone);
  const weekday = weekdayInTimeZone(dayStart, timeZone);

  const fullClose = exceptions.find(
    (item) =>
      item.type === "CLOSED" &&
      item.startsAt <= dayStart &&
      item.endsAt >= dayEnd,
  );
  if (fullClose) {
    return {
      date,
      closed: true,
      opensAt: null,
      closesAt: null,
      start: null,
      end: null,
      reason: "Closed by exception",
    };
  }

  const special = exceptions.find(
    (item) =>
      item.type === "SPECIAL_HOURS" &&
      overlapsRange(item.startsAt, item.endsAt, dayStart, dayEnd) &&
      item.opensAt &&
      item.closesAt,
  );
  if (special?.opensAt && special.closesAt) {
    return {
      date,
      closed: false,
      opensAt: special.opensAt,
      closesAt: special.closesAt,
      start: fromZonedISO(date, special.opensAt, timeZone),
      end: closesAtMoment(date, special.opensAt, special.closesAt, timeZone),
      reason: "Special hours",
    };
  }

  const hour = hours.find((item) => item.dayOfWeek === weekday);
  if (!hour || hour.isClosed) {
    return {
      date,
      closed: true,
      opensAt: null,
      closesAt: null,
      start: null,
      end: null,
      reason: "Closed",
    };
  }

  return {
    date,
    closed: false,
    opensAt: hour.opensAt,
    closesAt: hour.closesAt,
    start: fromZonedISO(date, hour.opensAt, timeZone),
    end: closesAtMoment(date, hour.opensAt, hour.closesAt, timeZone),
  };
}

export function isWithinWindow(
  start: Date,
  end: Date,
  window: DayWindow,
): boolean {
  if (window.closed || !window.start || !window.end) {
    return false;
  }
  return start >= window.start && end <= window.end;
}

export function containsBlockedPeriod(
  start: Date,
  end: Date,
  exceptions: AvailabilityException[],
): boolean {
  return exceptions.some(
    (item) =>
      (item.type === "BLOCKED" || item.type === "CLOSED") &&
      start < item.endsAt &&
      item.startsAt < end,
  );
}

export function minutesOpen(window: DayWindow): number {
  if (!window.start || !window.end) {
    return 0;
  }
  return Math.max(0, (window.end.getTime() - window.start.getTime()) / 60000);
}

export function timeOverlapsRule(
  startHHmm: string,
  endHHmm: string,
  ruleStart: string,
  ruleEnd: string,
): boolean {
  const start = parseMinutes(startHHmm);
  let end = parseMinutes(endHHmm);
  let ruleTo = parseMinutes(ruleEnd);
  if (end === 0) end = 24 * 60;
  if (ruleTo === 0) ruleTo = 24 * 60;
  const ruleFrom = parseMinutes(ruleStart);
  return start < ruleTo && ruleFrom < end;
}
