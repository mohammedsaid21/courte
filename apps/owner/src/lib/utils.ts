import { ar } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import { sourceLabelAr, WEEKDAYS_AR, WEEKDAYS_SHORT_AR } from "./ar";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TIMEZONE = "Asia/Hebron";

export function formatMoney(amount: number, currency = "JOD") {
  return `${amount.toFixed(2)} ${currency}`;
}

export function formatTime(iso: string, timeZone = TIMEZONE) {
  return formatInTimeZone(iso, timeZone, "HH:mm");
}

export function formatDate(iso: string, timeZone = TIMEZONE) {
  return formatInTimeZone(iso, timeZone, "EEE d MMM", { locale: ar });
}

export function formatDateLong(iso: string, timeZone = TIMEZONE) {
  return formatInTimeZone(iso, timeZone, "EEEE d MMMM yyyy", { locale: ar });
}

export function todayYmd(timeZone = TIMEZONE) {
  return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
}

export function weekdayLabel(day: number) {
  return WEEKDAYS_AR[day] ?? "";
}

export function weekdayShort(day: number) {
  return WEEKDAYS_SHORT_AR[day] ?? "";
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} س ${rest} د` : `${hours} س`;
}

export function sourceLabel(source: string) {
  return sourceLabelAr(source);
}

export function statusTone(status: string): "neutral" | "green" | "blue" | "amber" | "red" | "violet" {
  if (status === "CANCELLED") return "red";
  if (status === "PENDING") return "amber";
  if (status === "COMPLETED") return "green";
  return "blue";
}

export function paymentTone(status: string): "neutral" | "green" | "amber" {
  if (status === "PAID") return "green";
  if (status === "PARTIAL") return "amber";
  return "neutral";
}
