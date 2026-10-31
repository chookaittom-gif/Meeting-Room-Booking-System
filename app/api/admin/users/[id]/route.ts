import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function PATCH(
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
    const displayName = body?.display_name?.trim();

    if (!displayName || displayName.length < 2) {
      return NextResponse.json(
        { error: "ชื่อ-นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร" },
        { status: 400 }
      );
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const targetAdmin = await db
      .prepare("SELECT id, username, display_name, role FROM admins WHERE id = ?")
      .bind(targetId)
      .first<{ id: string; username: string; display_name: string; role: string }>();

    if (!targetAdmin) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ดูแลระบบที่ต้องการแก้ไข" }, { status: 404 });
    }

    await db
      .prepare("UPDATE admins SET display_name = ? WHERE id = ?")
      .bind(displayName, targetId)
      .run();

    return NextResponse.json({
      success: true,
      message: `แก้ไขชื่อผู้ดูแลระบบเป็น "${displayName}" เรียบร้อยแล้ว`,
      admin: {
        id: targetAdmin.id,
        username: targetAdmin.username,
        displayName: displayName,
        role: targetAdmin.role || (targetAdmin.username === "chookait" ? "superadmin" : "admin"),
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขชื่อผู้ดูแลระบบ" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Safety guardrail 1: Cannot delete self
    if (session.adminId === targetId) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีตนเองได้" },
        { status: 400 }
      );
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const targetAdmin = await db
      .prepare("SELECT id, username, display_name, role FROM admins WHERE id = ?")
      .bind(targetId)
      .first<{ id: string; username: string; display_name: string; role: string }>();

    if (!targetAdmin) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ดูแลระบบที่ต้องการลบ" }, { status: 404 });
    }

    // Safety guardrail 2: Cannot delete primary superadmin
    if (targetAdmin.username === "chookait" || targetAdmin.role === "superadmin") {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีผู้ดูแลระบบสูงสุด (Superadmin) ได้" },
        { status: 400 }
      );
    }

    await db.prepare("DELETE FROM admins WHERE id = ?").bind(targetId).run();

    return NextResponse.json({
      success: true,
      message: `ลบบัญชีผู้ดูแลระบบ "${targetAdmin.display_name}" (${targetAdmin.username}) เรียบร้อยแล้ว`,
    });
  } catch (err: any) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบผู้ดูแลระบบ" }, { status: 500 });
  }
}
