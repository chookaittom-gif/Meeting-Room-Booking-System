import Image from "next/image";
import Link from "next/link";
import { PublicCalendar } from "./components/PublicCalendar";
import { Sparkles, ArrowRight, MapPin, Users2, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center space-y-8 sm:space-y-10 py-2 sm:py-4">
      {/* Hero Section */}
      <div className="w-full bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 overflow-hidden shadow-[0_16px_48px_rgba(88,44,131,0.07)] hover:shadow-[0_20px_60px_rgba(88,44,131,0.12)] transition-all duration-300">
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[3/2] max-h-[540px] bg-gradient-to-br from-violet-100 via-purple-50 to-amber-50 overflow-hidden group">
          <Image
            src="/images/meeting-room.jpg"
            alt="ภาพหอประชุมและห้องประชุม มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง"
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
            priority
          />
          {/* Subtle Ambient Vignette & Floating Badge */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
          <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/92 backdrop-blur-md text-[#582c83] text-xs font-bold rounded-full shadow-[0_4px_16px_rgba(88,44,131,0.15)] border border-white/90">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              บริการจองห้องประชุมออนไลน์
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-t border-[#582c83]/10 bg-gradient-to-r from-white via-[#faf7fd] to-white">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#1e1e24] tracking-tight">
                หอประชุมชั้น 2 และห้องประชุมชั้น 7
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#582c83]/10 text-[#582c83] border border-[#582c83]/15">
                <MapPin className="w-3 h-3 text-[#582c83]" />
                มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
              </span>
            </div>
            <p className="text-sm text-[#595963] max-w-2xl leading-relaxed flex items-start gap-1.5">
              <Clock className="w-4 h-4 text-[#582c83] shrink-0 mt-0.5" />
              <span>เปิดให้บริการทุกวัน ระหว่างเวลา <strong>08:30 – 16:30 น.</strong> รองรับรูปแบบโต๊ะทั้ง Theater, Classroom, Cluster, U-Shape และ Boardroom พร้อมบริการอาหารกลางวันและเครื่องดื่ม</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] hover:from-violet-700 hover:to-[#381a54] text-white font-bold text-base shadow-[0_6px_22px_rgba(88,44,131,0.25)] hover:shadow-[0_10px_30px_rgba(88,44,131,0.35)] transition-all duration-300 hover:-translate-y-0.5 touch-target text-center group active:scale-[0.99] border border-white/20"
            >
              <span>เริ่มจองห้องประชุม</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Room Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_8px_30px_rgba(88,44,131,0.05)] hover:border-[#582c83]/30 hover:shadow-[0_16px_40px_rgba(88,44,131,0.1)] hover:-translate-y-1 transition-all duration-300 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#582c83] bg-[#582c83]/10 border border-[#582c83]/20 px-3 py-1 rounded-full">
              ชั้น 2
            </span>
            <span className="text-xs text-[#595963] flex items-center gap-1 font-semibold">
              <Users2 className="w-3.5 h-3.5 text-[#582c83]" />
              ความจุสูงสุด 100 คน
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#1e1e24] group-hover:text-[#582c83] transition-colors">
            หอประชุมชั้น 2
          </h3>
          <p className="text-sm text-[#595963] leading-relaxed">
            รูปแบบหอประชุมปรับเปลี่ยนได้ตามความต้องการ รองรับทั้งงานประชุม สัมมนา และกิจกรรมพิธีการต่างๆ
          </p>
        </div>

        <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_8px_30px_rgba(88,44,131,0.05)] hover:border-[#582c83]/30 hover:shadow-[0_16px_40px_rgba(88,44,131,0.1)] hover:-translate-y-1 transition-all duration-300 space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 bg-amber-500/12 border border-amber-500/25 px-3 py-1 rounded-full">
              ชั้น 7
            </span>
            <span className="text-xs text-[#595963] flex items-center gap-1 font-semibold">
              <Users2 className="w-3.5 h-3.5 text-amber-600" />
              ความจุสูงสุด 300 คน
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#1e1e24] group-hover:text-[#582c83] transition-colors">
            ห้องประชุมชั้น 7
          </h3>
          <p className="text-sm text-[#595963] leading-relaxed">
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
