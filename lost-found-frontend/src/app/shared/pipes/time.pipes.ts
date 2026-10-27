import { Pipe, PipeTransform } from '@angular/core';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Compact mono label used on cards: "JUST NOW", "2H AGO", "YESTERDAY", "3 DAYS", "SEP 21". */
export function timeAgo(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  const diff = now - date.getTime();
  if (diff < MINUTE) return 'JUST NOW';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}M AGO`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}H AGO`;
  if (diff < 2 * DAY) return 'YESTERDAY';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} DAYS`;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** Friendly date + time for details: "Today, 11:30", "Yesterday, 09:05", "Sep 21, 14:00". */
export function whenLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (date.getTime() >= startOfToday) return `Today, ${time}`;
  if (date.getTime() >= startOfToday - DAY) return `Yesterday, ${time}`;
  const month = MONTHS[date.getMonth()];
  return `${month.charAt(0)}${month.slice(1).toLowerCase()} ${date.getDate()}, ${time}`;
}

/**
 * Pipes format values in templates: {{ item.foundAt | timeAgo }}.
 * They're "pure" by default: Angular re-runs them only when the input changes.
 */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(iso: string | undefined): string {
    return iso ? timeAgo(iso) : '';
  }
}

@Pipe({ name: 'when' })
export class WhenPipe implements PipeTransform {
  transform(iso: string | undefined): string {
    return iso ? whenLabel(iso) : '';
  }
}
