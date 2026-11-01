import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { createSessionToken } from '../lib/auth';
import { createBookingAtomic, updateBookingStatus } from '../lib/booking-service';
import { GET as notificationsGET } from '../app/api/notifications/route';
import { PATCH as markReadPATCH } from '../app/api/notifications/[id]/read/route';
import { NextRequest } from 'next/server';

describe('Phase 5: Web App Admin Notifications & In-App Alerts', () => {
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

  it('5.1 should reject unauthenticated request to /api/notifications with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications');
    const res = await notificationsGET(req);
    expect(res.status).toBe(401);
  });

  it('5.2 should reject invalid session token with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/notifications', {
      headers: {
        cookie: 'admin_session=invalid-token-signature',
      },
    });
    const res = await notificationsGET(req);
    expect(res.status).toBe(401);
  });

  it('5.3 should return empty notifications list and 0 unread when none exist', async () => {
    const token = await createSessionToken({
      adminId: 'admin-1',
      username: 'chookait',
      displayName: 'นายชูเกียรติ กุศลสถิตย์',
    });

    const req = new NextRequest('http://localhost:3000/api/notifications', {
      headers: { cookie: `admin_session=${token}` },
    });

    const res = await notificationsGET(req);
    const data: any = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.unread_count).toBe(0);
    expect(data.notifications).toHaveLength(0);
  });

  it('5.4 should register pending notification upon booking creation', async () => {
    const { booking } = await createBookingAtomic(db, {
      request_key: 'notif-test-1',
      room_id: 'floor2',
      activity_name: 'ประชุมสภาวิชาการสัญจร',
      project_name: 'โครงการบริหารทั่วไป',
      coordinator_name: 'อาจารย์สุดารัตน์',
      coordinator_phone: '0812345678',
      meeting_type: 'seminar',
      attendees_count: 50,
      staff_count: 5,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    const token = await createSessionToken({
      adminId: 'admin-1',
      username: 'chookait',
      displayName: 'นายชูเกียรติ กุศลสถิตย์',
    });

    const req = new NextRequest('http://localhost:3000/api/notifications', {
      headers: { cookie: `admin_session=${token}` },
    });

    const res = await notificationsGET(req);
    const data: any = await res.json();

    expect(res.status).toBe(200);
    expect(data.unread_count).toBe(1);
    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].event_type).toBe('pending');
    expect(data.notifications[0].booking_code).toBe(booking.booking_code);
    expect(data.notifications[0].activity_name).toBe('ประชุมสภาวิชาการสัญจร');
    expect(data.notifications[0].is_read).toBe(0);
  });

  it('5.5 should mark a specific notification as read', async () => {
    await createBookingAtomic(db, {
      request_key: 'notif-test-2',
      room_id: 'floor2',
      activity_name: 'งานปฐมนิเทศนักศึกษา',
      project_name: 'โครงการพัฒนานักศึกษา',
      coordinator_name: 'อาจารย์สุดารัตน์',
      coordinator_phone: '0812345678',
      meeting_type: 'seminar',
      attendees_count: 40,
      staff_count: 4,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    const token = await createSessionToken({
      adminId: 'admin-1',
      username: 'chookait',
      displayName: 'นายชูเกียรติ กุศลสถิตย์',
    });

    // Fetch notification to get ID
    const fetchReq = new NextRequest('http://localhost:3000/api/notifications', {
      headers: { cookie: `admin_session=${token}` },
    });
    const fetchRes = await notificationsGET(fetchReq);
    const fetchData: any = await fetchRes.json();
    const notifId = fetchData.notifications[0].id;

    // PATCH /api/notifications/[id]/read
    const patchReq = new NextRequest(`http://localhost:3000/api/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
    });
    const patchRes = await markReadPATCH(patchReq, {
      params: Promise.resolve({ id: notifId }),
    });
    const patchData: any = await patchRes.json();

    expect(patchRes.status).toBe(200);
    expect(patchData.success).toBe(true);

    // Verify unread count becomes 0
    const verifyReq = new NextRequest('http://localhost:3000/api/notifications', {
      headers: { cookie: `admin_session=${token}` },
    });
    const verifyRes = await notificationsGET(verifyReq);
    const verifyData: any = await verifyRes.json();

    expect(verifyData.unread_count).toBe(0);
    expect(verifyData.notifications[0].is_read).toBe(1);
  });

  it('5.6 should mark all notifications as read when id=all', async () => {
    // Create 2 bookings at different times
    await createBookingAtomic(db, {
      request_key: 'notif-all-1',
      room_id: 'floor2',
      activity_name: 'อบรมการใช้งานโปรแกรม',
      project_name: 'โครงการไอที',
      coordinator_name: 'สมชาย',
      coordinator_phone: '0812345678',
      meeting_type: 'seminar',
      attendees_count: 30,
      staff_count: 2,
      table_layout: 'classroom',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    await createBookingAtomic(db, {
      request_key: 'notif-all-2',
      room_id: 'floor7',
      activity_name: 'สัมมนาการศึกษา',
      project_name: 'โครงการวิชาการ',
      coordinator_name: 'สมหญิง',
      coordinator_phone: '0898765432',
      meeting_type: 'seminar',
      attendees_count: 150,
      staff_count: 10,
      table_layout: 'classroom',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    const token = await createSessionToken({
      adminId: 'admin-1',
      username: 'chookait',
      displayName: 'นายชูเกียรติ กุศลสถิตย์',
    });

    // Check count is 2
    const fetchReq = new NextRequest('http://localhost:3000/api/notifications', {
      headers: { cookie: `admin_session=${token}` },
    });
    const fetchRes = await notificationsGET(fetchReq);
    const fetchData: any = await fetchRes.json();
    expect(fetchData.unread_count).toBe(2);

    // Read all
    const patchAllReq = new NextRequest('http://localhost:3000/api/notifications/all/read', {
      method: 'PATCH',
      headers: { cookie: `admin_session=${token}` },
    });
    const patchAllRes = await markReadPATCH(patchAllReq, {
      params: Promise.resolve({ id: 'all' }),
    });
    expect(patchAllRes.status).toBe(200);

    // Verify both are read
    const verifyRes = await notificationsGET(fetchReq);
    const verifyData: any = await verifyRes.json();
    expect(verifyData.unread_count).toBe(0);
    expect(verifyData.notifications.every((n: any) => n.is_read === 1)).toBe(true);
  });

  it('5.7 should record new notifications when booking status is updated to approved or rejected', async () => {
    const { booking } = await createBookingAtomic(db, {
      request_key: 'notif-lifecycle',
      room_id: 'floor2',
      activity_name: 'ประชุมคณะกรรมการ',
      project_name: 'บริหาร',
      coordinator_name: 'ประสานงาน',
      coordinator_phone: '0812345678',
      meeting_type: 'small_group',
      attendees_count: 20,
      staff_count: 2,
      table_layout: 'boardroom',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    // Transition to approved
    await updateBookingStatus(db, booking.id, 'pending', 'approved', 'admin-1');

    const token = await createSessionToken({
      adminId: 'admin-1',
      username: 'chookait',
      displayName: 'นายชูเกียรติ กุศลสถิตย์',
    });

    const fetchReq = new NextRequest('http://localhost:3000/api/notifications', {
      headers: { cookie: `admin_session=${token}` },
    });
    const fetchRes = await notificationsGET(fetchReq);
    const fetchData: any = await fetchRes.json();

    // Should have 2 notifications: pending and approved
    expect(fetchData.notifications).toHaveLength(2);
    expect(fetchData.notifications[0].event_type).toBe('approved');
    expect(fetchData.notifications[1].event_type).toBe('pending');
  });
});
