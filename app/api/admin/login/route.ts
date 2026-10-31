import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifyPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as any;

    if (!username || !password) {
      return NextResponse.json({ error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    let admin: { id: string; username: string; password_hash: string; display_name: string; role?: string } | null = null;
    try {
      admin = await db
        .prepare("SELECT id, username, password_hash, display_name, role FROM admins WHERE username = ?")
        .bind(username.trim().toLowerCase())
        .first<{ id: string; username: string; password_hash: string; display_name: string; role?: string }>();
    } catch {
      // Fallback if role column has not been migrated yet
      admin = await db
        .prepare("SELECT id, username, password_hash, display_name FROM admins WHERE username = ?")
        .bind(username.trim().toLowerCase())
        .first<{ id: string; username: string; password_hash: string; display_name: string }>();
    }

    if (!admin) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, admin.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const adminRole = (admin.role === "superadmin" || admin.username === "chookait") ? "superadmin" : "admin";

    // Create session token (8 hours)
    const token = await createSessionToken({
      adminId: admin.id,
      username: admin.username,
      displayName: admin.display_name,
      role: adminRole,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.display_name,
        role: adminRole,
      },
    });

    // Set HttpOnly, Secure, SameSite=Lax cookie
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }, { status: 500 });
  }
}
