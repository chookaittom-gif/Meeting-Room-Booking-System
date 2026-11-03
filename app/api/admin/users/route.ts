import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken, hashPassword } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
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

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const result = await db
      .prepare(
        "SELECT id, username, display_name, COALESCE(role, 'admin') as role, created_at FROM admins ORDER BY CASE WHEN role = 'superadmin' THEN 0 ELSE 1 END, created_at ASC"
      )
      .all();

    return NextResponse.json({
      success: true,
      users: (result.results || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        role: u.role,
        createdAt: u.created_at,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ดูแลระบบ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const username = (body.username || "").trim().toLowerCase();
    const displayName = (body.displayName || "").trim();
    const password = body.password || "";
    const role = body.role === "staff" ? "staff" : "admin";

    if (!username || !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้ (Username) ต้องเป็นภาษาอังกฤษ ตัวเลข หรือขีดล่าง ความยาว 3-30 ตัวอักษร" },
        { status: 400 }
      );
    }

    if (!displayName || displayName.length < 2 || displayName.length > 100) {
      return NextResponse.json({ error: "กรุณาระบุชื่อ-นามสกุลความยาว 2-100 ตัวอักษร" }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    // Check duplicate username
    const existing = await db
      .prepare("SELECT id FROM admins WHERE username = ?")
      .bind(username)
      .first();

    if (existing) {
      return NextResponse.json({ error: `ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว` }, { status: 409 });
    }

    const newId = `admin_${username}_${Date.now()}`;
    const passwordHash = await hashPassword(password);
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare(
        "INSERT INTO admins (id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(newId, username, passwordHash, displayName, role, now)
      .run();

    return NextResponse.json(
      {
        success: true,
        message: `เพิ่มผู้ดูแลระบบ "${displayName}" (${username}) เรียบร้อยแล้ว`,
        user: {
          id: newId,
          username,
          displayName,
          role: role,
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ" }, { status: 500 });
  }
}
