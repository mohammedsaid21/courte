import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDays, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TIMEZONE = "Asia/Hebron";
export const SITE_NAME = "ميدان";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
export const OWNER_APP_URL = process.env.NEXT_PUBLIC_OWNER_URL ?? "http://localhost:3000";

export function formatMoney(amount: number, _currency = "JOD") {
  const value = amount.toFixed(amount % 1 === 0 ? 0 : 2);
  return `${value} ₪`;
}

export function formatTime(iso: string, timeZone = TIMEZONE) {
  return formatInTimeZone(iso, timeZone, "HH:mm");
}

export function formatDate(iso: string, timeZone = TIMEZONE) {
  return formatInTimeZone(iso, timeZone, "EEE d MMM");
}

export function formatDateLong(iso: string, timeZone = TIMEZONE) {
  return formatInTimeZone(iso, timeZone, "EEEE, d MMMM yyyy");
}

export function ymdInZone(iso: string, timeZone = TIMEZONE) {
  return formatInTimeZone(iso, timeZone, "yyyy-MM-dd");
}

export function todayYmd(timeZone = TIMEZONE) {
  return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
}

export function addDaysYmd(date: string, days: number) {
  return format(addDays(new Date(`${date}T12:00:00`), days), "yyyy-MM-dd");
}

export function weekdayLabel(day: number) {
  return ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][day];
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} س ${rest} د` : `${hours} س`;
}

export function durationOptions(min: number, max: number, interval: number) {
  const step = interval > 0 ? interval : 30;
  const values: number[] = [];
  for (let minutes = min; minutes <= max; minutes += step) {
    values.push(minutes);
  }
  if (values[values.length - 1] !== max) values.push(max);
  return values;
}

export function mapsUrl(input: {
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}) {
  if (input.latitude != null && input.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${input.address}, ${input.city}`)}`;
}

export function cancellationCopy(hours: number, policy?: string | null) {
  const windowText =
    hours > 0
      ? `يمكنك إلغاء هذا الحجز حتى ${hours} ساعة قبل موعد البداية.`
      : "لا يمكن إلغاء هذا الحجز بعد تأكيده.";
  return policy ? `${windowText} ${policy}` : windowText;
}

export function statusLabel(status: string) {
  if (status === "CANCELLED") return "ملغى";
  if (status === "PENDING") return "قيد الانتظار";
  if (status === "COMPLETED") return "مكتمل";
  return "مؤكد";
}
