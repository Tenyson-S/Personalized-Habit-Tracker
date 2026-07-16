import { format, parseISO, isToday, isTomorrow, isPast, isFuture, addHours } from 'date-fns';

/**
 * Formats an ISO datetime string into a local readable time.
 * e.g. "2:30 PM"
 */
export function formatLocalTime(isoString?: string | null): string {
  if (!isoString) return '';
  return format(parseISO(isoString), 'h:mm a');
}

/**
 * Formats an ISO date or datetime string into a local readable date.
 * e.g. "Today", "Tomorrow", "Oct 24"
 */
export function formatLocalDate(isoString?: string | null): string {
  if (!isoString) return '';
  const date = parseISO(isoString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

/**
 * Returns a new ISO string representing the local datetime right now.
 */
export function nowLocalApiString(): string {
  return new Date().toISOString();
}

/**
 * Combines an existing API Date string (YYYY-MM-DD) and an API Time string (HH:MM:SS) 
 * into a full ISO datetime string.
 */
export function combineDateTime(dateStr: string, timeStr: string): string {
  // If we just need the string for API, we can format them.
  // Assuming dateStr is YYYY-MM-DD and timeStr is HH:mm or HH:mm:ss
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes, seconds = '00'] = timeStr.split(':');
  
  const d = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
  return d.toISOString();
}

/**
 * Returns a time string (HH:mm:ss) from an ISO datetime or JS Date object
 * in local time.
 */
export function extractLocalTimeForApi(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm:ss');
}

/**
 * Returns a date string (YYYY-MM-DD) from an ISO datetime or JS Date object
 * in local time.
 */
export function extractLocalDateForApi(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}
