import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const db = await getD1Database();
    if (!db) {
      return NextResponse.json(
        { error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" },
        { status: 500 }
      );
    }

    if (id === "all") {
      await db
        .prepare(
          "UPDATE notifications SET is_read = 1 WHERE recipient_type = 'admin' AND is_read = 0"
        )
        .run();
    } else {
      const res = await db
        .prepare(
          "UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_type = 'admin'"
        )
        .bind(id)
        .run();

      if (!res.meta.changes || res.meta.changes === 0) {
        return NextResponse.json(
          { error: "ไม่พบการแจ้งเตือนที่ต้องการอัปเดต" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Notification mark read error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตสถานะการแจ้งเตือน" },
      { status: 500 }
    );
  }
}
