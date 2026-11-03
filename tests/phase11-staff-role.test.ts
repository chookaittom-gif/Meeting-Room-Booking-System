import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { createSessionToken } from '../lib/auth';
import { POST as usersPOST } from '../app/api/admin/users/route';
import { PATCH as userPATCH } from '../app/api/admin/users/[id]/route';
import { POST as loginPOST } from '../app/api/admin/login/route';
import { GET as bookingsGET } from '../app/api/admin/bookings/route';
import { PATCH as statusPATCH } from '../app/api/bookings/[id]/status/route';
import { PATCH as settingsPATCH } from '../app/api/admin/settings/route';
import { createBookingAtomic } from '../lib/booking-service';
import { NextRequest } from 'next/server';

describe('Phase 11: Staff (Catering / Read-Only) Role & Permissions', () => {
  let db: D1Database;

  beforeEach(async () => {
    db = createMemoryD1Database();
    applyAllMigrations(db);
    setTestDatabase(db);
  });

  async function makeRequest(
    url: string,
    options: { method?: string; body?: any; token?: string } = {}
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.token) {
      headers['cookie'] = `admin_session=${options.token}`;
    }
    return new NextRequest(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  }

  it('11.1 Superadmin can create a new staff account', async () => {
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });

    const req = await makeRequest('http://localhost:3000/api/admin/users', {
      method: 'POST',
      token: superadminToken,
      body: {
        username: 'catering_staff',
        displayName: 'สมหญิง ฝ่ายโภชนาการ',
        password: 'Password1234',
        role: 'staff',
      },
    });

    const res = await usersPOST(req);
    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('staff');

    // Verify stored in DB
    const row = await db.prepare('SELECT role FROM admins WHERE username = ?').bind('catering_staff').first<{ role: string }>();
    expect(row?.role).toBe('staff');
  });

  it('11.2 Superadmin can change existing admin to staff and back', async () => {
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });

    // Change admin_nathlada to staff
    const req1 = await makeRequest('http://localhost:3000/api/admin/users/admin_nathlada', {
      method: 'PATCH',
      token: superadminToken,
      body: {
        role: 'staff',
      },
    });
    const res1 = await userPATCH(req1, { params: Promise.resolve({ id: 'admin_nathlada' }) });
    expect(res1.status).toBe(200);

    const row1 = await db.prepare('SELECT role FROM admins WHERE id = ?').bind('admin_nathlada').first<{ role: string }>();
    expect(row1?.role).toBe('staff');

    // Cannot change chookait to staff
    const reqChookait = await makeRequest('http://localhost:3000/api/admin/users/admin_chookait', {
      method: 'PATCH',
      token: superadminToken,
      body: {
        role: 'staff',
      },
    });
    const resChookait = await userPATCH(reqChookait, { params: Promise.resolve({ id: 'admin_chookait' }) });
    expect(resChookait.status).toBe(400);
  });

  it('11.3 Staff user can login and gets role staff in session', async () => {
    // Create staff account first
    const superadminToken = await createSessionToken({
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
      role: 'superadmin',
    });
    await usersPOST(
      await makeRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        token: superadminToken,
        body: {
          username: 'chef_somchai',
          displayName: 'เชฟสมชาย',
          password: 'Password1234',
          role: 'staff',
        },
      })
    );

    // Login as staff
    const loginReq = await makeRequest('http://localhost:3000/api/admin/login', {
      method: 'POST',
      body: {
        username: 'chef_somchai',
        password: 'Password1234',
      },
    });
    const loginRes = await loginPOST(loginReq);
    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as any;
    expect(loginData.admin.role).toBe('staff');
  });

  it('11.4 Staff can view bookings with catering items, but cannot approve/reject', async () => {
    // Create a booking with catering items
    const t = new Date();
    t.setUTCDate(t.getUTCDate() + 1);
    t.setUTCHours(2, 0, 0, 0); // 09:00 ICT
    const startsAt = Math.floor(t.getTime() / 1000);
    const endsAt = startsAt + 7200; // 11:00 ICT

    const { booking } = await createBookingAtomic(db, {
      request_key: 'req-catering-test-1',
      room_id: 'floor7',
      activity_name: 'อบรมเชิงปฏิบัติการพร้อมอาหารกลางวัน',
      project_name: 'โครงการศูนย์อาหาร',
      coordinator_name: 'อาจารย์สุดา',
      coordinator_phone: '0812345678',
      meeting_type: 'seminar',
      attendees_count: 50,
      staff_count: 5,
      table_layout: 'classroom',
      vvip_seats: 0,
      vip_seats: 5,
      starts_at: startsAt,
      ends_at: endsAt,
      items: [
        { item_code: 'buffet150', quantity: 50 },
        { item_code: 'tea1', quantity: 50 },
      ],
    });

    const staffToken = await createSessionToken({
      adminId: 'admin_staff_1',
      username: 'chef_somchai',
      displayName: 'เชฟสมชาย',
      role: 'staff',
    });

    // 1. Staff can view bookings
    const viewReq = await makeRequest('http://localhost:3000/api/admin/bookings', {
      token: staffToken,
    });
    const viewRes = await bookingsGET(viewReq);
    expect(viewRes.status).toBe(200);
    const viewData = (await viewRes.json()) as any;
    expect(viewData.bookings.length).toBeGreaterThanOrEqual(1);
    const targetBooking = viewData.bookings.find((b: any) => b.id === booking.id);
    expect(targetBooking.items.length).toBe(2);
    expect(targetBooking.items[0].quantity).toBe(50);

    // 2. Staff cannot approve booking -> 403 Forbidden
    const approveReq = await makeRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: {
        from_status: 'pending',
        to_status: 'approved',
      },
    });
    const approveRes = await statusPATCH(approveReq, { params: Promise.resolve({ id: booking.id }) });
    expect(approveRes.status).toBe(403);
    const approveData = (await approveRes.json()) as any;
    expect(approveData.error).toContain('Staff');

    // 3. Staff cannot modify LINE settings -> 403 Forbidden
    const settingsReq = await makeRequest('http://localhost:3000/api/admin/settings', {
      method: 'PATCH',
      token: staffToken,
      body: {
        line_notify_enabled: false,
      },
    });
    const settingsRes = await settingsPATCH(settingsReq);
    expect(settingsRes.status).toBe(403);
  });
});
