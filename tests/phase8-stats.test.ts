import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { GET as statsGET } from '../app/api/stats/route';
import { getBookingStats, currentIctMonthKey, monthsAgo } from '../lib/stats';
import { NextRequest } from 'next/server';

describe('Phase 8: Public Booking Statistics (aggregate, no auth, no PII)', () => {
  let db: D1Database;
  const migrationSql = fs.readFileSync(path.join(process.cwd(), 'migrations', '0001_initial_schema.sql'), 'utf8');

  const now = new Date();
  const thisMonth = currentIctMonthKey(now);
  const prevMonth = monthsAgo(thisMonth, 1);
  const threeMonthsAgo = monthsAgo(thisMonth, 3);

  // Parse "YYYY-MM" and build a UTC epoch for day/hour (booking times stored as UTC epoch)
  const utc = (m: string, day: number, hourUtc = 2) => {
    const [y, mo] = m.split('-').map(Number);
    return Math.floor(Date.UTC(y, mo - 1, day, hourUtc, 0, 0) / 1000);
  };

  interface SeedRow {
    id: string;
    room_id: string;
    status: string;
    attendees: number;
    starts: number;
    hours: number;
  }

  const seedBooking = async (row: SeedRow) => {
    await db
      .prepare(
        `INSERT INTO bookings (
           id, request_key, booking_code, room_id,
           activity_name, project_name, coordinator_name, coordinator_phone,
           meeting_type, attendees_count, staff_count, table_layout,
           vvip_seats, vip_seats, starts_at, ends_at, status, total_price_thb,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        row.id,
        `rk_${row.id}`,
        `BK-TEST-${row.id.toUpperCase()}`,
        row.room_id,
        'กิจกรรมทดสอบสถิติ',
        'โครงการทดสอบ',
        'อาจารย์สุดา รักเรียน',
        '0891234567',
        'seminar',
        row.attendees,
        2,
        'theater',
        0,
        0,
        row.starts,
        row.starts + row.hours * 3600,
        row.status,
        0,
        row.starts - 86400,
        row.starts - 86400
      )
      .run();
  };

  beforeEach(async () => {
    db = createMemoryD1Database();
    await db.exec(migrationSql);
    setTestDatabase(db);

    // A: this month, approved, floor2, 3h (09:00–12:00 ICT → morning), 40 attendees
    await seedBooking({ id: 'a', room_id: 'floor2', status: 'approved', attendees: 40, starts: utc(thisMonth, 5, 2), hours: 3 });
    // B: previous month, pending, floor7, 2h (13:00–15:00 ICT → afternoon)
    await seedBooking({ id: 'b', room_id: 'floor7', status: 'pending', attendees: 20, starts: utc(prevMonth, 12, 6), hours: 2 });
    // C: 3 months ago, cancelled, floor2
    await seedBooking({ id: 'c', room_id: 'floor2', status: 'cancelled', attendees: 10, starts: utc(threeMonthsAgo, 5, 2), hours: 2 });
    // D: 3 months ago, rejected, floor7
    await seedBooking({ id: 'd', room_id: 'floor7', status: 'rejected', attendees: 25, starts: utc(threeMonthsAgo, 12, 2), hours: 2 });

    // Catering items: attach to A (kept) and C (cancelled → excluded from top items)
    const insertItem = (id: string, bookingId: string, name: string, qty: number, price: number) =>
      db
        .prepare(
          `INSERT INTO booking_items (id, booking_id, item_code, item_name, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, bookingId, `code_${id}`, name, qty, price, qty * price)
        .run();
    await insertItem('ia1', 'a', 'ชา/กาแฟ + อาหารว่าง', 10, 50);
    await insertItem('ic1', 'c', 'น้ำเปล่า 350 mL', 5, 5);
  });

  it('8.1 should bucket bookings into ICT months and count statuses correctly', async () => {
    const stats = await getBookingStats(db, 12, now);

    expect(stats.monthly).toHaveLength(12);
    expect(stats.monthly[11].month).toBe(thisMonth);
    expect(stats.monthly[10].month).toBe(prevMonth);
    expect(stats.monthly[8].month).toBe(threeMonthsAgo);

    const cur = stats.monthly[11];
    expect(cur.total).toBe(1);
    expect(cur.counts.approved).toBe(1);
    expect(cur.hours_approved).toBe(3);

    const prev = stats.monthly[10];
    expect(prev.total).toBe(1);
    expect(prev.counts.pending).toBe(1);
    expect(prev.hours_approved).toBe(0); // hours count only approved

    const m3 = stats.monthly[8];
    expect(m3.total).toBe(2);
    expect(m3.counts.cancelled).toBe(1);
    expect(m3.counts.rejected).toBe(1);
  });

  it('8.2 should compute KPIs (month-over-month, approval rate, avg attendees)', async () => {
    const stats = await getBookingStats(db, 12, now);

    expect(stats.kpi.this_month_total).toBe(1);
    expect(stats.kpi.prev_month_total).toBe(1);
    expect(stats.kpi.mom_change_pct).toBe(0); // 1 vs 1
    expect(stats.kpi.avg_attendees_this_month).toBe(40); // only booking A (non-cancelled this month)
    expect(stats.kpi.approval_rate_12m).toBe(25); // 1 approved of 4 total
  });

  it('8.3 should split rooms and popular slots (approved + pending only)', async () => {
    const stats = await getBookingStats(db, 12, now);

    const floor2 = stats.rooms.find((r) => r.room_id === 'floor2');
    const floor7 = stats.rooms.find((r) => r.room_id === 'floor7');
    expect(floor2?.count).toBe(2); // A + C
    expect(floor7?.count).toBe(2); // B + D
    expect(floor2?.hours_approved).toBe(3); // only A
    expect(floor7?.hours_approved).toBe(0);

    expect(stats.popular_slots.morning).toBe(1); // A (09:00 ICT, approved)
    expect(stats.popular_slots.afternoon).toBe(1); // B (13:00 ICT, pending)
  });

  it('8.4 should exclude cancelled bookings from top catering items', async () => {
    const stats = await getBookingStats(db, 12, now);

    expect(stats.top_items).toHaveLength(1);
    expect(stats.top_items[0].name).toBe('ชา/กาแฟ + อาหารว่าง');
    expect(stats.top_items[0].quantity).toBe(10);
    expect(stats.top_items[0].revenue_thb).toBe(500);
  });

  it('8.5 should serve stats publicly without authentication and without PII', async () => {
    const req = new NextRequest('http://localhost:3000/api/stats?months=12');
    const res = await statsGET(req);

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.stats.kpi.this_month_total).toBe(1);

    // No coordinator PII anywhere in the response
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('coordinator_name');
    expect(raw).not.toContain('coordinator_phone');
    expect(raw).not.toContain('อาจารย์สุดา');
    expect(raw).not.toContain('0891234567');
  });

  it('8.6 should clamp months parameter to 3..24', async () => {
    const req = new NextRequest('http://localhost:3000/api/stats?months=999');
    const res = await statsGET(req);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.stats.monthly).toHaveLength(24);
  });
});
