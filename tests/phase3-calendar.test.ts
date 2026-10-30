import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { GET } from '../app/api/calendar/route';
import { createBookingAtomic, updateBookingStatus } from '../lib/booking-service';
import { NextRequest } from 'next/server';

describe('Phase 3: Public Calendar & Event Filtering Verification', () => {
  let db: D1Database;
  const migrationSql = fs.readFileSync(path.join(process.cwd(), 'migrations', '0001_initial_schema.sql'), 'utf8');

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(2, 0, 0, 0); // 09:00 Bangkok
  const startEpoch = Math.floor(tomorrow.getTime() / 1000);
  const endEpoch = startEpoch + 3 * 3600;

  beforeEach(async () => {
    db = createMemoryD1Database();
    await db.exec(migrationSql);
    setTestDatabase(db);
  });

  it('3.1 should return public calendar events and strictly omit coordinator PII', async () => {
    // Insert a booking with sensitive PII
    await createBookingAtomic(db, {
      request_key: 'cal-test-req-1',
      room_id: 'floor2',
      activity_name: 'ประชุมเครือข่ายวิจัยล้านนา',
      project_name: 'โครงการวิจัยสถาบัน',
      coordinator_name: 'นายความลับ สุดยอด',
      coordinator_phone: '0899999999',
      coordinator_line_id: 'secret_line_id',
      meeting_type: 'seminar',
      attendees_count: 50,
      staff_count: 5,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      starts_at: startEpoch,
      ends_at: endEpoch,
      items: [],
    });

    const req = new NextRequest('http://localhost:3000/api/calendar');
    const res = await GET(req);
    const data: any = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toHaveLength(1);

    const event = data.events[0];
    expect(event.activity_name).toBe('ประชุมเครือข่ายวิจัยล้านนา');
    expect(event.room_id).toBe('floor2');
    expect(event.room_name).toBe('หอประชุมชั้น 2');
    expect(event.status).toBe('pending');

    // Strict PII checks: ensure NO coordinator PII is exposed!
    expect(event.coordinator_name).toBeUndefined();
    expect(event.coordinator_phone).toBeUndefined();
    expect(event.coordinator_line_id).toBeUndefined();
    expect(event.total_price_thb).toBeUndefined();
  });

  it('3.2 should filter calendar events by room_id', async () => {
    // Booking in floor2
    await createBookingAtomic(db, {
      request_key: 'cal-f2',
      room_id: 'floor2',
      activity_name: 'งานชั้น 2',
      project_name: 'โครงการ 1',
      coordinator_name: 'ผู้จัด 1',
      coordinator_phone: '0811111111',
      meeting_type: 'seminar',
      attendees_count: 50,
      staff_count: 0,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      starts_at: startEpoch,
      ends_at: endEpoch,
      items: [],
    });

    // Booking in floor7
    await createBookingAtomic(db, {
      request_key: 'cal-f7',
      room_id: 'floor7',
      activity_name: 'งานชั้น 7',
      project_name: 'โครงการ 2',
      coordinator_name: 'ผู้จัด 2',
      coordinator_phone: '0822222222',
      meeting_type: 'seminar',
      attendees_count: 150,
      staff_count: 0,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      starts_at: startEpoch,
      ends_at: endEpoch,
      items: [],
    });

    // Filter by floor2
    const reqF2 = new NextRequest('http://localhost:3000/api/calendar?room_id=floor2');
    const resF2 = await GET(reqF2);
    const dataF2: any = await resF2.json();
    expect(dataF2.events).toHaveLength(1);
    expect(dataF2.events[0].room_id).toBe('floor2');

    // Filter by floor7
    const reqF7 = new NextRequest('http://localhost:3000/api/calendar?room_id=floor7');
    const resF7 = await GET(reqF7);
    const dataF7: any = await resF7.json();
    expect(dataF7.events).toHaveLength(1);
    expect(dataF7.events[0].room_id).toBe('floor7');

    // All rooms
    const reqAll = new NextRequest('http://localhost:3000/api/calendar?room_id=all');
    const resAll = await GET(reqAll);
    const dataAll: any = await resAll.json();
    expect(dataAll.events).toHaveLength(2);
  });

  it('3.3 should filter calendar events by status', async () => {
    const { booking } = await createBookingAtomic(db, {
      request_key: 'cal-status-1',
      room_id: 'floor2',
      activity_name: 'งานจะอนุมัติ',
      project_name: 'โครงการ 1',
      coordinator_name: 'ผู้จัด 1',
      coordinator_phone: '0811111111',
      meeting_type: 'seminar',
      attendees_count: 50,
      staff_count: 0,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      starts_at: startEpoch,
      ends_at: endEpoch,
      items: [],
    });

    // Update to approved
    await updateBookingStatus(db, booking.id, 'pending', 'approved', 'admin_chookait');

    // Filter by approved
    const reqAppr = new NextRequest('http://localhost:3000/api/calendar?status=approved');
    const resAppr = await GET(reqAppr);
    const dataAppr: any = await resAppr.json();
    expect(dataAppr.events).toHaveLength(1);
    expect(dataAppr.events[0].status).toBe('approved');

    // Filter by pending -> should be 0
    const reqPend = new NextRequest('http://localhost:3000/api/calendar?status=pending');
    const resPend = await GET(reqPend);
    const dataPend: any = await resPend.json();
    expect(dataPend.events).toHaveLength(0);
  });
});
