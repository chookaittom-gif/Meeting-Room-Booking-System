import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { getMonthlyReport } from '../lib/monthly-report';

describe('Monthly Report Financial & Catering Aggregation', () => {
  let db: D1Database;

  beforeEach(() => {
    db = createMemoryD1Database();
    applyAllMigrations(db);
  });

  const monthKey = '2026-11';
  // Starts at: 2026-11-05 02:00:00 UTC (09:00:00 ICT)
  const startsAt = Math.floor(Date.UTC(2026, 10, 5, 2, 0, 0) / 1000);
  const endsAt = Math.floor(Date.UTC(2026, 10, 5, 5, 0, 0) / 1000);

  it('aggregates financial and catering items accurately for approved bookings only', async () => {
    // 1. Approved booking with room fee and catering
    await db.prepare(`
      INSERT INTO bookings (
        id, request_key, booking_code, room_id,
        activity_name, project_name, coordinator_name, coordinator_phone,
        meeting_type, attendees_count, staff_count, table_layout,
        starts_at, ends_at, status, total_price_thb, room_fee_thb, deposit_thb,
        created_at, updated_at
      ) VALUES (
        'b1', 'rk_1', 'BK-001', 'floor7',
        'สัมมนาการสอน', 'โครงการพัฒนาครู', 'ดร.สมชาย', '0812345678',
        'seminar', 50, 2, 'classroom',
        ?, ?, 'approved', 10000, 30000, 15000,
        1730000000, 1730000000
      )
    `).bind(startsAt, endsAt).run();

    await db.prepare(`
      INSERT INTO booking_items (id, booking_id, item_code, item_name, quantity, unit_price, subtotal)
      VALUES 
        ('bi_1', 'b1', 'lunch_set', 'ชุดสำหรับ 1 ท่าน (ข้าว + อาหาร 3 อย่าง)', 50, 150, 7500),
        ('bi_2', 'b1', 'coffee_snack', 'ชา/กาแฟ + อาหารว่าง 1 อย่าง', 50, 50, 2500)
    `).run();

    // 2. Another approved booking (floor 2, wedding)
    await db.prepare(`
      INSERT INTO bookings (
        id, request_key, booking_code, room_id,
        activity_name, project_name, coordinator_name, coordinator_phone,
        meeting_type, attendees_count, staff_count, table_layout,
        starts_at, ends_at, status, total_price_thb, room_fee_thb, deposit_thb,
        created_at, updated_at
      ) VALUES (
        'b2', 'rk_2', 'BK-002', 'floor2',
        'งานเลี้ยงอบรม', 'โครงการบริการวิชาการ', 'อ.สุดา', '0898765432',
        'small_group', 20, 1, 'ushape',
        ?, ?, 'approved', 3000, 10000, 5000,
        1730000000, 1730000000
      )
    `).bind(startsAt + 86400, endsAt + 86400).run();

    await db.prepare(`
      INSERT INTO booking_items (id, booking_id, item_code, item_name, quantity, unit_price, subtotal)
      VALUES 
        ('bi_3', 'b2', 'lunch_set', 'ชุดสำหรับ 1 ท่าน (ข้าว + อาหาร 3 อย่าง)', 20, 150, 3000)
    `).run();

    // 3. Pending booking (MUST NOT be counted in financial or catering)
    await db.prepare(`
      INSERT INTO bookings (
        id, request_key, booking_code, room_id,
        activity_name, project_name, coordinator_name, coordinator_phone,
        meeting_type, attendees_count, staff_count, table_layout,
        starts_at, ends_at, status, total_price_thb, room_fee_thb, deposit_thb,
        created_at, updated_at
      ) VALUES (
        'b3', 'rk_3', 'BK-003', 'floor7',
        'งานรออนุมัติ', 'โครงการพิเศษ', 'นายทดสอบ', '0800000000',
        'seminar', 100, 5, 'theater',
        ?, ?, 'pending', 20000, 30000, 15000,
        1730000000, 1730000000
      )
    `).bind(startsAt + 172800, endsAt + 172800).run();

    await db.prepare(`
      INSERT INTO booking_items (id, booking_id, item_code, item_name, quantity, unit_price, subtotal)
      VALUES 
        ('bi_4', 'b3', 'lunch_set', 'ชุดสำหรับ 1 ท่าน (ข้าว + อาหาร 3 อย่าง)', 100, 150, 15000),
        ('bi_5', 'b3', 'coffee_snack', 'ชา/กาแฟ + อาหารว่าง 1 อย่าง', 100, 50, 5000)
    `).run();

    // 4. Cancelled booking (MUST NOT be counted in financial or catering)
    await db.prepare(`
      INSERT INTO bookings (
        id, request_key, booking_code, room_id,
        activity_name, project_name, coordinator_name, coordinator_phone,
        meeting_type, attendees_count, staff_count, table_layout,
        starts_at, ends_at, status, total_price_thb, room_fee_thb, deposit_thb,
        created_at, updated_at
      ) VALUES (
        'b4', 'rk_4', 'BK-004', 'floor2',
        'งานยกเลิก', 'โครงการยกเลิก', 'นายยกเลิก', '0811111111',
        'seminar', 30, 1, 'classroom',
        ?, ?, 'cancelled', 4500, 10000, 5000,
        1730000000, 1730000000
      )
    `).bind(startsAt + 259200, endsAt + 259200).run();

    const report = await getMonthlyReport(db, monthKey);

    // Verify bookings count
    expect(report.total_bookings).toBe(2); // b1 and b2
    expect(report.cancelled_count).toBe(1); // b4

    // Verify financial summary (only b1 + b2: room_fee = 30000 + 10000, catering = 10000 + 3000, deposit = 15000 + 5000)
    expect(report.financial).toEqual({
      room_fee_thb: 40000,
      catering_fee_thb: 13000,
      grand_total_thb: 53000,
      deposit_thb: 20000,
    });

    // Verify catering items aggregation (lunch_set: 50+20=70, 7500+3000=10500; coffee_snack: 50, 2500)
    expect(report.catering).toHaveLength(2);
    expect(report.catering[0]).toEqual({
      item_code: 'lunch_set',
      item_name: 'ชุดสำหรับ 1 ท่าน (ข้าว + อาหาร 3 อย่าง)',
      quantity: 70,
      subtotal: 10500,
    });
    expect(report.catering[1]).toEqual({
      item_code: 'coffee_snack',
      item_name: 'ชา/กาแฟ + อาหารว่าง 1 อย่าง',
      quantity: 50,
      subtotal: 2500,
    });

    // Verify approved bookings details
    expect(report.approved_bookings).toHaveLength(2);
    expect(report.approved_bookings[0].booking_code).toBe('BK-001');
    expect(report.approved_bookings[0].total_amount_thb).toBe(40000); // room 30000 + food 10000
    expect(report.approved_bookings[1].booking_code).toBe('BK-002');
    expect(report.approved_bookings[1].total_amount_thb).toBe(13000); // room 10000 + food 3000
  });

  it('handles months with no bookings gracefully', async () => {
    const report = await getMonthlyReport(db, '2025-01');

    expect(report.total_bookings).toBe(0);
    expect(report.financial).toEqual({
      room_fee_thb: 0,
      catering_fee_thb: 0,
      grand_total_thb: 0,
      deposit_thb: 0,
    });
    expect(report.catering).toEqual([]);
    expect(report.approved_bookings).toEqual([]);
  });

  it('calculates internal meeting_type report stats correctly with zero room fee and proper label', async () => {
    await db.prepare(`
      INSERT INTO bookings (
        id, request_key, booking_code, room_id,
        activity_name, project_name, coordinator_name, coordinator_phone,
        meeting_type, attendees_count, staff_count, table_layout,
        starts_at, ends_at, status, total_price_thb, room_fee_thb, deposit_thb,
        created_at, updated_at
      ) VALUES (
        'b_int', 'rk_int', 'BK-INT', 'floor7',
        'ประชุมสภาอาจารย์', 'กิจกรรมภายใน', 'ดร.สมชาย', '0812345678',
        'internal', 40, 2, 'classroom',
        ?, ?, 'approved', 0, 0, 0,
        1730000000, 1730000000
      )
    `).bind(startsAt, endsAt).run();

    const report = await getMonthlyReport(db, monthKey);
    expect(report.total_bookings).toBe(1);
    expect(report.financial.room_fee_thb).toBe(0);
    expect(report.financial.deposit_thb).toBe(0);
    expect(report.financial.grand_total_thb).toBe(0);

    const internalPurpose = report.purposes.find((p) => p.meeting_type === 'internal');
    expect(internalPurpose).toBeDefined();
    expect(internalPurpose?.label_th).toBe('ประชุมภายในองค์กร');
    expect(internalPurpose?.count).toBe(1);
  });
});
