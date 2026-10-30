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
      <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.35)]">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
          สถานะ: รอการอนุมัติ (Pending)
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">ส่งคำขอจองห้องประชุมเรียบร้อยแล้ว</h1>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          ระบบได้บันทึกคำขอจองห้องประชุมของท่านแล้ว และช่วงเวลาดังกล่าวจะถูกกันไว้ในระบบ เจ้าหน้าที่จะตรวจสอบและดำเนินการอนุมัติต่อไป
        </p>
      </div>

      {booking && (
        <div className="bg-[#16112a]/85 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-7 text-left space-y-3 shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs text-slate-400">รหัสอ้างอิงการจอง:</span>
            <span className="font-mono font-bold text-base text-violet-300 bg-violet-950/60 border border-violet-500/30 px-3 py-1 rounded-xl shadow-inner">
              {booking.booking_code}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1.5">
            <p><strong className="text-white">กิจกรรม:</strong> {booking.activity_name}</p>
            <p><strong className="text-white">ห้อง:</strong> {booking.room_id === "floor7" ? "ห้องประชุมชั้น 7" : "หอประชุมชั้น 2"}</p>
            <p><strong className="text-white">ยอดรวมทั้งสิ้น (รวม VAT):</strong> <span className="text-amber-300 font-bold">{booking.total_price_thb?.toLocaleString()} บาท</span></p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-[#582c83] hover:from-violet-500 hover:to-violet-700 text-white font-bold text-sm touch-target transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] border border-violet-400/30 active:scale-95"
        >
          <Home className="w-4 h-4" />
          กลับสู่หน้าหลัก / ดูปฏิทิน
        </Link>
        <Link
          href="/book"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm touch-target transition-all active:scale-95"
        >
          จองรายการอื่นเพิ่มเติม
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
