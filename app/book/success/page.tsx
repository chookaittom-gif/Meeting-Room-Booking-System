"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Calendar, ArrowRight, Home } from "lucide-react";

export default function BookingSuccessPage() {
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("last_booking_success");
      if (saved) {
        setBooking(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto py-8 text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          สถานะ: รอการอนุมัติ (Pending)
        </span>
        <h1 className="text-2xl font-bold text-[#1e1e24]">ส่งคำขอจองห้องประชุมเรียบร้อยแล้ว</h1>
        <p className="text-sm text-[#595963] max-w-md mx-auto">
          ระบบได้บันทึกคำขอจองห้องประชุมของท่านแล้ว และช่วงเวลาดังกล่าวจะถูกกันไว้ในระบบ เจ้าหน้าที่จะตรวจสอบและดำเนินการอนุมัติต่อไป
        </p>
      </div>

      {booking && (
        <div className="bg-white rounded-2xl border border-[#e6e2ea] p-6 text-left space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#e6e2ea]">
            <span className="text-xs text-[#595963]">รหัสอ้างอิงการจอง:</span>
            <span className="font-mono font-bold text-base text-[#582c83] bg-[#f5f0fa] px-3 py-1 rounded-lg">
              {booking.booking_code}
            </span>
          </div>

          <div className="text-xs text-[#595963] space-y-1">
            <p><strong>กิจกรรม:</strong> {booking.activity_name}</p>
            <p><strong>ห้อง:</strong> {booking.room_id === "floor7" ? "ห้องประชุมชั้น 7" : "หอประชุมชั้น 2"}</p>
            <p><strong>ยอดรวมทั้งสิ้น (รวม VAT):</strong> {booking.total_price_thb?.toLocaleString()} บาท</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white font-medium text-sm touch-target transition-colors shadow-xs"
        >
          <Home className="w-4 h-4" />
          กลับสู่หน้าหลัก / ดูปฏิทิน
        </Link>
        <Link
          href="/book"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-[#e6e2ea] hover:bg-gray-50 text-[#1e1e24] font-medium text-sm touch-target transition-colors"
        >
          จองรายการอื่นเพิ่มเติม
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
