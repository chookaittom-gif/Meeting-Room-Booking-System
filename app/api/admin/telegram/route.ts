import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken, AdminSession } from "@/lib/auth";
import {
  getTelegramStatus,
  getEncryptionSecret,
  verifyAndTest,
  saveTelegramConfig,
  clearTelegramConfig,
  setTelegramEnabled,
  sendTelegramTestPing,
} from "@/lib/telegram-service";

const err = (error: string, status: number, code?: string) => NextResponse.json({ error, code }, { status });

async function sessionOf(req: NextRequest): Promise<AdminSession | null> {
  const token = req.cookies.get("admin_session")?.value;
  return token ? verifySessionToken(token) : null;
}

// Mutations need a JSON content type: a cross-site HTML form cannot send one, and a cross-origin fetch with it needs CORS preflight.
const isJson = (req: NextRequest) => (req.headers.get("content-type") || "").includes("application/json");

export async function GET(req: NextRequest) {
  const session = await sessionOf(req);
  if (!session) return err("ไม่มีสิทธิ์เข้าถึง", 401);
  try {
    const status = await getTelegramStatus(await getD1Database());
    return NextResponse.json({ success: true, telegram: { ...status, can_edit: session.role === "superadmin" } });
  } catch (e) {
    console.error("GET /api/admin/telegram error:", e);
    return err("เกิดข้อผิดพลาดในการดึงการตั้งค่า", 500);
  }
}

// Save token + chat id (superadmin). Verifies with Telegram before anything is stored.
export async function PUT(req: NextRequest) {
  const session = await sessionOf(req);
  if (!session) return err("ไม่มีสิทธิ์เข้าถึง", 401);
  if (session.role !== "superadmin") return err("เฉพาะ Superadmin เท่านั้นที่ตั้งค่า Telegram ได้", 403);
  if (!isJson(req)) return err("รูปแบบคำขอไม่ถูกต้อง", 415);

  try {
    const body = (await req.json()) as any;
    const token = String(body.token ?? "").trim();
    const chatId = String(body.chat_id ?? "").trim();
    if (!/^\d{6,12}:[A-Za-z0-9_-]{30,50}$/.test(token)) return err("รูปแบบ Bot Token ไม่ถูกต้อง", 400, "VALIDATION_ERROR");
    if (!/^-?\d{5,20}$/.test(chatId)) return err("Chat ID ต้องเป็นตัวเลข (กลุ่มมักขึ้นต้นด้วย -100)", 400, "VALIDATION_ERROR");

    const secret = await getEncryptionSecret();
    if (!secret) return err("ยังไม่ได้ตั้งค่ากุญแจเข้ารหัสบนเซิร์ฟเวอร์", 400, "KEY_MISSING");

    const checked = await verifyAndTest(token, chatId, session.displayName || session.username);
    if (!checked.ok) return err(checked.error, 400, "TELEGRAM_ERROR");

    await saveTelegramConfig(await getD1Database(), token, chatId, checked.botUsername, secret);
    return NextResponse.json({ success: true, bot_username: checked.botUsername, message: "ตรวจสอบและบันทึกการตั้งค่า Telegram สำเร็จ" });
  } catch (e) {
    console.error("PUT /api/admin/telegram error:", e instanceof Error ? e.name : "unknown"); // message may contain the token URL
    return err("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า", 500);
  }
}

// Toggle on/off (any admin)
export async function PATCH(req: NextRequest) {
  if (!(await sessionOf(req))) return err("ไม่มีสิทธิ์เข้าถึง", 401);
  if (!isJson(req)) return err("รูปแบบคำขอไม่ถูกต้อง", 415);
  try {
    const body = (await req.json()) as any;
    if (typeof body.enabled !== "boolean") return err("ค่า enabled ต้องเป็น boolean", 400, "VALIDATION_ERROR");
    const db = await getD1Database();
    if (!(await getTelegramStatus(db)).configured) return err("ยังไม่ได้ตั้งค่า Telegram", 400, "NOT_CONFIGURED");
    await setTelegramEnabled(db, body.enabled);
    return NextResponse.json({ success: true, enabled: body.enabled, message: body.enabled ? "เปิดการแจ้งเตือน Telegram แล้ว" : "ปิดการแจ้งเตือน Telegram แล้ว" });
  } catch (e) {
    console.error("PATCH /api/admin/telegram error:", e);
    return err("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า", 500);
  }
}

// Test ping (any admin)
export async function POST(req: NextRequest) {
  const session = await sessionOf(req);
  if (!session) return err("ไม่มีสิทธิ์เข้าถึง", 401);
  if (!isJson(req)) return err("รูปแบบคำขอไม่ถูกต้อง", 415);
  const result = await sendTelegramTestPing(await getD1Database(), session.displayName || session.username);
  if (!result.success) return err(result.error || "ไม่สามารถส่งข้อความทดสอบได้", 400);
  return NextResponse.json({ success: true, message: "ส่งข้อความทดสอบเข้า Telegram สำเร็จแล้ว!" });
}

// Remove token + chat id (superadmin)
export async function DELETE(req: NextRequest) {
  const session = await sessionOf(req);
  if (!session) return err("ไม่มีสิทธิ์เข้าถึง", 401);
  if (session.role !== "superadmin") return err("เฉพาะ Superadmin เท่านั้นที่ลบการตั้งค่า Telegram ได้", 403);
  if (!isJson(req)) return err("รูปแบบคำขอไม่ถูกต้อง", 415);
  await clearTelegramConfig(await getD1Database());
  return NextResponse.json({ success: true, message: "ลบการตั้งค่า Telegram แล้ว" });
}
