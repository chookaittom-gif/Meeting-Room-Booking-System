import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { createSessionToken } from '../lib/auth';
import { createBookingAtomic } from '../lib/booking-service';
import { POST as loginPOST } from '../app/api/admin/login/route';
import { POST as logoutPOST } from '../app/api/admin/logout/route';
import { GET as meGET } from '../app/api/admin/me/route';
import { GET as bookingsGET } from '../app/api/admin/bookings/route';
import { PATCH as statusPATCH } from '../app/api/bookings/[id]/status/route';
import { NextRequest } from 'next/server';

describe('Phase 4: Admin Authentication, Authorization, & Cancellation Flow', () => {
  let db: D1Database;

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(2, 0, 0, 0);
  const startEpoch = Math.floor(tomorrow.getTime() / 1000);
  const endEpoch = startEpoch + 3 * 3600;

  beforeEach(async () => {
    db = createMemoryD1Database();
    applyAllMigrations(db);
    setTestDatabase(db);
  });

  // 1. Login Tests
  it('4.1 should authenticate admin with valid credentials and set HttpOnly session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'chookait', password: 'Admin@1234' }),
    });

    const res = await loginPOST(req);
    const data: any = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.admin.username).toBe('chookait');
    expect(res.cookies.get('admin_session')).toBeDefined();
  });

  it('4.2 should reject admin login with invalid password', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'chookait', password: 'WrongPassword999' }),
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });

  it('4.3 should reject admin login with non-existent username', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ghost_user', password: 'Admin@1234' }),
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });

  // 2. Session verification & logout
  it('4.4 should verify session via GET /api/admin/me and clear via POST /api/admin/logout', async () => {
    const token = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
    });

    // Test me with token
    const reqMe = new NextRequest('http://localhost:3000/api/admin/me', {
      headers: { cookie: `admin_session=${token}` },
    });
    const resMe = await meGET(reqMe);
    const dataMe: any = await resMe.json();
    expect(resMe.status).toBe(200);
    expect(dataMe.authenticated).toBe(true);
    expect(dataMe.admin.username).toBe('chookait');

    // Test logout
    const resLogout = await logoutPOST();
    expect(resLogout.status).toBe(200);
  });

  // 3. Admin bookings list with PII
  it('4.5 should allow authenticated admin to view full bookings with PII and reject unauthenticated requests', async () => {
    // 1. Unauthenticated request -> 401
    const unauthReq = new NextRequest('http://localhost:3000/api/admin/bookings');
    const unauthRes = await bookingsGET(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Create a sample booking
    await createBookingAtomic(db, {
      request_key: 'admin-view-key',
      room_id: 'floor2',
      activity_name: 'งานสัมมนาส่วนตัว',
      project_name: 'โครงการพิเศษ',
      coordinator_name: 'นายผู้ประสานงาน ตัวจริง',
      coordinator_phone: '0812345678',
      coordinator_line_id: 'real_line_user',
      meeting_type: 'seminar',
      attendees_count: 50,
      staff_count: 5,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      starts_at: startEpoch,
      ends_at: endEpoch,
      items: [{ item_code: 'lunch_set', quantity: 50 }],
    });

    // 2. Authenticated request -> 200 with full coordinator PII
    const token = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
    });

    const authReq = new NextRequest('http://localhost:3000/api/admin/bookings', {
      headers: { cookie: `admin_session=${token}` },
    });
    const authRes = await bookingsGET(authReq);
    const authData: any = await authRes.json();

    expect(authRes.status).toBe(200);
    expect(authData.bookings).toHaveLength(1);
    const b = authData.bookings[0];
    expect(b.coordinator_name).toBe('นายผู้ประสานงาน ตัวจริง');
    expect(b.coordinator_phone).toBe('0812345678');
    expect(b.coordinator_line_id).toBe('real_line_user');
    expect(b.items).toHaveLength(1);
  });

  // 4. Status change and cancellation permissions
  it('4.6 should enforce admin permissions and valid status transitions on PATCH /api/bookings/[id]/status', async () => {
    const { booking } = await createBookingAtomic(db, {
      request_key: 'status-patch-key',
      room_id: 'floor2',
      activity_name: 'งานทดสอบเปลี่ยนสถานะ',
      project_name: 'โครงการ',
      coordinator_name: 'ผู้จัด',
      coordinator_phone: '0812345678',
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

    const token = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
    });

    // Case 1: Unauthenticated status update -> 401
    const unauthReq = new NextRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_status: 'pending', to_status: 'approved' }),
    });
    const unauthRes = await statusPATCH(unauthReq, { params: Promise.resolve({ id: booking.id }) });
    expect(unauthRes.status).toBe(401);

    // Case 2: Reject without reason -> 400
    const rejectNoReasonReq = new NextRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: `admin_session=${token}` },
      body: JSON.stringify({ from_status: 'pending', to_status: 'rejected', reason: '' }),
    });
    const resNoReason = await statusPATCH(rejectNoReasonReq, { params: Promise.resolve({ id: booking.id }) });
    expect(resNoReason.status).toBe(400);

    // Case 3: Approve -> 200
    const approveReq = new NextRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: `admin_session=${token}` },
      body: JSON.stringify({ from_status: 'pending', to_status: 'approved' }),
    });
    const resApprove = await statusPATCH(approveReq, { params: Promise.resolve({ id: booking.id }) });
    expect(resApprove.status).toBe(200);

    // Case 4: Stale from_status (trying to approve again when already approved) -> 409
    const staleReq = new NextRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: `admin_session=${token}` },
      body: JSON.stringify({ from_status: 'pending', to_status: 'approved' }),
    });
    const resStale = await statusPATCH(staleReq, { params: Promise.resolve({ id: booking.id }) });
    expect(resStale.status).toBe(409);

    // Case 5: Cancel approved booking -> 200
    const cancelReq = new NextRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', cookie: `admin_session=${token}` },
      body: JSON.stringify({ from_status: 'approved', to_status: 'cancelled', reason: 'ผู้จองขอยกเลิก' }),
    });
    const resCancel = await statusPATCH(cancelReq, { params: Promise.resolve({ id: booking.id }) });
    expect(resCancel.status).toBe(200);
  });
});
