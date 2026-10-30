import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { PublicCalendarEvent } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("room_id");
    const status = searchParams.get("status");

    // Public calendar query: Strictly omit coordinator PII!
    let sql = `
      SELECT 
        b.id,
        b.booking_code,
        b.room_id,
        r.name as room_name,
        b.activity_name,
        b.meeting_type,
        b.starts_at,
        b.ends_at,
        b.status
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (roomId && roomId !== "all") {
      sql += " AND b.room_id = ?";
      bindings.push(roomId);
    }

    if (status && status !== "all") {
      sql += " AND b.status = ?";
      bindings.push(status);
    }

    sql += " ORDER BY b.starts_at ASC LIMIT 200";

    const stmt = db.prepare(sql);
    const res = await (bindings.length > 0 ? stmt.bind(...bindings).all() : stmt.all());

    // Format events with Bangkok date/time strings for easy frontend consumption
    const events: PublicCalendarEvent[] = (res.results as any[]).map((row) => ({
      id: row.id,
      booking_code: row.booking_code,
      room_id: row.room_id,
      room_name: row.room_name,
      activity_name: row.activity_name,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      status: row.status,
    }));

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    console.error("Public calendar fetch error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน" }, { status: 500 });
  }
}
