import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { deleteBooking, BookingNotFoundError, StatusTransitionError } from "@/lib/booking-service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "สิทธิ์การลบรายการจองจำกัดเฉพาะผู้ดูแลระบบสูงสุด (Superadmin) เท่านั้น" },
        { status: 403 }
      );
    }

    const { id: bookingId } = await params;
    if (!bookingId || bookingId.length > 64) {
      return NextResponse.json({ error: "รหัสรายการจองไม่ถูกต้อง" }, { status: 400 });
    }

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const deleted = await deleteBooking(db, bookingId);

    // Audit trail (Worker log only — no schema change): who deleted which booking.
    console.info(
      JSON.stringify({
        event: "booking_deleted",
        booking_id: bookingId,
        booking_code: deleted.booking_code,
        previous_status: deleted.status,
        admin_id: session.adminId,
        admin_username: session.username,
      })
    );

    return NextResponse.json({
      success: true,
      message: `ลบรายการจอง ${deleted.booking_code} เรียบร้อยแล้ว`,
    });
  } catch (err: any) {
    if (err instanceof BookingNotFoundError) {
      return NextResponse.json({ error: err.message, code: "NOT_FOUND" }, { status: 404 });
    }
    if (err instanceof StatusTransitionError) {
      return NextResponse.json({ error: err.message, code: "TRANSITION_ERROR" }, { status: 409 });
    }
    console.error("DELETE /api/admin/bookings/[id] error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบรายการจอง" }, { status: 500 });
  }
}
