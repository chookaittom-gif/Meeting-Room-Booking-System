import { FOOD_CATALOG, CreateBookingPayload, BookingRecord, BookingStatus } from './types';

export class BookingConflictError extends Error {
  constructor(message = 'ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกเวลาอื่นหรือติดต่อผู้ดูแล') {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatusTransitionError';
  }
}

// Convert UTC seconds to Bangkok hour (0-23)
export function getBangkokHour(epochSec: number): { hour: number; minute: number } {
  const date = new Date(epochSec * 1000);
  // UTC+7
  const bangkokDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return {
    hour: bangkokDate.getUTCHours(),
    minute: bangkokDate.getUTCMinutes(),
  };
}

export function validateBookingPayload(payload: CreateBookingPayload, roomCapacity: number) {
  if (!payload.request_key || payload.request_key.trim().length === 0) {
    throw new ValidationError('จำเป็นต้องระบุ request_key');
  }
  if (!payload.activity_name?.trim()) {
    throw new ValidationError('จำเป็นต้องระบุชื่อกิจกรรม');
  }
  if (!payload.project_name?.trim()) {
    throw new ValidationError('จำเป็นต้องระบุชื่อโครงการ/กิจกรรมหลัก');
  }
  if (!payload.coordinator_name?.trim()) {
    throw new ValidationError('จำเป็นต้องระบุชื่อผู้ประสานงาน');
  }
  
  // Phone: 10 digits starting with 0
  const phoneClean = payload.coordinator_phone?.replace(/[-\s]/g, '') || '';
  if (!/^0\d{9}$/.test(phoneClean)) {
    throw new ValidationError('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักและขึ้นต้นด้วย 0 (เช่น 0812345678)');
  }

  if (payload.attendees_count <= 0) {
    throw new ValidationError('จำนวนผู้เข้าร่วมต้องมากกว่า 0');
  }

  if (payload.staff_count < 0) {
    throw new ValidationError('จำนวนเจ้าหน้าที่ต้องไม่ติดลบ');
  }

  // Capacity rule: compare attendees_count against roomCapacity (staff excluded)
  if (payload.attendees_count > roomCapacity) {
    throw new ValidationError(`จำนวนผู้เข้าร่วม (${payload.attendees_count} คน) เกินความจุสูงสุดของห้อง (${roomCapacity} คน)`);
  }

  // Duration: min 2 hours (7200 seconds)
  const duration = payload.ends_at - payload.starts_at;
  if (duration < 7200) {
    throw new ValidationError('เวลาจองขั้นต่ำต้องไม่น้อยกว่า 2 ชั่วโมง');
  }

  // Service hours check: 08:30 - 16:30 Bangkok time (UTC+7)
  const startLocal = getBangkokHour(payload.starts_at);
  const endLocal = getBangkokHour(payload.ends_at);

  const startMins = startLocal.hour * 60 + startLocal.minute;
  const endMins = endLocal.hour * 60 + endLocal.minute;

  if (startMins < 8 * 60 + 30 || endMins > 16 * 60 + 30) {
    throw new ValidationError('ช่วงเวลาให้บริการคือ 08:30 – 16:30 น.');
  }

  // Advance booking check: max 60 days
  const now = Math.floor(Date.now() / 1000);
  if (payload.starts_at < now - 300) { // allow 5 mins grace for network latency
    throw new ValidationError('ไม่สามารถจองเวลาย้อนหลังได้');
  }
  const maxAdvanceSec = 60 * 24 * 60 * 60;
  if (payload.starts_at > now + maxAdvanceSec) {
    throw new ValidationError('สามารถจองล่วงหน้าได้ไม่เกิน 60 วัน');
  }

  // Items validation
  if (payload.items && payload.items.length > 0) {
    for (const item of payload.items) {
      if (!FOOD_CATALOG[item.item_code]) {
        throw new ValidationError(`ไม่พบรายการอาหาร/เครื่องดื่มรหัส: ${item.item_code}`);
      }
      if (item.quantity <= 0) {
        throw new ValidationError(`จำนวนของ ${FOOD_CATALOG[item.item_code].name} ต้องมากกว่า 0`);
      }
    }
  }
}

export function calculateTotalPrice(items: { item_code: string; quantity: number }[]): {
  total: number;
  detailedItems: { item_code: string; item_name: string; quantity: number; unit_price: number; subtotal: number }[];
} {
  let total = 0;
  const detailedItems = [];

  for (const item of items) {
    const catalogItem = FOOD_CATALOG[item.item_code];
    if (catalogItem) {
      const subtotal = catalogItem.unitPrice * item.quantity;
      total += subtotal;
      detailedItems.push({
        item_code: item.item_code,
        item_name: catalogItem.name,
        quantity: item.quantity,
        unit_price: catalogItem.unitPrice,
        subtotal,
      });
    }
  }

  return { total, detailedItems };
}

// Generate random booking code e.g. BK-202610-A1B2
export function generateBookingCode(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BK-${year}${month}-${rand}`;
}

export async function createBookingAtomic(db: D1Database, payload: CreateBookingPayload): Promise<{ booking: BookingRecord; isExisting: boolean }> {
  // 1. Fetch room
  const room = await db.prepare('SELECT id, name, capacity_max FROM rooms WHERE id = ?').bind(payload.room_id).first<{ id: string; name: string; capacity_max: number }>();
  if (!room) {
    throw new ValidationError(`ไม่พบห้องประชุมรหัส: ${payload.room_id}`);
  }

  // 2. Validate
  validateBookingPayload(payload, room.capacity_max);

  // 3. Check for existing request_key (Idempotency)
  const existing = await db.prepare('SELECT * FROM bookings WHERE request_key = ?').bind(payload.request_key).first<BookingRecord>();
  if (existing) {
    return { booking: existing, isExisting: true };
  }

  // 4. Calculate prices
  const { total, detailedItems } = calculateTotalPrice(payload.items || []);
  const bookingId = crypto.randomUUID();
  const bookingCode = generateBookingCode();
  const now = Math.floor(Date.now() / 1000);

  // 5. Atomic INSERT with Conflict Detection (WHERE NOT EXISTS)
  // Strict inequality: ends_at = existing.starts_at OR starts_at = existing.ends_at does NOT conflict
  const insertBookingQuery = `
    INSERT INTO bookings (
      id, request_key, booking_code, room_id,
      activity_name, project_name, coordinator_name, coordinator_phone, coordinator_line_id,
      meeting_type, attendees_count, staff_count, table_layout, vvip_seats, vip_seats,
      starts_at, ends_at, status, total_price_thb, created_at, updated_at
    )
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE room_id = ?
        AND status IN ('pending', 'approved')
        AND starts_at < ?
        AND ends_at > ?
    )
    ON CONFLICT(request_key) DO NOTHING;
  `;

  const insertBookingStmt = db.prepare(insertBookingQuery).bind(
    bookingId,
    payload.request_key,
    bookingCode,
    payload.room_id,
    payload.activity_name,
    payload.project_name,
    payload.coordinator_name,
    payload.coordinator_phone.replace(/[-\s]/g, ''),
    payload.coordinator_line_id || null,
    payload.meeting_type,
    payload.attendees_count,
    payload.staff_count,
    payload.table_layout,
    payload.vvip_seats || 0,
    payload.vip_seats || 0,
    payload.starts_at,
    payload.ends_at,
    total,
    now,
    now,
    // WHERE NOT EXISTS params:
    payload.room_id,
    payload.ends_at,   // existing starts_at < new ends_at
    payload.starts_at  // existing ends_at > new starts_at
  );

  const res = await insertBookingStmt.run();

  // If changes == 0, either conflict or request_key collided
  if (!res.meta.changes || res.meta.changes === 0) {
    // Check if it was idempotency collision
    const collided = await db.prepare('SELECT * FROM bookings WHERE request_key = ?').bind(payload.request_key).first<BookingRecord>();
    if (collided) {
      return { booking: collided, isExisting: true };
    }
    // Otherwise it was a room time collision!
    throw new BookingConflictError();
  }

  // 6. Insert items & initial history & notification in batch
  const batchStmts = [];
  for (const item of detailedItems) {
    const itemId = crypto.randomUUID();
    batchStmts.push(
      db.prepare(`
        INSERT INTO booking_items (id, booking_id, item_code, item_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(itemId, bookingId, item.item_code, item.item_name, item.quantity, item.unit_price, item.subtotal)
    );
  }

  const historyId = crypto.randomUUID();
  batchStmts.push(
    db.prepare(`
      INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by, reason, changed_at)
      VALUES (?, ?, NULL, 'pending', NULL, 'สร้างคำขอจองใหม่', ?)
    `).bind(historyId, bookingId, now)
  );

  const notifId = crypto.randomUUID();
  batchStmts.push(
    db.prepare(`
      INSERT INTO notifications (id, booking_id, event_type, history_id, recipient_type, is_read, created_at)
      VALUES (?, ?, 'pending', ?, 'admin', 0, ?)
    `).bind(notifId, bookingId, historyId, now)
  );

  if (batchStmts.length > 0) {
    await db.batch(batchStmts);
  }

  const created = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(bookingId).first<BookingRecord>();
  return { booking: created!, isExisting: false };
}

export async function updateBookingStatus(
  db: D1Database,
  bookingId: string,
  fromStatus: BookingStatus,
  toStatus: BookingStatus,
  changedByAdminId: string,
  reason?: string
): Promise<void> {
  // Validate allowed transitions
  if (fromStatus === 'pending') {
    if (!['approved', 'rejected', 'cancelled'].includes(toStatus)) {
      throw new StatusTransitionError(`ไม่อนุญาตให้เปลี่ยนสถานะจาก pending เป็น ${toStatus}`);
    }
  } else if (fromStatus === 'approved') {
    if (toStatus !== 'cancelled') {
      throw new StatusTransitionError(`ไม่อนุญาตให้เปลี่ยนสถานะจาก approved เป็น ${toStatus} (เปลี่ยนได้เฉพาะ cancelled)`);
    }
  } else {
    throw new StatusTransitionError(`ไม่สามารถเปลี่ยนสถานะจาก ${fromStatus} ได้ (เป็นสถานะสิ้นสุด)`);
  }

  if (toStatus === 'rejected' && (!reason || reason.trim().length === 0)) {
    throw new ValidationError('จำเป็นต้องระบุเหตุผลเมื่อไม่อนุมัติคำขอ');
  }

  const now = Math.floor(Date.now() / 1000);

  // 1. Conditional status update
  const updateRes = await db.prepare(`
    UPDATE bookings
    SET status = ?, updated_at = ?
    WHERE id = ? AND status = ?
  `).bind(toStatus, now, bookingId, fromStatus).run();

  if (!updateRes.meta.changes || updateRes.meta.changes === 0) {
    throw new StatusTransitionError('ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากสถานะปัจจุบันของรายการเปลี่ยนไปแล้ว');
  }

  // 2. Insert history and notifications atomically
  const historyId = crypto.randomUUID();
  const notifId = crypto.randomUUID();
  const batchStmts = [
    db.prepare(`
      INSERT INTO booking_status_history (id, booking_id, from_status, to_status, changed_by, reason, changed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(historyId, bookingId, fromStatus, toStatus, changedByAdminId, reason || null, now),

    db.prepare(`
      INSERT INTO notifications (id, booking_id, event_type, history_id, recipient_type, is_read, created_at)
      VALUES (?, ?, ?, ?, 'admin', 0, ?)
    `).bind(notifId, bookingId, toStatus, historyId, now),
  ];

  // If approved: insert into line_notifications queue
  if (toStatus === 'approved') {
    const lineNotifId = crypto.randomUUID();
    const retryKey = crypto.randomUUID();
    batchStmts.push(
      db.prepare(`
        INSERT INTO line_notifications (id, booking_id, history_id, retry_key, status, attempts, created_at)
        VALUES (?, ?, ?, ?, 'pending', 0, ?)
        ON CONFLICT(booking_id, history_id) DO NOTHING
      `).bind(lineNotifId, bookingId, historyId, retryKey, now)
    );
  }

  await db.batch(batchStmts);
}
