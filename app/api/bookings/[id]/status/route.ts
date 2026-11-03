import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { updateBookingStatus, StatusTransitionError, ValidationError } from "@/lib/booking-service";
import { sendLineApprovedNotification } from "@/lib/line-service";
import { sendTelegramApprovedNotification } from "@/lib/telegram-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("admin_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบในฐานะผู้ดูแล" }, { status: 401 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    if (session.role === "staff") {
      return NextResponse.json(
        { error: "บัญชีระดับเจ้าหน้าที่ (Staff) ไม่มีสิทธิ์เปลี่ยนสถานะหรืออนุมัติการจอง" },
        { status: 403 }
      );
    }

    const { id: bookingId } = await params;
    const body = (await req.json()) as any;
    const { from_status, to_status, reason } = body;

    if (!from_status || !to_status) {
      return NextResponse.json({ error: "จำเป็นต้องระบุ from_status และ to_status" }, { status: 400 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    await updateBookingStatus(
      db,
      bookingId,
      from_status,
      to_status,
      session.adminId,
      reason
    );

    let lineNotification = null;
    if (to_status === "approved") {
      try {
        lineNotification = await sendLineApprovedNotification(db, bookingId);
      } catch (lineErr) {
        console.error("Non-blocking LINE notification failed:", lineErr);
      }
      await sendTelegramApprovedNotification(db, bookingId); // never throws
    }

    return NextResponse.json({
      success: true,
      message: `เปลี่ยนสถานะเป็น ${to_status} สำเร็จแล้ว`,
      status: to_status,
      line_notification: lineNotification,
    });
  } catch (err: any) {
    if (err instanceof StatusTransitionError) {
      return NextResponse.json({ error: err.message, code: "TRANSITION_ERROR" }, { status: 409 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message, code: "VALIDATION_ERROR" }, { status: 400 });
    }
    console.error("Booking status update error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการปรับปรุงสถานะ" }, { status: 500 });
  }
}
