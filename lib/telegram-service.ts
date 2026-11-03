import {
  BookingWithDetails,
  ROOM_NAMES,
  TABLE_LAYOUT_NAMES,
  MEETING_TYPE_NAMES,
  formatThaiDateTimeRange,
} from "./line-service";

const SITE_URL = "https://meeting-room-booking-system.chookait-tom.workers.dev";

// ---------- settings (system_settings key/value, no schema change) ----------

async function getSetting(db: D1Database, key: string): Promise<{ value: string; updated_at: number } | null> {
  return db.prepare("SELECT value, updated_at FROM system_settings WHERE key = ?").bind(key).first<{ value: string; updated_at: number }>();
}

async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .bind(key, value, Math.floor(Date.now() / 1000))
    .run();
}

// ---------- token encryption (AES-GCM, key derived from a Cloudflare secret) ----------

export async function getEncryptionSecret(): Promise<string | undefined> {
  let secret = process.env.TELEGRAM_ENCRYPTION_KEY;
  if (!secret) {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = await getCloudflareContext();
      secret = (env as any)?.TELEGRAM_ENCRYPTION_KEY;
    } catch {
      // local development or unit test environment
    }
  }
  return secret?.trim() || undefined;
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(plain: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret), new TextEncoder().encode(plain));
  return `${Buffer.from(iv).toString("base64")}.${Buffer.from(ct).toString("base64")}`;
}

export async function decryptToken(blob: string, secret: string): Promise<string | null> {
  try {
    const [iv, ct] = blob.split(".");
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: Buffer.from(iv, "base64") },
      await aesKey(secret),
      Buffer.from(ct, "base64")
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null; // wrong key or corrupted value
  }
}

// ---------- Telegram Bot API ----------

type TgResult = { ok: true; result: any } | { ok: false; error: string };

// The request URL contains the bot token, so never surface fetch exceptions: map to fixed Thai messages.
async function callTelegram(token: string, method: string, body: object = {}): Promise<TgResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as any;
    if (res.ok && data?.ok) return { ok: true, result: data.result };
    if (res.status === 401 || res.status === 404) return { ok: false, error: "Bot Token ไม่ถูกต้อง" };
    return {
      ok: false,
      error: "ส่งข้อความเข้ากลุ่มไม่ได้ ตรวจสอบ Chat ID และเพิ่มบอทเข้ากลุ่มแล้วหรือยัง (Chat ID ของกลุ่มมักขึ้นต้นด้วย -100)",
    };
  } catch {
    return { ok: false, error: "เชื่อมต่อ Telegram ไม่ได้ กรุณาลองใหม่อีกครั้ง" };
  }
}

function bangkokClock(): string {
  const b = new Date(Date.now() + 7 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(b.getUTCHours())}:${p(b.getUTCMinutes())}:${p(b.getUTCSeconds())} น.`;
}

export function testText(byAdmin: string): string {
  return [
    "✅ ทดสอบการเชื่อมต่อ Telegram สำเร็จ",
    DIVIDER,
    "🏛️ ระบบจองห้องประชุม ม.สวนดุสิต ลำปาง",
    `⏰ เวลาที่ทดสอบ: ${bangkokClock()}`,
    `👤 ทดสอบโดย: ${byAdmin}`,
    "🤖 สถานะ: บอทพร้อมรับการแจ้งเตือนจริงแล้ว",
    DIVIDER,
  ].join("\n");
}

/** Checks the token (getMe), then sends a test message to the chat. */
export async function verifyAndTest(token: string, chatId: string, byAdmin: string): Promise<{ ok: true; botUsername: string } | { ok: false; error: string }> {
  const me = await callTelegram(token, "getMe");
  if (!me.ok) return me;
  const sent = await callTelegram(token, "sendMessage", { chat_id: chatId, text: testText(byAdmin) });
  if (!sent.ok) return sent;
  return { ok: true, botUsername: String(me.result?.username ?? "") };
}

// ---------- stored config ----------

export async function saveTelegramConfig(db: D1Database, token: string, chatId: string, botUsername: string, secret: string): Promise<void> {
  await setSetting(db, "telegram_token_enc", await encryptToken(token, secret));
  await setSetting(db, "telegram_token_last4", token.slice(-4));
  await setSetting(db, "telegram_chat_id", chatId);
  await setSetting(db, "telegram_bot_username", botUsername);
  await setSetting(db, "telegram_notify_enabled", "1");
}

export async function clearTelegramConfig(db: D1Database): Promise<void> {
  await db.prepare("DELETE FROM system_settings WHERE key LIKE 'telegram_%'").run();
}

export async function setTelegramEnabled(db: D1Database, enabled: boolean): Promise<void> {
  await setSetting(db, "telegram_notify_enabled", enabled ? "1" : "0");
}

/** Public status for the admin UI. Never contains the token. */
export async function getTelegramStatus(db: D1Database) {
  const [enc, chat, bot, last4, enabled, key] = await Promise.all([
    getSetting(db, "telegram_token_enc"),
    getSetting(db, "telegram_chat_id"),
    getSetting(db, "telegram_bot_username"),
    getSetting(db, "telegram_token_last4"),
    getSetting(db, "telegram_notify_enabled"),
    getEncryptionSecret(),
  ]);
  const configured = Boolean(enc && chat);
  return {
    key_available: Boolean(key),
    configured,
    enabled: configured && enabled?.value === "1",
    bot_username: bot?.value || null,
    token_last4: last4?.value || null,
    chat_id: chat?.value || null,
    updated_at: enc?.updated_at ?? null,
    decrypt_failed: Boolean(enc && key && (await decryptToken(enc.value, key)) === null),
  };
}

async function getSendConfig(db: D1Database): Promise<{ token: string; chatId: string } | null> {
  const [enc, chat, enabled, key] = await Promise.all([
    getSetting(db, "telegram_token_enc"),
    getSetting(db, "telegram_chat_id"),
    getSetting(db, "telegram_notify_enabled"),
    getEncryptionSecret(),
  ]);
  if (!enc || !chat || enabled?.value !== "1" || !key) return null;
  const token = await decryptToken(enc.value, key);
  return token ? { token, chatId: chat.value } : null;
}

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━";

// ---------- message formats ----------

function phone(p: string): string {
  return p.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
}

function headerLines(b: BookingWithDetails): string[] {
  const { dateStr, timeStr } = formatThaiDateTimeRange(b.starts_at, b.ends_at);
  return [
    `🔖 รหัสการจอง: ${b.booking_code}`,
    `📌 กิจกรรม: ${b.activity_name}`,
    ...(b.project_name ? [`📁 โครงการ: ${b.project_name}`] : []),
    `🏢 ห้อง: ${ROOM_NAMES[b.room_id] || b.room_id}`,
    `📅 วันที่: ${dateStr}`,
    `⏰ เวลา: ${timeStr}`,
  ];
}

export function pendingText(b: BookingWithDetails): string {
  let equipment = "ไม่ได้ระบุ";
  let notes = "";
  if (b.equipment_needed) {
    try {
      const p = typeof b.equipment_needed === "string" ? JSON.parse(b.equipment_needed) : b.equipment_needed;
      const items = Array.isArray(p.items) ? p.items.join(", ") : "";
      const combined = [items, p.other ? `อื่นๆ: ${p.other}` : ""].filter(Boolean).join(" | ");
      if (combined) equipment = combined;
      notes = p.notes || "";
    } catch {
      equipment = String(b.equipment_needed);
    }
  }
  return [
    "🔔 คำขอจองห้องประชุมใหม่ (รออนุมัติ)",
    DIVIDER,
    ...headerLines(b),
    `👥 ผู้เข้าร่วม: ${b.attendees_count} คน (เจ้าหน้าที่ ${b.staff_count} คน)`,
    `🏷️ ประเภท: ${MEETING_TYPE_NAMES[b.meeting_type] || b.meeting_type}`,
    `🪑 ผังห้อง: ${TABLE_LAYOUT_NAMES[b.table_layout] || b.table_layout}`,
    `👤 ผู้ประสานงาน: ${b.coordinator_name} ${phone(b.coordinator_phone)}`,
    `🎤 อุปกรณ์: ${equipment}`,
    ...(notes ? [`📝 หมายเหตุ: ${notes}`] : []),
    DIVIDER,
    `👉 ตรวจสอบและอนุมัติ: ${SITE_URL}/admin`,
  ].join("\n");
}

export function approvedText(b: BookingWithDetails): string {
  const catering = b.items && b.items.length > 0 ? b.items.map((i) => `${i.item_name} (${i.quantity} ชุด)`).join(", ") : "ไม่ระบุอาหาร/เครื่องดื่ม";
  return [
    "✅ อนุมัติการจองห้องประชุมแล้ว",
    DIVIDER,
    ...headerLines(b).filter((l) => !l.includes("โครงการ:")),
    `👤 ผู้ประสานงาน: ${b.coordinator_name} ${phone(b.coordinator_phone)}`,
    `🍽️ อาหาร/เครื่องดื่ม: ${catering}`,
    DIVIDER,
    `👉 ติดตามสถานะได้ที่: ${SITE_URL}`,
  ].join("\n");
}

// ---------- senders (all non-throwing; callers wrap them as non-blocking anyway) ----------

type SendResult = { success: boolean; skipped?: boolean; error?: string };

async function sendBookingMessage(db: D1Database, bookingId: string, kind: "pending" | "approved"): Promise<SendResult> {
  try {
    const cfg = await getSendConfig(db);
    if (!cfg) return { success: true, skipped: true };

    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").bind(bookingId).first<BookingWithDetails>();
    if (!booking) return { success: false, error: `Booking not found: ${bookingId}` };

    if (kind === "approved") {
      const items = await db
        .prepare("SELECT item_code, item_name, quantity, subtotal FROM booking_items WHERE booking_id = ?")
        .bind(bookingId)
        .all<{ item_code: string; item_name: string; quantity: number; subtotal: number }>();
      booking.items = items.results || [];
    }

    const sent = await callTelegram(cfg.token, "sendMessage", {
      chat_id: cfg.chatId,
      text: kind === "pending" ? pendingText(booking) : approvedText(booking),
    });
    return sent.ok ? { success: true } : { success: false, error: sent.error };
  } catch {
    return { success: false, error: "Telegram notification failed" }; // no err.message: could carry the token URL
  }
}

export const sendTelegramPendingNotification = (db: D1Database, bookingId: string) => sendBookingMessage(db, bookingId, "pending");
export const sendTelegramApprovedNotification = (db: D1Database, bookingId: string) => sendBookingMessage(db, bookingId, "approved");

export async function sendTelegramTestPing(db: D1Database, byAdmin: string): Promise<SendResult> {
  const cfg = await getSendConfig(db);
  if (!cfg) return { success: false, error: "ยังไม่ได้ตั้งค่า หรือปิดการแจ้งเตือน Telegram อยู่" };
  const sent = await callTelegram(cfg.token, "sendMessage", { chat_id: cfg.chatId, text: testText(byAdmin) });
  return sent.ok ? { success: true } : { success: false, error: sent.error };
}
