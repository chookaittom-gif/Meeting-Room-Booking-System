import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบในฐานะผู้ดูแล" },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" },
        { status: 401 }
      );
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json(
        { error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" },
        { status: 500 }
      );
    }

    // Query unread count
    const unreadResult = await db
      .prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE recipient_type = 'admin' AND is_read = 0"
      )
      .first<{ count: number }>();
    const unreadCount = unreadResult ? unreadResult.count : 0;

    // Query latest notifications with booking info
    const query = `
      SELECT 
        n.id,
        n.booking_id,
        n.event_type,
        n.is_read,
        n.created_at,
        b.booking_code,
        b.activity_name,
        b.room_id,
        b.starts_at,
        b.ends_at,
        b.status as current_booking_status,
        h.reason,
        h.changed_by
      FROM notifications n
      JOIN bookings b ON n.booking_id = b.id
      JOIN booking_status_history h ON n.history_id = h.id
      WHERE n.recipient_type = 'admin'
      ORDER BY n.created_at DESC, n.rowid DESC
      LIMIT 50;
    `;

    const notifications = await db.prepare(query).all();

    return NextResponse.json({
      success: true,
      unread_count: unreadCount,
      notifications: notifications.results || [],
    });
  } catch (err: any) {
    console.error("Notifications fetch error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน" },
      { status: 500 }
    );
  }
}
