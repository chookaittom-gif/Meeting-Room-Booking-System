import { monthKeyStartEpoch, monthsAgo } from "./stats";

const ICT_OFFSET_MS = 7 * 3600 * 1000;

export interface RoomReportRow {
  room_id: string;
  room_name: string;
  count: number;
  hours: number;
  utilization_pct: number;
  top_project: string | null;
}

export interface PurposeRow {
  meeting_type: string;
  label_th: string;
  count: number;
  pct: number;
}

export interface FinancialSummary {
  room_fee_thb: number;
  catering_fee_thb: number;
  grand_total_thb: number;
  deposit_thb: number;
}

export interface CateringReportRow {
  item_code: string;
  item_name: string;
  quantity: number;
  subtotal: number;
}

export interface ApprovedBookingDetail {
  id: string;
  booking_code: string;
  room_name: string;
  activity_name: string;
  project_name: string;
  coordinator_name: string;
  coordinator_phone: string;
  attendees_count: number;
  starts_at: number;
  ends_at: number;
  total_amount_thb: number;
}

export interface MonthlyReport {
  month_key: string; // "YYYY-MM" (ICT)
  operational_days: number; // weekdays Mon–Fri in that month
  total_rooms: number;
  total_bookings: number; // approved
  total_hours: number;
  overall_utilization_pct: number;
  rooms: RoomReportRow[];
  purposes: PurposeRow[];
  financial: FinancialSummary;
  catering: CateringReportRow[];
  approved_bookings: ApprovedBookingDetail[];
  cancelled_count: number;
}

/** Weekdays (Mon–Fri) in a month, ICT calendar month */
export function countWeekdays(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (dow >= 1 && dow <= 5) n++;
  }
  return n;
}

const SERVICE_HOURS_PER_DAY = 8; // 08:30–16:30

const PURPOSE_LABELS: Record<string, string> = {
  seminar: "การอบรม/สัมมนา/สอบ",
  small_group: "การประชุม",
  wedding: "พิธีมงคล/กิจกรรมพิเศษ",
  internal: "ประชุมภายในองค์กร",
};

/**
 * Monthly usage report for admins (A4 print form).
 * Reuses the ICT month-key helpers from lib/stats.ts.
 */
export async function getMonthlyReport(db: D1Database, monthKey: string): Promise<MonthlyReport> {
  const start = monthKeyStartEpoch(monthKey);
  const end = monthKeyStartEpoch(monthsAgo(monthKey, -1));
  const operationalDays = countWeekdays(monthKey);

  const roomsRes = await db.prepare(`SELECT id, name FROM rooms ORDER BY id`).all<{ id: string; name: string }>();
  const rooms = roomsRes.results || [];

  const perRoomRes = await db
    .prepare(
      `SELECT b.room_id,
              COUNT(*) AS cnt,
              SUM(b.ends_at - b.starts_at) AS secs,
              (SELECT b2.project_name FROM bookings b2
               WHERE b2.room_id = b.room_id AND b2.status = 'approved'
                 AND b2.starts_at >= ? AND b2.starts_at < ?
               GROUP BY b2.project_name ORDER BY COUNT(*) DESC LIMIT 1) AS top_project
       FROM bookings b
       WHERE b.status = 'approved' AND b.starts_at >= ? AND b.starts_at < ?
       GROUP BY b.room_id`
    )
    .bind(start, end, start, end)
    .all<{ room_id: string; cnt: number; secs: number | null; top_project: string | null }>();

  const perRoom = new Map((perRoomRes.results || []).map((r) => [r.room_id, r]));

  const roomRows: RoomReportRow[] = rooms.map((room) => {
    const r = perRoom.get(room.id);
    const hours = Math.round(((r?.secs || 0) / 3600) * 10) / 10;
    const capacityHours = operationalDays * SERVICE_HOURS_PER_DAY;
    return {
      room_id: room.id,
      room_name: room.name,
      count: r?.cnt || 0,
      hours,
      utilization_pct: capacityHours > 0 ? Math.round((hours / capacityHours) * 1000) / 10 : 0,
      top_project: r?.top_project || null,
    };
  });

  const totalCount = roomRows.reduce((s, r) => s + r.count, 0);
  const totalHours = Math.round(roomRows.reduce((s, r) => s + r.hours, 0) * 10) / 10;
  const totalCapacity = operationalDays * SERVICE_HOURS_PER_DAY * rooms.length;

  const purposeRes = await db
    .prepare(
      `SELECT meeting_type, COUNT(*) AS cnt
       FROM bookings
       WHERE status = 'approved' AND starts_at >= ? AND starts_at < ?
       GROUP BY meeting_type ORDER BY cnt DESC`
    )
    .bind(start, end)
    .all<{ meeting_type: string; cnt: number }>();

  const purposes: PurposeRow[] = (purposeRes.results || []).map((p) => ({
    meeting_type: p.meeting_type,
    label_th: PURPOSE_LABELS[p.meeting_type] || p.meeting_type,
    count: p.cnt,
    pct: totalCount > 0 ? Math.round((p.cnt / totalCount) * 1000) / 10 : 0,
  }));

  const financialRes = await db
    .prepare(
      `SELECT
         COALESCE(SUM(room_fee_thb), 0) AS room_fee,
         COALESCE(SUM(total_price_thb), 0) AS catering_fee,
         COALESCE(SUM(deposit_thb), 0) AS deposit
       FROM bookings
       WHERE status = 'approved' AND starts_at >= ? AND starts_at < ?`
    )
    .bind(start, end)
    .first<{ room_fee: number; catering_fee: number; deposit: number }>();

  const roomFeeThb = financialRes?.room_fee || 0;
  const cateringFeeThb = financialRes?.catering_fee || 0;
  const depositThb = financialRes?.deposit || 0;
  const grandTotalThb = roomFeeThb + cateringFeeThb;

  const cateringRes = await db
    .prepare(
      `SELECT
         bi.item_code,
         bi.item_name,
         SUM(bi.quantity) AS quantity,
         SUM(bi.subtotal) AS subtotal
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       WHERE b.status = 'approved' AND b.starts_at >= ? AND b.starts_at < ?
       GROUP BY bi.item_code, bi.item_name
       ORDER BY subtotal DESC, quantity DESC`
    )
    .bind(start, end)
    .all<{ item_code: string; item_name: string; quantity: number; subtotal: number }>();

  const catering: CateringReportRow[] = (cateringRes.results || []).map((c) => ({
    item_code: c.item_code,
    item_name: c.item_name,
    quantity: c.quantity,
    subtotal: c.subtotal,
  }));

  const approvedRes = await db
    .prepare(
      `SELECT
         b.id,
         b.booking_code,
         r.name AS room_name,
         b.activity_name,
         b.project_name,
         b.coordinator_name,
         b.coordinator_phone,
         b.attendees_count,
         b.starts_at,
         b.ends_at,
         (b.room_fee_thb + b.total_price_thb) AS total_amount_thb
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.status = 'approved' AND b.starts_at >= ? AND b.starts_at < ?
       ORDER BY b.starts_at ASC`
    )
    .bind(start, end)
    .all<ApprovedBookingDetail>();

  const approvedBookings: ApprovedBookingDetail[] = approvedRes.results || [];

  const cancelledRes = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM bookings
       WHERE status = 'cancelled' AND starts_at >= ? AND starts_at < ?`
    )
    .bind(start, end)
    .first<{ cnt: number }>();

  return {
    month_key: monthKey,
    operational_days: operationalDays,
    total_rooms: rooms.length,
    total_bookings: totalCount,
    total_hours: totalHours,
    overall_utilization_pct: totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 1000) / 10 : 0,
    rooms: roomRows,
    purposes,
    financial: {
      room_fee_thb: roomFeeThb,
      catering_fee_thb: cateringFeeThb,
      grand_total_thb: grandTotalThb,
      deposit_thb: depositThb,
    },
    catering,
    approved_bookings: approvedBookings,
    cancelled_count: cancelledRes?.cnt || 0,
  };
}

/** Current month key in ICT */
export function reportCurrentMonth(now = new Date()): string {
  const ict = new Date(now.getTime() + ICT_OFFSET_MS);
  return `${ict.getUTCFullYear()}-${String(ict.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Thai full month + Buddhist year, e.g. "พฤศจิกายน 2569" */
export function thaiMonthYearFull(monthKey: string): string {
  const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const [y, m] = monthKey.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** List of the last N month keys ending at the given one */
export function lastMonthKeys(endKey: string, n = 12): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(monthsAgo(endKey, i));
  return keys;
}
