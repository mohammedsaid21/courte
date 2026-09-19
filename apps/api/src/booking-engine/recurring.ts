import { addMinutes, eachYmd, fromZonedISO, weekdayInTimeZone } from "./time";

export type RecurringOccurrence = {
  date: string;
  start: Date;
  end: Date;
};

export function generateRecurringOccurrences(input: {
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  timeZone: string;
  maxOccurrences?: number;
}): RecurringOccurrence[] {
  const uniqueDays = [...new Set(input.daysOfWeek)].sort();
  const max = input.maxOccurrences ?? 180;
  const items: RecurringOccurrence[] = [];
  for (const date of eachYmd(input.startDate, input.endDate)) {
    const weekday = weekdayInTimeZone(fromZonedISO(date, "12:00", input.timeZone), input.timeZone);
    if (!uniqueDays.includes(weekday)) continue;
    const start = fromZonedISO(date, input.startTime, input.timeZone);
    items.push({
      date,
      start,
      end: addMinutes(start, input.durationMinutes),
    });
    if (items.length >= max) break;
  }
  return items;
}
