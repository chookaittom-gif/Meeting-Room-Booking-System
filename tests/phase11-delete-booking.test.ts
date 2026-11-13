import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { createSessionToken } from '../lib/auth';
import { createBookingAtomic, updateBookingStatus } from '../lib/booking-service';
import { DELETE } from '../app/api/admin/bookings/[id]/route';
import { CreateBookingPayload } from '../lib/types';

describe('Phase 11: Superadmin delete booking', () => {
  let db: D1Database;
  let superToken: string;
  let adminToken: string;
  let staffToken: string;

  const payload = (offsetDays: number): CreateBookingPayload => {
    const t = new Date();
    t.setUTCDate(t.getUTCDate() + offsetDays);
    t.setUTCHours(2, 0, 0, 0);
    const s = Math.floor(t.getTime() / 1000);
    return {
      request_key: crypto.randomUUID(),
      room_id: 'floor2',
      activity_name: 'ทดสอบลบ',
      project_name: 'โครงการ',
      coordinator_name: 'สุดา',
      coordinator_phone: '0891234567',
      meeting_type: 'seminar',
      attendees_count: 60,
      staff_count: 5,
      table_layout: 'classroom',
      vvip_seats: 0,
      vip_seats: 0,
      items: [{ item_code: 'lunch_set', quantity: 2 }],
      starts_at: s,
      ends_at: s + 3 * 3600,
    } as CreateBookingPayload;
  };

  const del = (id: string, token?: string) =>
    DELETE(
      new NextRequest(`http://localhost:3000/api/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: token ? { cookie: `admin_session=${token}` } : {},
      }),
      { params: Promise.resolve({ id }) }
    );

  const count = async (table: string, id: string) =>
    (await db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE booking_id = ?`).bind(id).first<{ c: number }>())!.c;

  const makeBooking = async (offsetDays: number, finalStatus?: 'cancelled' | 'rejected' | 'approved') => {
    const { booking } = await createBookingAtomic(db, payload(offsetDays));
    if (finalStatus === 'cancelled') await updateBookingStatus(db, booking.id, 'pending', 'cancelled', 'a1', 'ยกเลิก');
    if (finalStatus === 'rejected') await updateBookingStatus(db, booking.id, 'pending', 'rejected', 'a1', 'เหตุผล');
    if (finalStatus === 'approved') await updateBookingStatus(db, booking.id, 'pending', 'approved', 'a1');
    return booking;
  };

  beforeEach(async () => {
    db = createMemoryD1Database();
    applyAllMigrations(db);
    setTestDatabase(db);
    superToken = await createSessionToken({ adminId: 'a1', username: 'chookait', displayName: 'ชูเกียรติ', role: 'superadmin' });
    adminToken = await createSessionToken({ adminId: 'a2', username: 'admin2', displayName: 'ผู้ดูแล', role: 'admin' });
    staffToken = await createSessionToken({ adminId: 'a3', username: 'staff3', displayName: 'เจ้าหน้าที่', role: 'staff' });
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('11.1 rejects unauthenticated delete with 401', async () => {
    const b = await makeBooking(3, 'cancelled');
    expect((await del(b.id)).status).toBe(401);
    expect(await count('booking_status_history', b.id)).toBeGreaterThan(0);
  });

  it('11.2 rejects admin and staff roles with 403 and keeps the booking', async () => {
    const b = await makeBooking(4, 'cancelled');
    expect((await del(b.id, adminToken)).status).toBe(403);
    expect((await del(b.id, staffToken)).status).toBe(403);
    const row = await db.prepare('SELECT id FROM bookings WHERE id = ?').bind(b.id).first();
    expect(row).not.toBeNull();
  });

  it('11.3 superadmin deletes a cancelled booking and all dependent rows', async () => {
    const b = await makeBooking(5, 'cancelled');
    expect(await count('booking_items', b.id)).toBeGreaterThan(0);
    expect(await count('booking_status_history', b.id)).toBeGreaterThan(0);
    expect(await count('notifications', b.id)).toBeGreaterThan(0);

    const res = await del(b.id, superToken);
    expect(res.status).toBe(200);

    expect(await db.prepare('SELECT id FROM bookings WHERE id = ?').bind(b.id).first()).toBeNull();
    for (const table of ['booking_items', 'booking_status_history', 'notifications', 'line_notifications']) {
      expect(await count(table, b.id)).toBe(0);
    }
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"event":"booking_deleted"'));
  });

  it('11.4 superadmin deletes a rejected booking', async () => {
    const b = await makeBooking(6, 'rejected');
    expect((await del(b.id, superToken)).status).toBe(200);
    expect(await db.prepare('SELECT id FROM bookings WHERE id = ?').bind(b.id).first()).toBeNull();
  });

  it('11.5 refuses to delete pending and approved bookings with 409', async () => {
    const pending = await makeBooking(7);
    const approved = await makeBooking(8, 'approved');
    expect((await del(pending.id, superToken)).status).toBe(409);
    expect((await del(approved.id, superToken)).status).toBe(409);
    expect(await db.prepare('SELECT id FROM bookings WHERE id = ?').bind(pending.id).first()).not.toBeNull();
    expect(await db.prepare('SELECT id FROM bookings WHERE id = ?').bind(approved.id).first()).not.toBeNull();
    expect(await count('booking_status_history', approved.id)).toBeGreaterThan(0);
  });

  it('11.6 returns 404 for an unknown booking id', async () => {
    expect((await del('does-not-exist', superToken)).status).toBe(404);
  });

  it('11.7 deleting one booking leaves other bookings untouched', async () => {
    const keep = await makeBooking(9, 'cancelled');
    const drop = await makeBooking(10, 'cancelled');
    expect((await del(drop.id, superToken)).status).toBe(200);
    expect(await db.prepare('SELECT id FROM bookings WHERE id = ?').bind(keep.id).first()).not.toBeNull();
    expect(await count('booking_status_history', keep.id)).toBeGreaterThan(0);
  });
});
