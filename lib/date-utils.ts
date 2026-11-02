const THAI_FULL_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_SHORT_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

/**
 * Format YYYY-MM-DD string to Thai Buddhist date (e.g. "31 ตุลาคม 2569")
 */
export function formatThaiDateString(dateStr: string): string {
  if (!dateStr) return "";
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (!year || !month || !day || month < 1 || month > 12) return dateStr;
  const beYear = year + 543;
  return `${day} ${THAI_FULL_MONTHS[month - 1]} ${beYear}`;
}

/**
 * Format epoch seconds to Thai Buddhist date (e.g. "31 ตุลาคม 2569")
 */
export function formatThaiEpochDate(epochSec: number, fullMonth = true): string {
  if (!epochSec) return "";
  const d = new Date(epochSec * 1000);
  const bkk = new Date(d.getTime() + 7 * 3600 * 1000);
  const day = bkk.getUTCDate();
  const monthIdx = bkk.getUTCMonth();
  const year = bkk.getUTCFullYear() + 543;
  const monthName = fullMonth ? THAI_FULL_MONTHS[monthIdx] : THAI_SHORT_MONTHS[monthIdx];
  return `${day} ${monthName} ${year}`;
}

/**
 * Format epoch seconds to Thai time (e.g. "09:00 น.")
 */
export function formatThaiEpochTime(epochSec: number): string {
  if (!epochSec) return "";
  const d = new Date(epochSec * 1000);
  const bkk = new Date(d.getTime() + 7 * 3600 * 1000);
  const h = String(bkk.getUTCHours()).padStart(2, "0");
  const m = String(bkk.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} น.`;
}

/**
 * Format YYYY-MM month key to short Thai Buddhist month-year (e.g. "2026-11" -> "พ.ย. 2569")
 */
export function formatThaiMonthYearShort(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (!year || !month || month < 1 || month > 12) return monthKey;
  return `${THAI_SHORT_MONTHS[month - 1]} ${year + 543}`;
}
