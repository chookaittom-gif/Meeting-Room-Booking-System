import Image from "next/image";
import Link from "next/link";
import { PublicCalendar } from "./components/PublicCalendar";
import { Sparkles, ArrowRight, MapPin, Users2, ShieldCheck, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center space-y-8 sm:space-y-10 py-2 sm:py-4">
      {/* Hero Section */}
      <div className="w-full bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_12px_50px_rgba(0,0,0,0.6)] hover:border-violet-500/30 transition-all duration-300">
        <div className="relative w-full h-60 sm:h-84 bg-gradient-to-br from-violet-900/30 via-[#16112a] to-transparent">
          <Image
            src="/images/meeting-room.png"
            alt="ภาพหอประชุมและห้องประชุม มหาวิทยาลัยสวนดุสิต ลำปาง"
            fill
            className="object-cover opacity-85"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16112a] via-[#16112a]/60 to-transparent flex items-end p-6 sm:p-8">
            <div className="text-white space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-950/80 backdrop-blur-md text-violet-200 text-xs font-bold rounded-full shadow-lg border border-violet-500/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                บริการจองห้องประชุมออนไลน์
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                หอประชุมชั้น 2 และห้องประชุมชั้น 7
              </h1>
              <p className="text-xs sm:text-base text-slate-300 flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
                มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-white/5 bg-[#140f26]/60">
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              ตรวจสอบวันว่างและส่งคำขอจองห้องประชุม
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              เปิดให้บริการทุกวัน ระหว่างเวลา 08:30 – 16:30 น. รองรับรูปแบบโต๊ะทั้ง Theater, Classroom, Cluster, U-Shape และ Boardroom พร้อมบริการอาหารกลางวันและเครื่องดื่ม
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-[#582c83] hover:from-violet-500 hover:to-violet-700 text-white font-bold text-base shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] border border-violet-400/40 transition-all duration-300 hover:-translate-y-0.5 touch-target text-center group active:scale-[0.99]"
            >
              <span>เริ่มจองห้องประชุม</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Room Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <div className="bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-violet-500/40 hover:shadow-[0_0_35px_rgba(139,92,246,0.2)] hover:-translate-y-1 transition-all duration-300 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-300 bg-violet-500/20 border border-violet-500/40 px-3 py-1 rounded-full shadow-inner">
              ชั้น 2
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1 font-semibold">
              <Users2 className="w-3.5 h-3.5 text-violet-400" />
              ความจุสูงสุด 100 คน
            </span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
            หอประชุมชั้น 2
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            รูปแบบหอประชุมปรับเปลี่ยนได้ตามความต้องการ รองรับทั้งงานประชุม สัมมนา และกิจกรรมพิธีการต่างๆ
          </p>
        </div>

        <div className="bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-violet-500/40 hover:shadow-[0_0_35px_rgba(139,92,246,0.2)] hover:-translate-y-1 transition-all duration-300 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full shadow-inner">
              ชั้น 7
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1 font-semibold">
              <Users2 className="w-3.5 h-3.5 text-amber-400" />
              ความจุสูงสุด 300 คน
            </span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
            ห้องประชุมชั้น 7
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            ห้องประชุมขนาดใหญ่ รองรับผู้เข้าร่วมได้ถึง 300 คน พร้อมระบบโสตทัศนูปกรณ์ครบครันสำหรับงานสัมมนาขนาดใหญ่
          </p>
        </div>
      </div>

      {/* Public Calendar Section */}
      <div className="w-full pt-2">
        <PublicCalendar />
      </div>
    </div>
  );
}
