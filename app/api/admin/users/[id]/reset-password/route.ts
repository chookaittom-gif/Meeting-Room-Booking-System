import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken, hashPassword } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;
    const token = req.cookies.get("admin_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    if (session.role !== "superadmin") {
      return NextResponse.json(
        { error: "สิทธิ์การเข้าถึงจำกัดเฉพาะผู้ดูแลระบบสูงสุด (Superadmin) เท่านั้น" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as any;
    const newPassword = body.new_password || "";

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" },
        { status: 400 }
      );
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const targetAdmin = await db
      .prepare("SELECT id, username, display_name FROM admins WHERE id = ?")
      .bind(targetId)
      .first<{ id: string; username: string; display_name: string }>();

    if (!targetAdmin) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ดูแลระบบนี้" }, { status: 404 });
    }

    const newHash = await hashPassword(newPassword);

    await db
      .prepare("UPDATE admins SET password_hash = ? WHERE id = ?")
      .bind(newHash, targetId)
      .run();

    return NextResponse.json({
      success: true,
      message: `กำหนดรหัสผ่านใหม่ให้ "${targetAdmin.display_name}" (${targetAdmin.username}) เรียบร้อยแล้ว`,
    });
  } catch (err: any) {
    console.error("POST /api/admin/users/[id]/reset-password error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการกำหนดรหัสผ่านใหม่" }, { status: 500 });
  }
}
