import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import {
  createBookingAtomic,
  updateBookingStatus,
  BookingConflictError,
  ValidationError,
  StatusTransitionError,
  calculateTotalPrice,
  calculateRoomFee,
} from '../lib/booking-service';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../lib/auth';
import { CreateBookingPayload } from '../lib/types';

describe('Phase 1: Database Migration, Security, and Atomic Concurrency Tests', () => {
  let db: D1Database;
  const migrationSql = fs.readFileSync(path.join(process.cwd(), 'migrations', '0001_initial_schema.sql'), 'utf8');
  const rollbackSql = fs.readFileSync(path.join(process.cwd(), 'migrations', 'rollback', '0001_rollback_initial_schema.sql'), 'utf8');

  beforeEach(async () => {
    db = createMemoryD1Database();
    applyAllMigrations(db);
  });

  // -------------------------------------------------------------
  // 1. Migration & Rollback Tests
  // -------------------------------------------------------------
  it('1.1 should run migration and seed rooms and admins', async () => {
    const rooms = await db.prepare('SELECT * FROM rooms ORDER BY id ASC').all();
    expect(rooms.results).toHaveLength(2);
    expect(rooms.results[0].id).toBe('floor2');
    expect(rooms.results[0].capacity_max).toBe(250);
    expect(rooms.results[1].id).toBe('floor7');
    expect(rooms.results[1].capacity_max).toBe(450);

    const admins = await db.prepare('SELECT username, display_name FROM admins ORDER BY username ASC').all();
    expect(admins.results).toHaveLength(3);
    const usernames = admins.results.map((a: any) => a.username);
    expect(usernames).toEqual(['chookait', 'nathlada', 'pathaithep']);
  });

  it('1.2 should successfully rollback schema without errors', async () => {
    await db.exec(rollbackSql);
    // Verifying tables are dropped
    const checkTable = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings'").first();
    expect(checkTable).toBeNull();
  });

  // -------------------------------------------------------------
  // 2. Authentication & Security Tests
  // -------------------------------------------------------------
  it('2.1 should verify bcrypt hashed passwords for admins', async () => {
    const admin = await db.prepare('SELECT password_hash FROM admins WHERE username = ?').bind('chookait').first<{ password_hash: string }>();
    expect(admin).not.toBeNull();

    // Verify initial password 'Admin@1234'
    const isDefaultMatch = await verifyPassword('Admin@1234', admin!.password_hash);
    expect(isDefaultMatch).toBe(true);

    const isWrongMatch = await verifyPassword('WrongPassword!', admin!.password_hash);
    expect(isWrongMatch).toBe(false);
  });

  it('2.2 should sign and verify 8-hour admin session tokens', async () => {
    const sessionData = {
      adminId: 'admin_chookait',
      username: 'chookait',
      displayName: 'ชูเกียรติ กุศลสถิตย์',
    };

    const token = await createSessionToken(sessionData, 'my-test-secret');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(2);

    const verified = await verifySessionToken(token, 'my-test-secret');
    expect(verified).not.toBeNull();
    expect(verified?.username).toBe('chookait');
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

    // Tampered token check
    const tampered = token.slice(0, -4) + 'abcd';
    const tamperedRes = await verifySessionToken(tampered, 'my-test-secret');
    expect(tamperedRes).toBeNull();
  });

  // -------------------------------------------------------------
  // 3. Pricing Calculation Tests
  // -------------------------------------------------------------
  it('3.1 should calculate server-side prices accurately according to food catalog', () => {
    const items = [
      { item_code: 'lunch_set', quantity: 10 },    // 150 * 10 = 1500
      { item_code: 'water600', quantity: 20 },     // 5 * 20 = 100
      { item_code: 'chinese_table', quantity: 2 }, // 1800 * 2 = 3600
    ];

    const { total, detailedItems } = calculateTotalPrice(items);
    expect(total).toBe(5200);
    expect(detailedItems).toHaveLength(3);
    expect(detailedItems[0].subtotal).toBe(1500);
    expect(detailedItems[1].subtotal).toBe(100);
    expect(detailedItems[2].subtotal).toBe(3600);
  });

  // -------------------------------------------------------------
  // 4. Atomic Booking & Concurrency Tests
  // -------------------------------------------------------------
  // Tomorrow at 09:00 - 12:00 Bangkok time
  // Bangkok is UTC+7, so 09:00 Bangkok = 02:00 UTC
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(2, 0, 0, 0); // 09:00 Bangkok
  const startEpoch = Math.floor(tomorrow.getTime() / 1000);
  const endEpoch = startEpoch + 3 * 3600; // 12:00 Bangkok (3 hours duration)

  function makeValidPayload(overrides: Partial<CreateBookingPayload> = {}): CreateBookingPayload {
    return {
      request_key: crypto.randomUUID(),
      room_id: 'floor2',
      activity_name: 'การประชุมวิชาการประจำปี 2026',
      project_name: 'โครงการพัฒนาศักยภาพบุคลากร',
      coordinator_name: 'นายสมชาย ประสานงาน',
      coordinator_phone: '0812345678',
      coordinator_line_id: 'somchai_line',
      meeting_type: 'seminar',
      attendees_count: 80,
      staff_count: 10,
      table_layout: 'theater',
      vvip_seats: 5,
      vip_seats: 10,
      starts_at: startEpoch,
      ends_at: endEpoch,
      items: [
        { item_code: 'lunch_set', quantity: 80 },
        { item_code: 'water600', quantity: 80 },
      ],
      ...overrides,
    };
  }

  it('4.1 should create a valid booking and populate items & notifications', async () => {
    const payload = makeValidPayload();
    const result = await createBookingAtomic(db, payload);

    expect(result.isExisting).toBe(false);
    expect(result.booking.id).toBeDefined();
    expect(result.booking.booking_code).toMatch(/^BK-\d{6}-[A-Z0-9]{4}$/);
    expect(result.booking.status).toBe('pending');
    expect(result.booking.total_price_thb).toBe(80 * 150 + 80 * 5); // 12,400 THB

    // Check items inserted
    const items = await db.prepare('SELECT * FROM booking_items WHERE booking_id = ?').bind(result.booking.id).all();
    expect(items.results).toHaveLength(2);

    // Check initial notification for admin
    const notifs = await db.prepare('SELECT * FROM notifications WHERE booking_id = ?').bind(result.booking.id).all();
    expect(notifs.results).toHaveLength(1);
    expect(notifs.results[0].event_type).toBe('pending');
  });

  it('4.2 should be idempotent when submitting with duplicate request_key', async () => {
    const requestKey = 'unique-session-req-key-12345';
    const payload1 = makeValidPayload({ request_key: requestKey });
    const payload2 = makeValidPayload({ request_key: requestKey });

    const res1 = await createBookingAtomic(db, payload1);
    expect(res1.isExisting).toBe(false);

    const res2 = await createBookingAtomic(db, payload2);
    expect(res2.isExisting).toBe(true);
    expect(res2.booking.id).toBe(res1.booking.id);

    // Verify only ONE booking row exists in database
    const count = await db.prepare('SELECT COUNT(*) as c FROM bookings WHERE request_key = ?').bind(requestKey).first<{ c: number }>();
    expect(count?.c).toBe(1);
  });

  it('4.3 should atomically reject conflicting overlapping booking on same room (Concurrent Simulation)', async () => {
    // Request A: 09:00 - 12:00
    const payloadA = makeValidPayload({
      request_key: 'req-A',
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    // Request B: 10:00 - 13:00 (overlaps with A between 10:00 and 12:00!)
    const payloadB = makeValidPayload({
      request_key: 'req-B',
      starts_at: startEpoch + 3600,
      ends_at: endEpoch + 3600,
    });

    // Execute both in parallel
    const results = await Promise.allSettled([
      createBookingAtomic(db, payloadA),
      createBookingAtomic(db, payloadB),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Exactly one must succeed and one must fail with BookingConflictError
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect((failures[0] as PromiseRejectedResult).reason).toBeInstanceOf(BookingConflictError);
  });

  it('4.4 should allow adjacent back-to-back bookings (End A === Start B)', async () => {
    // Booking A: 09:00 - 11:00 (2 hours)
    const payloadA = makeValidPayload({
      request_key: 'req-adj-A',
      starts_at: startEpoch,
      ends_at: startEpoch + 7200,
    });

    // Booking B: 11:00 - 13:00 (2 hours, starts exactly when A ends)
    const payloadB = makeValidPayload({
      request_key: 'req-adj-B',
      starts_at: startEpoch + 7200,
      ends_at: startEpoch + 14400,
    });

    const resA = await createBookingAtomic(db, payloadA);
    const resB = await createBookingAtomic(db, payloadB);

    expect(resA.booking.id).toBeDefined();
    expect(resB.booking.id).toBeDefined();
    expect(resA.booking.ends_at).toBe(resB.booking.starts_at);
  });

  it('4.5 should allow simultaneous bookings on different rooms', async () => {
    // Booking on floor2: 09:00 - 12:00
    const payloadFloor2 = makeValidPayload({
      request_key: 'req-floor2',
      room_id: 'floor2',
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    // Booking on floor7 at the exact same time
    const payloadFloor7 = makeValidPayload({
      request_key: 'req-floor7',
      room_id: 'floor7',
      attendees_count: 250, // floor7 holds up to 300
      starts_at: startEpoch,
      ends_at: endEpoch,
    });

    const res2 = await createBookingAtomic(db, payloadFloor2);
    const res7 = await createBookingAtomic(db, payloadFloor7);

    expect(res2.booking.room_id).toBe('floor2');
    expect(res7.booking.room_id).toBe('floor7');
  });

  it('4.6 should enforce capacity validation excluding staff count', async () => {
    // Floor 2 max capacity is 250
    // Case 1: 251 attendees -> throws ValidationError
    const invalidPayload = makeValidPayload({
      room_id: 'floor2',
      attendees_count: 251,
      staff_count: 0,
    });
    await expect(createBookingAtomic(db, invalidPayload)).rejects.toThrow(ValidationError);

    // Case 2: 250 attendees + 30 staff -> SUCCEEDS (staff excluded from capacity check)
    const validWithStaff = makeValidPayload({
      request_key: 'staff-ok-req',
      room_id: 'floor2',
      attendees_count: 250,
      staff_count: 30,
    });
    const result = await createBookingAtomic(db, validWithStaff);
    expect(result.booking.attendees_count).toBe(250);
    expect(result.booking.staff_count).toBe(30);
  });

  it('4.7 should reject bookings outside 08:30 – 16:30 operating hours', async () => {
    // 08:00 Bangkok = 01:00 UTC (too early, starts before 08:30)
    const earlyDate = new Date();
    earlyDate.setUTCDate(earlyDate.getUTCDate() + 2);
    earlyDate.setUTCHours(1, 0, 0, 0); // 08:00 Bangkok
    const earlyStart = Math.floor(earlyDate.getTime() / 1000);

    await expect(
      createBookingAtomic(db, makeValidPayload({
        request_key: 'early-key',
        starts_at: earlyStart,
        ends_at: earlyStart + 7200, // 10:00 Bangkok
      }))
    ).rejects.toThrow('ช่วงเวลาให้บริการคือ 08:30 – 16:30 น.');

    // 15:00 - 17:00 Bangkok (ends after 16:30)
    const lateDate = new Date();
    lateDate.setUTCDate(lateDate.getUTCDate() + 2);
    lateDate.setUTCHours(8, 0, 0, 0); // 15:00 Bangkok
    const lateStart = Math.floor(lateDate.getTime() / 1000);

    await expect(
      createBookingAtomic(db, makeValidPayload({
        request_key: 'late-key',
        starts_at: lateStart,
        ends_at: lateStart + 7200, // 17:00 Bangkok
      }))
    ).rejects.toThrow('ช่วงเวลาให้บริการคือ 08:30 – 16:30 น.');
  });

  // -------------------------------------------------------------
  // 5. Status Transitions & Line Queue Tests
  // -------------------------------------------------------------
  it('5.1 should transition pending -> approved and queue LINE notification with retry key', async () => {
    const { booking } = await createBookingAtomic(db, makeValidPayload());

    await updateBookingStatus(db, booking.id, 'pending', 'approved', 'admin_chookait');

    const updated = await db.prepare('SELECT status FROM bookings WHERE id = ?').bind(booking.id).first<{ status: string }>();
    expect(updated?.status).toBe('approved');

    // LINE notification queue check
    const lineNotif = await db.prepare('SELECT * FROM line_notifications WHERE booking_id = ?').bind(booking.id).first<any>();
    expect(lineNotif).not.toBeNull();
    expect(lineNotif.status).toBe('pending');
    expect(lineNotif.retry_key).toBeDefined();
  });

  it('5.2 should transition approved -> cancelled and free up the room time', async () => {
    const { booking } = await createBookingAtomic(db, makeValidPayload({ request_key: 'will-cancel-key' }));

    // Approve first
    await updateBookingStatus(db, booking.id, 'pending', 'approved', 'admin_chookait');

    // Attempting another booking at same time fails
    await expect(
      createBookingAtomic(db, makeValidPayload({ request_key: 'clash-with-approved' }))
    ).rejects.toThrow(BookingConflictError);

    // Now cancel
    await updateBookingStatus(db, booking.id, 'approved', 'cancelled', 'admin_chookait', 'ยกเลิกตามคำขอของผู้จัด');

    const updated = await db.prepare('SELECT status FROM bookings WHERE id = ?').bind(booking.id).first<{ status: string }>();
    expect(updated?.status).toBe('cancelled');

    // Now that room is cancelled, a new booking at that exact same time MUST SUCCEED!
    const newBookingRes = await createBookingAtomic(db, makeValidPayload({ request_key: 'new-after-cancel' }));
    expect(newBookingRes.booking.id).toBeDefined();
    expect(newBookingRes.booking.status).toBe('pending');
  });

  it('5.3 should reject invalid status transitions (e.g. cancelled -> approved)', async () => {
    const { booking } = await createBookingAtomic(db, makeValidPayload());
    await updateBookingStatus(db, booking.id, 'pending', 'cancelled', 'admin_chookait', 'ผู้จองแจ้งขอยกเลิก');

    // Trying to transition from cancelled to approved must throw StatusTransitionError
    await expect(
      updateBookingStatus(db, booking.id, 'cancelled', 'approved', 'admin_chookait')
    ).rejects.toThrow(StatusTransitionError);
  });

  it('5.4 should require reason when rejecting a booking', async () => {
    const { booking } = await createBookingAtomic(db, makeValidPayload());

    // Without reason -> throws ValidationError
    await expect(
      updateBookingStatus(db, booking.id, 'pending', 'rejected', 'admin_chookait', '')
    ).rejects.toThrow(ValidationError);

    // With reason -> succeeds
    await updateBookingStatus(db, booking.id, 'pending', 'rejected', 'admin_chookait', 'ห้องปิดปรับปรุงระบบไฟ');
    const updated = await db.prepare('SELECT status FROM bookings WHERE id = ?').bind(booking.id).first<{ status: string }>();
    expect(updated?.status).toBe('rejected');
  });

  // -------------------------------------------------------------
  // 6. Client Bundle Secret Leak Check
  // -------------------------------------------------------------
  it('6.1 should verify no server secrets or D1 binding leaks exist in client build bundle', () => {
    const clientChunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');
    if (!fs.existsSync(clientChunksDir)) {
      // If client bundle has not been built yet, skip gracefully
      return;
    }

    const chunkFiles = fs.readdirSync(clientChunksDir).filter((f) => f.endsWith('.js'));
    const bannedPatterns = [
      'LINE_CHANNEL_ACCESS_TOKEN',
      'ADMIN_SESSION_SECRET',
      'password_hash',
      'suan-dusit-lampang-meeting-room-default-secret-key-2026',
    ];

    for (const chunk of chunkFiles) {
      const content = fs.readFileSync(path.join(clientChunksDir, chunk), 'utf8');
      for (const banned of bannedPatterns) {
        expect(content).not.toContain(banned);
      }
    }
  });

  // -------------------------------------------------------------
  // 7. Room Fee & Advance Booking Window Tests
  // -------------------------------------------------------------
  it('7.1 should calculate room fee and 50% deposit correctly for all rooms and meeting types', () => {
    // Floor 2
    expect(calculateRoomFee('floor2', 'seminar')).toEqual({
      roomFee: 15000,
      deposit: 7500,
      categoryLabel: 'อบรมสัมมนาทั่วไป',
    });
    expect(calculateRoomFee('floor2', 'small_group')).toEqual({
      roomFee: 15000,
      deposit: 7500,
      categoryLabel: 'อบรมสัมมนาทั่วไป',
    });
    expect(calculateRoomFee('floor2', 'wedding')).toEqual({
      roomFee: 20000,
      deposit: 10000,
      categoryLabel: 'จัดเลี้ยงและงานแต่งงาน',
    });
    expect(calculateRoomFee('floor2', 'internal')).toEqual({
      roomFee: 0,
      deposit: 0,
      categoryLabel: 'ประชุมภายในองค์กร',
    });

    // Floor 7
    expect(calculateRoomFee('floor7', 'seminar')).toEqual({
      roomFee: 30000,
      deposit: 15000,
      categoryLabel: 'อบรมสัมมนาทั่วไป',
    });
    expect(calculateRoomFee('floor7', 'small_group')).toEqual({
      roomFee: 30000,
      deposit: 15000,
      categoryLabel: 'อบรมสัมมนาทั่วไป',
    });
    expect(calculateRoomFee('floor7', 'wedding')).toEqual({
      roomFee: 35000,
      deposit: 17500,
      categoryLabel: 'จัดเลี้ยงและงานแต่งงาน',
    });
    expect(calculateRoomFee('floor7', 'internal')).toEqual({
      roomFee: 0,
      deposit: 0,
      categoryLabel: 'ประชุมภายในองค์กร',
    });

    // Invalid room / meeting type
    expect(() => calculateRoomFee('invalid_room', 'seminar')).toThrow(ValidationError);
  });

  it('7.2 should persist room_fee_thb and deposit_thb in atomic booking creation', async () => {
    const payload = makeValidPayload({
      room_id: 'floor7',
      meeting_type: 'wedding',
    });

    const { booking } = await createBookingAtomic(db, payload);
    expect(booking.room_fee_thb).toBe(35000);
    expect(booking.deposit_thb).toBe(17500);

    const row = await db.prepare('SELECT room_fee_thb, deposit_thb FROM bookings WHERE id = ?').bind(booking.id).first<{ room_fee_thb: number; deposit_thb: number }>();
    expect(row?.room_fee_thb).toBe(35000);
    expect(row?.deposit_thb).toBe(17500);
  });

  it('7.2.1 should set room_fee_thb = 0 and deposit_thb = 0 for internal meeting_type', async () => {
    const payload = makeValidPayload({
      room_id: 'floor7',
      meeting_type: 'internal',
    });

    const { booking } = await createBookingAtomic(db, payload);
    expect(booking.room_fee_thb).toBe(0);
    expect(booking.deposit_thb).toBe(0);

    const row = await db.prepare('SELECT room_fee_thb, deposit_thb FROM bookings WHERE id = ?').bind(booking.id).first<{ room_fee_thb: number; deposit_thb: number }>();
    expect(row?.room_fee_thb).toBe(0);
    expect(row?.deposit_thb).toBe(0);
  });

  it('7.3 should reject booking more than 30 days in advance', async () => {
    // 09:00 Bangkok time on day 32 ahead
    const futureDate = new Date();
    futureDate.setUTCDate(futureDate.getUTCDate() + 32);
    futureDate.setUTCHours(2, 0, 0, 0); // 09:00 Bangkok
    const futureStart = Math.floor(futureDate.getTime() / 1000);

    await expect(
      createBookingAtomic(db, makeValidPayload({
        starts_at: futureStart,
        ends_at: futureStart + 7200, // 11:00 Bangkok
      }))
    ).rejects.toThrow('สามารถจองล่วงหน้าได้ไม่เกิน 30 วัน');
  });
});
