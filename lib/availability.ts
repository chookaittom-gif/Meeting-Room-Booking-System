import { formatThaiEpochDate, formatThaiEpochTime } from "./date-utils";

// Time range already taken in a room. No personal data: only times and status.
export interface BusyRange {
  starts_at: number;
  ends_at: number;
  status: string;
}

export interface FreeSlot {
  starts_at: number;
  ends_at: number;
}

const OPEN_MIN = 8 * 60 + 30; // 08:30 Bangkok
const CLOSE_MIN = 16 * 60 + 30; // 16:30 Bangkok

// Service-hour window (epoch seconds) of a YYYY-MM-DD Bangkok date.
export function dayBounds(dateStr: string): { open: number; close: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const midnight = Date.UTC(y, m - 1, d, -7, 0, 0) / 1000;
  return { open: midnight + OPEN_MIN * 60, close: midnight + CLOSE_MIN * 60 };
}

// Strict inequality, same as the DB check: back-to-back bookings do not conflict.
export function findConflicts(busy: BusyRange[], start: number, end: number): BusyRange[] {
  return busy.filter((b) => b.starts_at < end && b.ends_at > start);
}

// Up to `max` same-length slots inside service hours, nearest to the requested start first.
export function suggestSlots(busy: BusyRange[], start: number, end: number, dateStr: string, max = 3): FreeSlot[] {
  const { open, close } = dayBounds(dateStr);
  const dur = end - start;
  const gaps: [number, number][] = [];
  let cursor = open;
  for (const b of [...busy].sort((a, c) => a.starts_at - c.starts_at)) {
    if (b.starts_at > cursor) gaps.push([cursor, Math.min(b.starts_at, close)]);
    cursor = Math.max(cursor, b.ends_at);
  }
  if (cursor < close) gaps.push([cursor, close]);

  return gaps
    .filter(([a, b]) => b - a >= dur)
    .map(([a, b]) => {
      const s = Math.min(Math.max(start, a), b - dur);
      return { starts_at: s, ends_at: s + dur };
    })
    .sort((x, y) => Math.abs(x.starts_at - start) - Math.abs(y.starts_at - start))
    .slice(0, max);
}

export function formatRange(starts_at: number, ends_at: number): string {
  return `วันที่ ${formatThaiEpochDate(starts_at)} เวลา ${formatThaiEpochTime(starts_at)} – ${formatThaiEpochTime(ends_at)}`;
}

// "HH:mm" in Bangkok time, the format the booking form stores.
export function toBangkokTime(epochSec: number): string {
  const d = new Date(epochSec * 1000 + 7 * 3600 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function statusLabel(status: string): string {
  return status === "pending" ? "รออนุมัติ" : "อนุมัติแล้ว";
}
