"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import { formatThaiEpochDate, formatThaiEpochTime } from "@/lib/date-utils";

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

  const hasRoomFee = typeof booking?.room_fee_thb === "number" && booking.room_fee_thb > 0;
  const grandTotal = (booking?.room_fee_thb || 0) + (booking?.total_price_thb || 0);

  return (
    <div className="w-full max-w-xl mx-auto py-8 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
          สถานะ: รอการอนุมัติ (Pending)
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1e1e24] tracking-tight">ส่งคำขอจองห้องประชุมเรียบร้อยแล้ว</h1>
        <p className="text-sm text-[#595963] max-w-md mx-auto leading-relaxed">
          ระบบได้บันทึกคำขอจองห้องประชุมของท่านแล้ว และช่วงเวลาดังกล่าวจะถูกกันไว้ในระบบ เจ้าหน้าที่จะตรวจสอบและดำเนินการอนุมัติต่อไป
        </p>
      </div>

      {booking && (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-7 text-left space-y-3 shadow-[0_16px_48px_rgba(88,44,131,0.06)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e6e2ea]">
            <span className="text-xs text-[#595963] font-medium">รหัสอ้างอิงการจอง:</span>
            <span className="font-mono font-bold text-base text-[#582c83] bg-[#f5f0fa] border border-[#582c83]/15 px-3 py-1 rounded-xl">
              {booking.booking_code}
            </span>
          </div>

          <div className="text-xs text-[#595963] space-y-1.5 font-medium">
            <p><strong className="text-[#1e1e24]">กิจกรรม:</strong> {booking.activity_name}</p>
            <p><strong className="text-[#1e1e24]">ห้อง:</strong> {booking.room_id === "floor7" ? "ห้องประชุมชั้น 7" : "หอประชุมชั้น 2"}</p>
            {booking.starts_at && (
              <p><strong className="text-[#1e1e24]">วัน-เวลา:</strong> <span className="text-[#582c83] font-semibold">{formatThaiEpochDate(booking.starts_at)} ({formatThaiEpochTime(booking.starts_at)} – {formatThaiEpochTime(booking.ends_at)})</span></p>
            )}

            {hasRoomFee ? (
              <div className="pt-2 mt-2 border-t border-[#e6e2ea] space-y-1">
                <p><strong className="text-[#1e1e24]">ค่าห้องจ่ายรายวัน:</strong> <span className="font-bold text-[#1e1e24]">{booking.room_fee_thb.toLocaleString()} บาท</span></p>
                <p><strong className="text-amber-900">เงินประกันการจองห้อง (50%):</strong> <span className="font-bold text-amber-800">{booking.deposit_thb?.toLocaleString()} บาท</span> <span className="text-[11px] text-[#8c8c96]">(*วางเงินประกันครึ่งนึงของค่าห้อง)</span></p>
                {booking.total_price_thb > 0 && (
                  <p><strong className="text-[#1e1e24]">ค่าอาหารและเครื่องดื่ม:</strong> {booking.total_price_thb.toLocaleString()} บาท</p>
                )}
                <p className="pt-1 border-t border-dashed border-[#e6e2ea]"><strong className="text-[#1e1e24]">ยอดรวมทั้งสิ้น (รวม VAT):</strong> <span className="text-[#582c83] font-black text-sm">{grandTotal.toLocaleString()} บาท</span></p>
              </div>
            ) : (
              <p><strong className="text-[#1e1e24]">ยอดรวมทั้งสิ้น (รวม VAT):</strong> <span className="text-[#582c83] font-black">{booking.total_price_thb?.toLocaleString()} บาท</span></p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] hover:from-violet-700 hover:to-[#381a54] text-white font-bold text-sm touch-target transition-all shadow-[0_4px_16px_rgba(88,44,131,0.22)] border border-white/20 active:scale-95"
        >
          <Home className="w-4 h-4" />
          กลับสู่หน้าหลัก / ดูปฏิทิน
        </Link>
        <Link
          href="/book"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-[#e6e2ea] bg-white hover:bg-gray-50 text-[#1e1e24] font-bold text-sm touch-target transition-all shadow-2xs active:scale-95"
        >
          จองรายการอื่นเพิ่มเติม
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
