import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import {
  isLineNotifyEnabled,
  setLineNotifyEnabled,
  getLineCredentials,
  sendLineTestPing,
} from "@/lib/line-service";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }
    if (session.role === "staff") {
      return NextResponse.json({ error: "สิทธิ์การเข้าถึงจำกัดเฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const enabled = await isLineNotifyEnabled(db);
    const { token: lineToken, groupId } = await getLineCredentials();

    return NextResponse.json({
      success: true,
      settings: {
        line_notify_enabled: enabled,
        group_id: groupId || null,
        configured: Boolean(lineToken && groupId),
      },
    });
  } catch (err: any) {
    console.error("GET /api/admin/settings error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงการตั้งค่า" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }
    if (session.role === "staff") {
      return NextResponse.json({ error: "สิทธิ์การเข้าถึงจำกัดเฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
    }

    const body = (await req.json()) as any;
    if (typeof body.line_notify_enabled !== "boolean") {
      return NextResponse.json({ error: "ค่า line_notify_enabled ต้องเป็น boolean" }, { status: 400 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    await setLineNotifyEnabled(db, body.line_notify_enabled);

    return NextResponse.json({
      success: true,
      line_notify_enabled: body.line_notify_enabled,
      message: body.line_notify_enabled ? "เปิดการแจ้งเตือน LINE แล้ว" : "ปิดการแจ้งเตือน LINE แล้ว",
    });
  } catch (err: any) {
    console.error("PATCH /api/admin/settings error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า" }, { status: 500 });
  }
}

// POST to trigger Test Ping
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }
    if (session.role === "staff") {
      return NextResponse.json({ error: "สิทธิ์การเข้าถึงจำกัดเฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
    }

    const result = await sendLineTestPing(session.displayName || session.username);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "ไม่สามารถส่งข้อความทดสอบได้" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ส่งข้อความทดสอบเข้ากลุ่ม LINE สำเร็จแล้ว!",
    });
  } catch (err: any) {
    console.error("POST /api/admin/settings error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการทดสอบส่งการแจ้งเตือน" }, { status: 500 });
  }
}
