import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { dayBounds, BusyRange } from "@/lib/availability";

// Read-only: busy time ranges of one room on one day. No personal data.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room") ?? "";
    const date = searchParams.get("date") ?? "";

    if (!/^[a-z0-9_-]{1,32}$/.test(room) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: "พารามิเตอร์ไม่ถูกต้อง", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const { open, close } = dayBounds(date);
    const { results } = await db
      .prepare(
        `SELECT starts_at, ends_at, status FROM bookings
         WHERE room_id = ? AND status IN ('pending', 'approved') AND starts_at < ? AND ends_at > ?
         ORDER BY starts_at`
      )
      .bind(room, close, open)
      .all<BusyRange>();

    return NextResponse.json({ success: true, busy: results ?? [] });
  } catch (err) {
    console.error("Availability fetch error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบช่วงเวลา" }, { status: 500 });
  }
}
