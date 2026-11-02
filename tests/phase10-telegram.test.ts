import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createMemoryD1Database, applyAllMigrations } from './sqlite-d1-adapter';
import { setTestDatabase } from '../lib/db';
import { createSessionToken } from '../lib/auth';
import { GET, PUT, PATCH, POST, DELETE } from '../app/api/admin/telegram/route';
import { POST as createBookingPOST } from '../app/api/bookings/route';
import { encryptToken, decryptToken, pendingText, approvedText } from '../lib/telegram-service';
import { CreateBookingPayload } from '../lib/types';

const TOKEN = '123456789:' + 'A'.repeat(35);
const CHAT = '-1001234567890';
const KEY = 'unit-test-key';

describe('Phase 10: Telegram notification settings and messages', () => {
  let db: D1Database;
  let calls: { url: string; body: any }[];
  let tg: { me: [number, any]; send: [number, any] };
  let superToken: string;
  let adminToken: string;

  beforeEach(async () => {
    db = createMemoryD1Database();
    applyAllMigrations(db);
    setTestDatabase(db);
    process.env.TELEGRAM_ENCRYPTION_KEY = KEY;
    calls = [];
    tg = { me: [200, { ok: true, result: { username: 'meeting_bot' } }], send: [200, { ok: true, result: {} }] };
    vi.stubGlobal('fetch', vi.fn(async (url: any, init: any) => {
      calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : {} });
      const [status, body] = String(url).endsWith('/getMe') ? tg.me : tg.send;
      return new Response(JSON.stringify(body), { status });
    }));
    superToken = await createSessionToken({ adminId: 'a1', username: 'chookait', displayName: 'ชูเกียรติ', role: 'superadmin' });
    adminToken = await createSessionToken({ adminId: 'a2', username: 'pathaithep', displayName: 'ไผทเทพ', role: 'admin' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TELEGRAM_ENCRYPTION_KEY;
  });

  const req = (method: string, token?: string, body?: any, json = true) =>
    new NextRequest('http://localhost:3000/api/admin/telegram', {
      method,
      headers: { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { cookie: `admin_session=${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const save = () => PUT(req('PUT', superToken, { token: TOKEN, chat_id: CHAT }));
  const status = async () => ((await (await GET(req('GET', superToken))).json()) as any).telegram;

  const booking = (o: Partial<CreateBookingPayload> = {}): CreateBookingPayload => {
    const t = new Date();
    t.setUTCDate(t.getUTCDate() + 1);
    t.setUTCHours(2, 0, 0, 0);
    const s = Math.floor(t.getTime() / 1000);
    return {
      request_key: crypto.randomUUID(), room_id: 'floor2', activity_name: 'อบรม', project_name: 'โครงการ',
      coordinator_name: 'สุดา', coordinator_phone: '0891234567', meeting_type: 'seminar', attendees_count: 60,
      staff_count: 5, table_layout: 'classroom', vvip_seats: 0, vip_seats: 0,
      equipment_needed: JSON.stringify({ items: ['โปรเจ็คเตอร์'], other: 'ขาตั้งป้าย', notes: 'ทดสอบเสียงก่อน' }),
      starts_at: s, ends_at: s + 3 * 3600, items: [], ...o,
    };
  };
  const postBooking = () =>
    createBookingPOST(new NextRequest('http://localhost:3000/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(booking()) }));

  it('10.1 token encryption round-trips and fails with the wrong key', async () => {
    const blob = await encryptToken(TOKEN, KEY);
    expect(blob).not.toContain(TOKEN);
    expect(await decryptToken(blob, KEY)).toBe(TOKEN);
    expect(await decryptToken(blob, 'other-key')).toBeNull();
  });

  it('10.2 admin routes need a session, and only a superadmin may save or delete', async () => {
    expect((await GET(req('GET'))).status).toBe(401);
    expect((await PUT(req('PUT', adminToken, { token: TOKEN, chat_id: CHAT }))).status).toBe(403);
    expect((await DELETE(req('DELETE', adminToken, {}))).status).toBe(403);
    expect((await PUT(req('PUT', superToken, { token: TOKEN, chat_id: CHAT }, false))).status).toBe(415);
  });

  it('10.3 saving verifies with Telegram, stores the token encrypted and never returns it', async () => {
    const res = await save();
    expect(res.status).toBe(200);
    expect(calls.map((c) => c.url.split('/').pop())).toEqual(['getMe', 'sendMessage']);
    expect(calls[1].body.chat_id).toBe(CHAT);

    const s = await status();
    expect(s).toMatchObject({ configured: true, enabled: true, bot_username: 'meeting_bot', token_last4: TOKEN.slice(-4), chat_id: CHAT, can_edit: true, decrypt_failed: false });
    const stored = await db.prepare("SELECT value FROM system_settings WHERE key = 'telegram_token_enc'").first<{ value: string }>();
    expect(stored!.value).not.toContain(TOKEN);
    expect(JSON.stringify(s)).not.toContain(TOKEN);
  });

  it('10.4 invalid input or a Telegram failure stores nothing', async () => {
    expect((await PUT(req('PUT', superToken, { token: 'bad', chat_id: CHAT }))).status).toBe(400);
    expect((await PUT(req('PUT', superToken, { token: TOKEN, chat_id: 'abc' }))).status).toBe(400);

    tg.me = [401, { ok: false, description: 'Unauthorized' }];
    const res = await save();
    expect(res.status).toBe(400);
    expect(((await res.json()) as any).error).toBe('Bot Token ไม่ถูกต้อง');
    expect((await status()).configured).toBe(false);
  });

  it('10.5 without the encryption key it fails closed', async () => {
    delete process.env.TELEGRAM_ENCRYPTION_KEY;
    const res = await save();
    expect(res.status).toBe(400);
    expect(((await res.json()) as any).code).toBe('KEY_MISSING');
    expect((await status()).key_available).toBe(false);
    expect((await status()).configured).toBe(false);
  });

  it('10.6 a new booking sends the pending message; switching off stops it', async () => {
    await save();
    calls.length = 0;
    expect((await postBooking()).status).toBe(200);
    const sent = calls.filter((c) => c.url.endsWith('/sendMessage'));
    expect(sent).toHaveLength(1);
    expect(sent[0].body.chat_id).toBe(CHAT);
    expect(sent[0].body.text).toContain('คำขอจองห้องประชุมใหม่');

    expect((await PATCH(req('PATCH', adminToken, { enabled: false }))).status).toBe(200);
    calls.length = 0;
    await postBooking();
    expect(calls).toHaveLength(0);
  });

  it('10.7 a Telegram outage never blocks the booking', async () => {
    await save();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down https://api.telegram.org/bot' + TOKEN); }));
    expect((await postBooking()).status).toBe(200);
  });

  it('10.8 test ping works for any admin once configured; delete wipes the settings', async () => {
    expect((await POST(req('POST', adminToken, {}))).status).toBe(400); // not configured yet
    await save();
    calls.length = 0;
    expect((await POST(req('POST', adminToken, {}))).status).toBe(200);
    expect(calls[0].body.text).toContain('ทดสอบการเชื่อมต่อ Telegram สำเร็จ');
    expect((await DELETE(req('DELETE', superToken, {}))).status).toBe(200);
    expect((await status()).configured).toBe(false);
  });

  it('10.9 message formats: pending has equipment + admin link, approved has catering and no equipment', () => {
    const b: any = { ...booking(), id: 'x', booking_code: 'BK-202611-A1B2', status: 'pending', total_price_thb: 0,
      items: [{ item_code: 'lunch_set', item_name: 'อาหารกลางวัน', quantity: 60, subtotal: 9000 }] };
    const p = pendingText(b);
    expect(p).toContain('🔔 คำขอจองห้องประชุมใหม่ (รออนุมัติ)');
    expect(p).toContain('รหัสการจอง: BK-202611-A1B2');
    expect(p).toContain('อุปกรณ์: โปรเจ็คเตอร์ | อื่นๆ: ขาตั้งป้าย');
    expect(p).toContain('หมายเหตุ: ทดสอบเสียงก่อน');
    expect(p).toContain('089-123-4567');
    expect(p.trim().endsWith('/admin')).toBe(true);

    const a = approvedText(b);
    expect(a).toContain('✅ อนุมัติการจองห้องประชุมแล้ว');
    expect(a).toContain('อาหาร/เครื่องดื่ม: อาหารกลางวัน (60 ชุด)');
    expect(a).not.toContain('อุปกรณ์');
    expect(a).not.toContain('โครงการ:');
  });
});
