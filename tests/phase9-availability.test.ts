import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { POST } from '../app/api/bookings/route';
import { GET } from '../app/api/availability/route';
import { dayBounds, findConflicts, suggestSlots, formatRange, toBangkokTime } from '../lib/availability';
import { CreateBookingPayload } from '../lib/types';

// Tomorrow 09:00 Bangkok (02:00 UTC)
const t = new Date();
t.setUTCDate(t.getUTCDate() + 1);
t.setUTCHours(2, 0, 0, 0);
const nine = Math.floor(t.getTime() / 1000);
const H = 3600;
const dateStr = new Date(nine * 1000 + 7 * H * 1000).toISOString().slice(0, 10);

describe('Phase 9: overlap details and availability', () => {
  let db: D1Database;

  beforeEach(() => {
    db = createMemoryD1Database();
    applyAllMigrations(db);
    setTestDatabase(db);
  });

  const payload = (o: Partial<CreateBookingPayload> = {}): CreateBookingPayload => ({
    request_key: crypto.randomUUID(),
    room_id: 'floor2',
    activity_name: 'กิจกรรมลับห้ามเปิดเผย',
    project_name: 'โครงการ',
    coordinator_name: 'ผู้ประสานงานลับ',
    coordinator_phone: '0891234567',
    meeting_type: 'seminar',
    attendees_count: 60,
    staff_count: 0,
    table_layout: 'classroom',
    vvip_seats: 0,
    vip_seats: 0,
    starts_at: nine,
    ends_at: nine + 3 * H,
    items: [],
    ...o,
  });

  const post = (body: any) =>
    POST(new NextRequest('http://localhost:3000/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  const get = (qs: string) => GET(new NextRequest(`http://localhost:3000/api/availability?${qs}`));

  it('9.1 findConflicts uses strict overlap: back-to-back is free', () => {
    const busy = [{ starts_at: nine, ends_at: nine + 2 * H, status: 'approved' }];
    expect(findConflicts(busy, nine + 2 * H, nine + 4 * H)).toHaveLength(0);
    expect(findConflicts(busy, nine + H, nine + 3 * H)).toHaveLength(1);
  });

  it('9.2 suggestSlots stays inside 08:30-16:30, fits the duration, nearest first', () => {
    const { open, close } = dayBounds(dateStr);
    // 09:00-12:00 busy, user asks 10:00-12:00
    const busy = [{ starts_at: nine, ends_at: nine + 3 * H, status: 'approved' }];
    const slots = suggestSlots(busy, nine + H, nine + 3 * H, dateStr);
    expect(slots.length).toBeGreaterThan(0);
    for (const s of slots) {
      expect(s.ends_at - s.starts_at).toBe(2 * H);
      expect(s.starts_at).toBeGreaterThanOrEqual(open);
      expect(s.ends_at).toBeLessThanOrEqual(close);
      expect(findConflicts(busy, s.starts_at, s.ends_at)).toHaveLength(0);
    }
    expect(toBangkokTime(slots[0].starts_at)).toBe('12:00'); // nearest free start after 09:00-12:00
    expect(suggestSlots([{ starts_at: open, ends_at: close, status: 'approved' }], nine, nine + 2 * H, dateStr)).toEqual([]);
  });

  it('9.3 formatRange states date and time range in Thai', () => {
    expect(formatRange(nine, nine + 3 * H)).toMatch(/^วันที่ \d+ .+ \d{4} เวลา 09:00 น\. – 12:00 น\.$/);
  });

  it('9.4 409 returns the clashing ranges (times + status only, no personal data)', async () => {
    expect((await post(payload({ request_key: 'A' }))).status).toBe(200);
    const res = await post(payload({ request_key: 'B', starts_at: nine + H, ends_at: nine + 4 * H }));
    const data: any = await res.json();
    expect(res.status).toBe(409);
    expect(data.code).toBe('CONFLICT');
    expect(data.conflicts).toEqual([{ starts_at: nine, ends_at: nine + 3 * H, status: 'pending' }]);
    expect(JSON.stringify(data)).not.toContain('ลับ');
  });

  it('9.5 GET /api/availability counts pending+approved only and leaks no personal data', async () => {
    await post(payload({ request_key: 'P' })); // pending 09-12
    await post(payload({ request_key: 'C', starts_at: nine + 4 * H, ends_at: nine + 6 * H })); // 13-15
    await db.prepare("UPDATE bookings SET status = 'cancelled' WHERE request_key = 'C'").run();
    await post(payload({ request_key: 'O', room_id: 'floor7' })); // other room

    const res = await get(`room=floor2&date=${dateStr}`);
    const data: any = await res.json();
    expect(res.status).toBe(200);
    expect(data.busy).toEqual([{ starts_at: nine, ends_at: nine + 3 * H, status: 'pending' }]);
    expect(JSON.stringify(data)).not.toContain('ลับ');
  });

  it('9.6 GET /api/availability validates its parameters', async () => {
    for (const qs of ['', 'room=floor2', `room=floor2&date=2026-13-45`, `room=a b&date=${dateStr}`, `room=floor2&date=tomorrow`]) {
      const res = await get(qs);
      expect(res.status).toBe(400);
    }
  });
});
