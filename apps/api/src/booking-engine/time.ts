import { addMinutes as addMinutesFns, differenceInMinutes } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export function parseMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatMinutes(total: number): string {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function durationMinutes(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

export function addMinutes(date: Date, minutes: number): Date {
  return addMinutesFns(date, minutes);
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function ymdInTimeZone(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

export function weekdayInTimeZone(date: Date, timeZone: string): number {
  return toZonedTime(date, timeZone).getDay();
}

export function hhmmInTimeZone(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, "HH:mm");
}

export function fromZonedISO(
  ymd: string,
  hhmm: string,
  timeZone: string,
): Date {
  if (hhmm === "24:00") {
    const next = addCalendarDay(ymd, 1);
    return fromZonedTime(`${next}T00:00:00`, timeZone);
  }
  return fromZonedTime(`${ymd}T${hhmm}:00`, timeZone);
}

export function startOfZonedDay(ymd: string, timeZone: string): Date {
  return fromZonedISO(ymd, "00:00", timeZone);
}

export function endOfZonedDay(ymd: string, timeZone: string): Date {
  return fromZonedISO(ymd, "24:00", timeZone);
}

export function addCalendarDay(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function eachYmd(from: string, to: string): string[] {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addCalendarDay(cursor, 1);
  }
  return days;
}

export function closesAtMoment(
  ymd: string,
  opensAt: string,
  closesAt: string,
  timeZone: string,
): Date {
  const opens = parseMinutes(opensAt);
  const closes = parseMinutes(closesAt);
  if (closesAt === "00:00" || closes <= opens) {
    return fromZonedISO(addCalendarDay(ymd, 1), closesAt === "00:00" ? "00:00" : closesAt, timeZone);
  }
  return fromZonedISO(ymd, closesAt, timeZone);
}
