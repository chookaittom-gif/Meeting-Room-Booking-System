import { NextRequest, NextResponse } from "next/server";
import { getD1Database } from "@/lib/db";
import { getBookingStats } from "@/lib/stats";

// Public aggregate statistics — no authentication required, no PII returned.
export async function GET(req: NextRequest) {
  try {
    const db = await getD1Database();
    if (!db) {
      return NextResponse.json({ error: "ระบบฐานข้อมูลไม่พร้อมใช้งาน" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const monthsParam = parseInt(searchParams.get("months") || "12", 10);
    const months = Number.isFinite(monthsParam) ? Math.min(Math.max(monthsParam, 3), 24) : 12;

    const stats = await getBookingStats(db, months);

    return NextResponse.json(
      { success: true, stats },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: any) {
    console.error("Stats query error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงสถิติการจอง" }, { status: 500 });
  }
}
