import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const roomId = searchParams.get("room_id");
    const search = searchParams.get("search");

    let sql = `
      SELECT 
        b.*,
        r.name as room_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE 1=1
    `;
    const bindings: any[] = [];

    if (status && status !== "all") {
      sql += " AND b.status = ?";
      bindings.push(status);
    }
    if (roomId && roomId !== "all") {
      sql += " AND b.room_id = ?";
      bindings.push(roomId);
    }
    if (search && search.trim().length > 0) {
      sql += " AND (b.activity_name LIKE ? OR b.project_name LIKE ? OR b.coordinator_name LIKE ? OR b.booking_code LIKE ?)";
      const pattern = `%${search.trim()}%`;
      bindings.push(pattern, pattern, pattern, pattern);
    }

    sql += " ORDER BY b.created_at DESC LIMIT 300";

    const stmt = db.prepare(sql);
    const res = await (bindings.length > 0 ? stmt.bind(...bindings).all() : stmt.all());

    // Fetch items for each booking
    const bookings = res.results as any[];
    for (const b of bookings) {
      const itemsRes = await db.prepare("SELECT * FROM booking_items WHERE booking_id = ?").bind(b.id).all();
      b.items = itemsRes.results || [];

      const historyRes = await db.prepare("SELECT * FROM booking_status_history WHERE booking_id = ? ORDER BY changed_at ASC").bind(b.id).all();
      b.history = historyRes.results || [];
    }

    return NextResponse.json({ success: true, bookings });
  } catch (err: any) {
    console.error("Admin bookings query error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลรายการจอง" }, { status: 500 });
  }
}
