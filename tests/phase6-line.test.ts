import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { createSessionToken } from '../lib/auth';
import { createBookingAtomic, updateBookingStatus } from '../lib/booking-service';
import {
  buildLineFlexMessage,
  sendLineApprovedNotification,
  formatThaiDateTimeRange,
  BookingWithDetails,
} from '../lib/line-service';
import { PATCH as statusPATCH } from '../app/api/bookings/[id]/status/route';
import { NextRequest } from 'next/server';

describe('Phase 6: LINE Messaging API Integration (Strictly Approved-Only)', () => {
  let db: D1Database;
  const migrationSql = fs.readFileSync(path.join(process.cwd(), 'migrations', '0001_initial_schema.sql'), 'utf8');

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(2, 0, 0, 0);
  const startEpoch = Math.floor(tomorrow.getTime() / 1000);
  const endEpoch = startEpoch + 3 * 3600;

  const originalEnv = process.env;

  beforeEach(async () => {
    db = createMemoryD1Database();
    await db.exec(migrationSql);
    setTestDatabase(db);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('6.1 should format Thai date and time correctly for Lampang timezone', () => {
    // 2026-10-31 02:00:00 UTC = 09:00:00 Bangkok (+7)
    const start = Math.floor(new Date('2026-10-31T02:00:00Z').getTime() / 1000);
    const end = Math.floor(new Date('2026-10-31T05:00:00Z').getTime() / 1000); // 12:00 Bangkok

    const { dateStr, timeStr } = formatThaiDateTimeRange(start, end);

    expect(dateStr).toContain('วันเสาร์ที่ 31 ต.ค. 2569');
    expect(timeStr).toBe('09:00 - 12:00 น. (3 ชม.)');
  });

  it('6.2 should construct valid Suan Dusit purple & gold Flex Message with full details', () => {
    const booking: BookingWithDetails = {
      id: 'booking-test-id',
      booking_code: 'BK-202610-TEST',
      room_id: 'floor2',
      activity_name: 'การประชุมวิชาการระดับชาติ ประจำปี 2569',
      project_name: 'โครงการวิชาการ',
      coordinator_name: 'อาจารย์สุดารัตน์ พงษ์เพชร',
      coordinator_phone: '0812345678',
      coordinator_line_id: 'sudarat.p',
      meeting_type: 'seminar',
      attendees_count: 80,
      staff_count: 5,
      table_layout: 'theater',
      vvip_seats: 10,
      vip_seats: 20,
      starts_at: startEpoch,
      ends_at: endEpoch,
      status: 'approved',
      total_price_thb: 5500,
      items: [
        { item_code: 'lunch_set', item_name: 'ชุดสำหรับ 1 ท่าน', quantity: 50, subtotal: 7500 },
        { item_code: 'water600', item_name: 'น้ำเปล่า 600 mL', quantity: 50, subtotal: 250 },
      ],
    };

    const flexMsg = buildLineFlexMessage(booking) as any;

    expect(flexMsg.type).toBe('flex');
    expect(flexMsg.altText).toContain('[อนุมัติแล้ว] การจองห้องประชุม');
    expect(flexMsg.contents.header.backgroundColor).toBe('#582c83'); // Suan Dusit Purple
    expect(flexMsg.contents.header.contents[0].contents[0].color).toBe('#cba052'); // Gold accent

    const jsonStr = JSON.stringify(flexMsg);
    expect(jsonStr).toContain('หอประชุมชั้น 2');
    expect(jsonStr).toContain('การประชุมวิชาการระดับชาติ');
    expect(jsonStr).toContain('BK-202610-TEST');
    expect(jsonStr).toContain('อาจารย์สุดารัตน์');
    expect(jsonStr).toContain('081-234-5678');
    expect(jsonStr).toContain('VVIP: 10 ที่นั่ง | VIP: 20 ที่นั่ง');
    expect(jsonStr).toContain('มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง');
  });

  it('6.3 should record failed status when LINE credentials are missing in env without throwing', async () => {
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    delete process.env.LINE_GROUP_ID;

    const { booking } = await createBookingAtomic(db, {
      request_key: 'line-test-1',
      room_id: 'floor2',
      activity_name: 'ประชุมทดสอบ LINE',
      project_name: 'โครงการทดสอบ',
      coordinator_name: 'ทดสอบ ผู้ประสาน',
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

    // Approve booking (inserts queue into line_notifications)
    await updateBookingStatus(db, booking.id, 'pending', 'approved', 'admin-1');

    const result = await sendLineApprovedNotification(db, booking.id);
    expect(result.success).toBe(false);
    expect(result.error).toContain('LINE credentials missing');

    const queueRow = await db
      .prepare('SELECT status, error_message, attempts FROM line_notifications WHERE booking_id = ?')
      .bind(booking.id)
      .first<{ status: string; error_message: string; attempts: number }>();

    expect(queueRow?.status).toBe('failed');
    expect(queueRow?.attempts).toBe(1);
    expect(queueRow?.error_message).toContain('LINE credentials');
  });

  it('6.4 should successfully send LINE Push message with X-Line-Retry-Key when approved', async () => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-mock-token-xyz';
    process.env.LINE_GROUP_ID = 'Cde89a0f1920dc6402fb558c99142326d';

    let interceptedRequest: any = null;

    // Mock fetch for LINE API
    vi.stubGlobal('fetch', async (url: string, init: any) => {
      interceptedRequest = {
        url,
        headers: new Headers(init.headers),
        body: JSON.parse(init.body),
      };
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const { booking } = await createBookingAtomic(db, {
      request_key: 'line-test-success',
      room_id: 'floor7',
      activity_name: 'สัมมนาการศึกษาลำปาง',
      project_name: 'พัฒนาลำปาง',
      coordinator_name: 'สุชาติ',
      coordinator_phone: '0898765432',
      meeting_type: 'seminar',
      attendees_count: 100,
      staff_count: 5,
      table_layout: 'classroom',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    await updateBookingStatus(db, booking.id, 'pending', 'approved', 'admin-1');

    const result = await sendLineApprovedNotification(db, booking.id);

    expect(result.success).toBe(true);
    expect(interceptedRequest).not.toBeNull();
    expect(interceptedRequest?.url).toBe('https://api.line.me/v2/bot/message/push');
    expect(interceptedRequest?.headers.get('Authorization')).toBe('Bearer test-mock-token-xyz');
    expect(interceptedRequest?.headers.get('X-Line-Retry-Key')).toBeTruthy();
    expect(interceptedRequest?.body.to).toBe('Cde89a0f1920dc6402fb558c99142326d');
    expect(interceptedRequest?.body.messages[0].type).toBe('flex');

    // Verify DB queue marked as sent
    const queueRow = await db
      .prepare('SELECT status, sent_at, attempts FROM line_notifications WHERE booking_id = ?')
      .bind(booking.id)
      .first<{ status: string; sent_at: number; attempts: number }>();

    expect(queueRow?.status).toBe('sent');
    expect(queueRow?.sent_at).toBeGreaterThan(0);
    expect(queueRow?.attempts).toBe(1);
  });

  it('6.5 should ensure idempotency and skip sending if already marked sent', async () => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-mock-token-xyz';
    process.env.LINE_GROUP_ID = 'Cde89a0f1920dc6402fb558c99142326d';

    let fetchCallCount = 0;
    vi.stubGlobal('fetch', async () => {
      fetchCallCount++;
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const { booking } = await createBookingAtomic(db, {
      request_key: 'line-idempotent-test',
      room_id: 'floor2',
      activity_name: 'สัมมนาการเงิน',
      project_name: 'การเงิน',
      coordinator_name: 'กานดา',
      coordinator_phone: '0811223344',
      meeting_type: 'seminar',
      attendees_count: 50,
      staff_count: 3,
      table_layout: 'theater',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    await updateBookingStatus(db, booking.id, 'pending', 'approved', 'admin-1');

    // First call: sends
    const res1 = await sendLineApprovedNotification(db, booking.id);
    expect(res1.success).toBe(true);
    expect(res1.skipped).toBeUndefined();
    expect(fetchCallCount).toBe(1);

    // Second call: skips!
    const res2 = await sendLineApprovedNotification(db, booking.id);
    expect(res2.success).toBe(true);
    expect(res2.skipped).toBe(true);
    expect(fetchCallCount).toBe(1); // Not called again!
  });

  it('6.6 should NEVER trigger LINE notification on rejection or cancellation', async () => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
    process.env.LINE_GROUP_ID = 'group-123';

    let fetchCallCount = 0;
    vi.stubGlobal('fetch', async () => {
      fetchCallCount++;
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const token = await createSessionToken({
      adminId: 'admin-1',
      username: 'chookait',
      displayName: 'นายชูเกียรติ กุศลสถิตย์',
    });

    const { booking } = await createBookingAtomic(db, {
      request_key: 'line-never-reject',
      room_id: 'floor2',
      activity_name: 'งานปฏิเสธ',
      project_name: 'ปฏิเสธ',
      coordinator_name: 'สมศรี',
      coordinator_phone: '0812345678',
      meeting_type: 'seminar',
      attendees_count: 20,
      staff_count: 2,
      table_layout: 'boardroom',
      vvip_seats: 0,
      vip_seats: 0,
      items: [],
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    // Rejection via PATCH /api/bookings/[id]/status
    const rejectReq = new NextRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `admin_session=${token}`,
      },
      body: JSON.stringify({
        from_status: 'pending',
        to_status: 'rejected',
        reason: 'ห้องไม่พร้อมใช้งานเนื่องจากปิดปรับปรุงระบบเสียง',
      }),
    });

    const res = await statusPATCH(rejectReq, { params: Promise.resolve({ id: booking.id }) });
    expect(res.status).toBe(200);

    // Verify NO LINE fetch occurred
    expect(fetchCallCount).toBe(0);

    // Verify NO row exists in line_notifications
    const queueRows = await db
      .prepare('SELECT * FROM line_notifications WHERE booking_id = ?')
      .bind(booking.id)
      .all();
    expect(queueRows.results).toHaveLength(0);
  });

  it('6.7 should trigger LINE push via API route when approving booking', async () => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
    process.env.LINE_GROUP_ID = 'group-123';

    let pushTargetGroup = '';
    vi.stubGlobal('fetch', async (url: string, init: any) => {
      if (url.includes('api.line.me')) {
        const body = JSON.parse(init.body);
        pushTargetGroup = body.to;
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const token = await createSessionToken({
      adminId: 'admin-1',
      username: 'chookait',
      displayName: 'นายชูเกียรติ กุศลสถิตย์',
    });

    const { booking } = await createBookingAtomic(db, {
      request_key: 'line-api-approval',
      room_id: 'floor2',
      activity_name: 'อนุมัติผ่าน API โดยตรง',
      project_name: 'โครงการหลัก',
      coordinator_name: 'สมศักดิ์',
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

    const approveReq = new NextRequest(`http://localhost:3000/api/bookings/${booking.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `admin_session=${token}`,
      },
      body: JSON.stringify({
        from_status: 'pending',
        to_status: 'approved',
      }),
    });

    const res = await statusPATCH(approveReq, { params: Promise.resolve({ id: booking.id }) });
    const data: any = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('approved');
    expect(data.line_notification?.success).toBe(true);
    expect(pushTargetGroup).toBe('group-123');
  });
});
