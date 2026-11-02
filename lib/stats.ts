import { formatThaiMonthYearShort } from "./date-utils";

const ICT_OFFSET_MS = 7 * 3600 * 1000;

export interface MonthlyStat {
  month: string; // "YYYY-MM" (ICT)
  label_th: string; // "พ.ย. 2569"
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
  total: number;
  hours_approved: number;
}

export interface RoomStat {
  room_id: string;
  room_name: string;
  count: number;
  hours_approved: number;
}

export interface TopItemStat {
  name: string;
  quantity: number;
  revenue_thb: number;
}

export interface BookingStats {
  generated_at: number;
  range: { from_month: string; to_month: string };
  monthly: MonthlyStat[];
  kpi: {
    this_month_total: number;
    prev_month_total: number;
    mom_change_pct: number | null;
    avg_attendees_this_month: number | null;
    approval_rate_12m: number;
  };
  rooms: RoomStat[];
  status_summary: { pending: number; approved: number; rejected: number; cancelled: number };
  popular_slots: { morning: number; afternoon: number };
  top_items: TopItemStat[];
}

/** Current month key in ICT, e.g. "2026-11" */
export function currentIctMonthKey(now = new Date()): string {
  const ict = new Date(now.getTime() + ICT_OFFSET_MS);
  return `${ict.getUTCFullYear()}-${String(ict.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Month key N months before the given key */
export function monthsAgo(monthKey: string, n: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 - n, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** First second (UTC epoch) of an ICT month key */
export function monthKeyStartEpoch(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, 1) / 1000) - ICT_OFFSET_MS / 1000;
}

const EMPTY_COUNTS = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };

/**
 * Aggregate booking statistics for public display.
 * Contains NO personal information (no coordinator fields).
 */
export async function getBookingStats(
  db: D1Database,
  months = 12,
  now = new Date()
): Promise<BookingStats> {
  const toMonth = currentIctMonthKey(now);
  const fromMonth = monthsAgo(toMonth, months - 1);
  const rangeStart = monthKeyStartEpoch(fromMonth);
  const rangeEnd = monthKeyStartEpoch(monthsAgo(toMonth, -1)); // first second after toMonth

  // Pre-fill all months in range so empty months still render
  const monthKeys: string[] = [];
  for (let i = 0; i < months; i++) monthKeys.push(monthsAgo(fromMonth, -i));
  const monthlyMap = new Map<string, MonthlyStat>(
    monthKeys.map((k) => [
      k,
      { month: k, label_th: formatThaiMonthYearShort(k), counts: { ...EMPTY_COUNTS }, total: 0, hours_approved: 0 },
    ])
  );

  // 1. Monthly counts + approved hours, bucketed by ICT month
  const monthlyRes = await db
    .prepare(
      `SELECT substr(datetime(starts_at + 25200, 'unixepoch'), 1, 7) AS m,
              status,
              COUNT(*) AS cnt,
              SUM(CASE WHEN status = 'approved' THEN ends_at - starts_at ELSE 0 END) AS approved_secs
       FROM bookings
       WHERE starts_at >= ? AND starts_at < ?
       GROUP BY m, status`
    )
    .bind(rangeStart, rangeEnd)
    .all<{ m: string; status: string; cnt: number; approved_secs: number | null }>();

  for (const row of monthlyRes.results || []) {
    const stat = monthlyMap.get(row.m);
    if (!stat) continue;
    if (row.status in stat.counts) {
      stat.counts[row.status as keyof typeof stat.counts] = row.cnt;
    }
    stat.total += row.cnt;
    stat.hours_approved = Math.round(((stat.hours_approved || 0) + (row.approved_secs || 0) / 3600) * 10) / 10;
  }
  const monthly = monthKeys.map((k) => monthlyMap.get(k)!);

  // 2. KPIs
  const thisMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2] || null;
  const momChangePct =
    prevMonth && prevMonth.total > 0
      ? Math.round(((thisMonth.total - prevMonth.total) / prevMonth.total) * 100)
      : thisMonth.total > 0
        ? 100
        : null;

  const avgRes = await db
    .prepare(
      `SELECT AVG(attendees_count) AS avg_att
       FROM bookings
       WHERE starts_at >= ? AND starts_at < ? AND status != 'cancelled'`
    )
    .bind(monthKeyStartEpoch(toMonth), rangeEnd)
    .first<{ avg_att: number | null }>();

  const statusSummary = { ...EMPTY_COUNTS };
  for (const m of monthly) {
    statusSummary.pending += m.counts.pending;
    statusSummary.approved += m.counts.approved;
    statusSummary.rejected += m.counts.rejected;
    statusSummary.cancelled += m.counts.cancelled;
  }
  const total12m = statusSummary.pending + statusSummary.approved + statusSummary.rejected + statusSummary.cancelled;
  const approvalRate = total12m > 0 ? Math.round((statusSummary.approved / total12m) * 100) : 0;

  // 3. Room split (12 months)
  const roomsRes = await db
    .prepare(
      `SELECT b.room_id, r.name AS room_name,
              COUNT(*) AS cnt,
              SUM(CASE WHEN b.status = 'approved' THEN b.ends_at - b.starts_at ELSE 0 END) AS approved_secs
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.starts_at >= ? AND b.starts_at < ?
       GROUP BY b.room_id
       ORDER BY cnt DESC`
    )
    .bind(rangeStart, rangeEnd)
    .all<{ room_id: string; room_name: string; cnt: number; approved_secs: number | null }>();

  const rooms: RoomStat[] = (roomsRes.results || []).map((r) => ({
    room_id: r.room_id,
    room_name: r.room_name,
    count: r.cnt,
    hours_approved: Math.round(((r.approved_secs || 0) / 3600) * 10) / 10,
  }));

  // 4. Popular start slots (pending + approved only, cancelled/rejected excluded)
  const slotsRes = await db
    .prepare(
      `SELECT SUM(CASE WHEN time(starts_at + 25200, 'unixepoch') < '12:00' THEN 1 ELSE 0 END) AS morning,
              SUM(CASE WHEN time(starts_at + 25200, 'unixepoch') >= '12:00' THEN 1 ELSE 0 END) AS afternoon
       FROM bookings
       WHERE starts_at >= ? AND starts_at < ? AND status IN ('approved', 'pending')`
    )
    .bind(rangeStart, rangeEnd)
    .first<{ morning: number | null; afternoon: number | null }>();

  // 5. Top catering items (cancelled excluded)
  const itemsRes = await db
    .prepare(
      `SELECT bi.item_name AS name,
              SUM(bi.quantity) AS quantity,
              SUM(bi.subtotal) AS revenue
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       WHERE b.starts_at >= ? AND b.starts_at < ? AND b.status != 'cancelled'
       GROUP BY bi.item_name
       ORDER BY quantity DESC
       LIMIT 5`
    )
    .bind(rangeStart, rangeEnd)
    .all<{ name: string; quantity: number; revenue: number }>();

  return {
    generated_at: Math.floor(now.getTime() / 1000),
    range: { from_month: fromMonth, to_month: toMonth },
    monthly,
    kpi: {
      this_month_total: thisMonth.total,
      prev_month_total: prevMonth?.total ?? 0,
      mom_change_pct: momChangePct,
      avg_attendees_this_month: avgRes?.avg_att != null ? Math.round(avgRes.avg_att) : null,
      approval_rate_12m: approvalRate,
    },
    rooms,
    status_summary: statusSummary,
    popular_slots: {
      morning: slotsRes?.morning || 0,
      afternoon: slotsRes?.afternoon || 0,
    },
    top_items: (itemsRes.results || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      revenue_thb: i.revenue,
    })),
  };
}
