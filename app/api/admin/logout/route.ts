import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "ออกจากระบบเรียบร้อยแล้ว" });
  response.cookies.delete("admin_session");
  return response;
}
