import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import {
  createBookingAtomic,
  BookingConflictError,
  ValidationError,
} from "@/lib/booking-service";
import { sendLinePendingNotification } from "@/lib/line-service";
import { CreateBookingPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: CreateBookingPayload = await req.json();

    const db = await getD1Database();
    if (!db) {
      return NextResponse.json(
        { error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" },
        { status: 500 }
      );
    }

    const { booking, isExisting } = await createBookingAtomic(db, body);

    // Non-blocking LINE notification for new pending booking
    if (!isExisting) {
      try {
        await sendLinePendingNotification(db, booking.id);
      } catch (lineErr) {
        console.error("Non-blocking LINE pending notification failed:", lineErr);
      }
    }

    return NextResponse.json({
      success: true,
      isExisting,
      booking: {
        id: booking.id,
        booking_code: booking.booking_code,
        status: booking.status,
        room_id: booking.room_id,
        activity_name: booking.activity_name,
        starts_at: booking.starts_at,
        ends_at: booking.ends_at,
        total_price_thb: booking.total_price_thb,
        created_at: booking.created_at,
      },
    });
  } catch (err: any) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json(
        { error: err.message, code: "CONFLICT" },
        { status: 409 }
      );
    }
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    console.error("Booking creation error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการประมวลผลคำขอจอง" },
      { status: 500 }
    );
  }
}
