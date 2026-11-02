import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { POST } from '../app/api/bookings/route';
import { NextRequest } from 'next/server';
import { CreateBookingPayload } from '../lib/types';

describe('Phase 2: Multi-step Booking Form & API Verification', () => {
  let db: D1Database;

  // Tomorrow at 09:00 - 12:00 Bangkok time (02:00 - 05:00 UTC)
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

  function makePayload(overrides: Partial<CreateBookingPayload> = {}): CreateBookingPayload {
    return {
      request_key: crypto.randomUUID(),
      room_id: 'floor2',
      activity_name: 'อบรมเชิงปฏิบัติการพัฒนาทักษะดิจิทัล',
      project_name: 'โครงการยกระดับการศึกษา ศูนย์การศึกษาลำปาง',
      coordinator_name: 'อาจารย์สุดา รักเรียน',
      coordinator_phone: '0891234567',
      coordinator_line_id: 'suda_line',
      meeting_type: 'seminar',
      attendees_count: 60,
      staff_count: 5,
      table_layout: 'classroom',
      vvip_seats: 2,
      vip_seats: 5,
      starts_at: startEpoch,
      ends_at: endEpoch,
      items: [
        { item_code: 'lunch_set', quantity: 60 },
        { item_code: 'tea1', quantity: 60 },
        { item_code: 'water600', quantity: 60 },
      ],
      ...overrides,
    };
  }

  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('2.1 should successfully create a booking via POST /api/bookings and return formatted response', async () => {
    const payload = makePayload();
    const req = createRequest(payload);
    const res = await POST(req);
    const data: any = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.isExisting).toBe(false);
    expect(data.booking.booking_code).toMatch(/^BK-\d{6}-[A-Z0-9]{4}$/);
    expect(data.booking.status).toBe('pending');
    expect(data.booking.total_price_thb).toBe(60 * 150 + 60 * 50 + 60 * 5); // 12,300 THB
  });

  it('2.2 should return existing booking when re-submitting with identical request_key (Idempotent)', async () => {
    const requestKey = 'same-request-key-phase2';
    const payload1 = makePayload({ request_key: requestKey });
    const payload2 = makePayload({ request_key: requestKey });

    const res1 = await POST(createRequest(payload1));
    const data1: any = await res1.json();
    expect(res1.status).toBe(200);
    expect(data1.isExisting).toBe(false);

    const res2 = await POST(createRequest(payload2));
    const data2: any = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.isExisting).toBe(true);
    expect(data2.booking.id).toBe(data1.booking.id);
  });

  it('2.3 should return 409 CONFLICT if another booking clashes on the same room and time', async () => {
    const payloadA = makePayload({
      request_key: 'req-clash-A',
      starts_at: startEpoch,
      ends_at: endEpoch,
    });
    const payloadB = makePayload({
      request_key: 'req-clash-B',
      starts_at: startEpoch + 3600, // overlaps!
      ends_at: endEpoch + 3600,
    });

    const resA = await POST(createRequest(payloadA));
    expect(resA.status).toBe(200);

    const resB = await POST(createRequest(payloadB));
    const dataB: any = await resB.json();
    expect(resB.status).toBe(409);
    expect(dataB.code).toBe('CONFLICT');
    expect(dataB.error).toContain('ห้องไม่ว่างในช่วงเวลาที่เลือก');
  });

  it('2.4 should reject requests with invalid phone numbers (must be 10 digits starting with 0)', async () => {
    const invalidPhones = ['1234567890', '081234567', '081234567890', 'abc', '0-81-23'];
    for (const phone of invalidPhones) {
      const payload = makePayload({ coordinator_phone: phone });
      const res = await POST(createRequest(payload));
      const data: any = await res.json();
      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.error).toContain('เบอร์โทรศัพท์');
    }
  });

  it('2.5 should reject bookings where attendees exceed room capacity (while staff count is excluded)', async () => {
    // Floor 2 capacity is 250
    // Attendees 251 -> 400 Bad Request
    const resOver = await POST(createRequest(makePayload({ room_id: 'floor2', attendees_count: 251 })));
    expect(resOver.status).toBe(400);
    const dataOver: any = await resOver.json();
    expect(dataOver.error).toContain('เกินความจุสูงสุด');

    // Attendees 250 + Staff 25 -> 200 OK
    const resOk = await POST(createRequest(makePayload({
      request_key: 'capacity-staff-ok',
      room_id: 'floor2',
      attendees_count: 250,
      staff_count: 25,
    })));
    expect(resOk.status).toBe(200);
  });

  it('2.6 should reject bookings shorter than 2 hours', async () => {
    const payloadShort = makePayload({
      starts_at: startEpoch,
      ends_at: startEpoch + 3600, // only 1 hour!
    });
    const res = await POST(createRequest(payloadShort));
    const data: any = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('ไม่น้อยกว่า 2 ชั่วโมง');
  });

  it('2.7 should allow booking without foods/drinks ("ไม่ประสงค์")', async () => {
    const payloadNoFood = makePayload({
      request_key: 'no-food-req',
      items: [],
    });
    const res = await POST(createRequest(payloadNoFood));
    const data: any = await res.json();
    expect(res.status).toBe(200);
    expect(data.booking.total_price_thb).toBe(0);
  });

  it('2.8 should reject invalid food item codes or zero/negative quantities', async () => {
    const payloadBadCode = makePayload({
      items: [{ item_code: 'unknown_item_xyz', quantity: 5 }],
    });
    const resBadCode = await POST(createRequest(payloadBadCode));
    expect(resBadCode.status).toBe(400);

    const payloadNegativeQty = makePayload({
      items: [{ item_code: 'water600', quantity: -2 }],
    });
    const resNegative = await POST(createRequest(payloadNegativeQty));
    expect(resNegative.status).toBe(400);
  });

  it('2.9 should persist equipment_needed when provided in booking payload', async () => {
    const equipmentData = JSON.stringify({
      items: ['โปรเจ็คเตอร์', 'ไมโครโฟน'],
      other: 'สาย HDMI',
      notes: 'ขอเปิดเครื่องปรับอากาศก่อนเวลา 30 นาที',
    });
    const payloadWithEq = makePayload({
      request_key: 'equipment-req-key-1',
      equipment_needed: equipmentData,
    });
    const res = await POST(createRequest(payloadWithEq));
    expect(res.status).toBe(200);

    const saved = await db.prepare('SELECT equipment_needed FROM bookings WHERE request_key = ?').bind('equipment-req-key-1').first<any>();
    expect(saved?.equipment_needed).toBe(equipmentData);
  });
});
