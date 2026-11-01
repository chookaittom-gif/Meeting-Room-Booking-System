"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PublicCalendar } from "./components/PublicCalendar";
import {
  CalendarDays,
  ArrowRight,
  MapPin,
  Users,
  Clock,
  LayoutList,
  Wifi,
  Utensils,
  Monitor,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building,
} from "lucide-react";

interface RoomDetail {
  id: "floor2" | "floor7";
  floorLabel: string;
  title: string;
  capacity: string;
  badgeColor: string;
  tagColor: string;
  description: string;
  features: string[];
  layouts: string[];
}

const ROOM_DATA: Record<"floor2" | "floor7", RoomDetail> = {
  floor2: {
    id: "floor2",
    floorLabel: "ชั้น 2",
    title: "หอประชุมชั้น 2",
    capacity: "ความจุสูงสุด 250 คน",
    badgeColor: "bg-[#f5f0fa] text-[#582c83] border-[#582c83]/20",
    tagColor: "text-[#582c83]",
    description: "พื้นที่หอประชุมอเนกประสงค์ ปรับเปลี่ยนรูปแบบได้ตามความต้องการ รองรับงานประชุม สัมมนา และกิจกรรมพิธีการ",
    features: [
      "ระบบเครื่องเสียงและไมโครโฟนไร้สาย",
      "โปรเจกเตอร์ความละเอียดสูงพร้อมจอรับภาพ",
      "ระบบปรับอากาศควบคุมอุณหภูมิแยกส่วน",
      "บริการจุดลงทะเบียนและรับรองหน้าห้อง",
    ],
    layouts: ["Theater (250)", "Classroom (150)", "U-Shape (50)", "Cluster (80)"],
  },
  floor7: {
    id: "floor7",
    floorLabel: "ชั้น 7",
    title: "ห้องประชุมชั้น 7",
    capacity: "ความจุสูงสุด 450 คน",
    badgeColor: "bg-amber-50 text-amber-900 border-amber-300",
    tagColor: "text-amber-800",
    description: "ห้องประชุมขนาดใหญ่ระดับหอประชุมหลัก เพียบพร้อมด้วยระบบเทคโนโลยีโสตทัศนูปกรณ์ จอแสดงผล LED ทันสมัย สำหรับงานวิชาการและงานประชุมระดับประเทศ",
    features: [
      "จอ LED Display ขนาดใหญ่พิเศษคมชัดสูง",
      "ระบบบันทึกเสียงและภาพสำหรับการประชุม",
      "ระบบไฟเวทีและไฟส่องสว่างปรับตามโหมดใช้งาน",
      "โถงพักคอยขนาดใหญ่และห้องรับรองผู้บริหาร",
    ],
    layouts: ["Theater (450)", "Classroom (250)", "U-Shape (80)", "Cluster (150)", "Boardroom (50)"],
  },
};

export default function HomePage() {
  const [activeRoom, setActiveRoom] = useState<"floor2" | "floor7">("floor7");
  const currentRoom = ROOM_DATA[activeRoom];

  // Current Thai formatted date
  const today = new Date();
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const formattedToday = `${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* ── BENTO GRID HERO & TECH SHOWCASE ─────────────────────────── */}
      <section aria-labelledby="bento-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <h2 id="bento-heading" className="sr-only">แดชบอร์ดแนะนำห้องประชุม</h2>

        {/* ── Bento 1: Interactive Room Showcase (8 Cols) ───────────── */}
        <div className="lg:col-span-8 card overflow-hidden flex flex-col justify-between">
          {/* Room Banner Preview */}
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 7" }}>
            <Image
              src="/images/meeting-room.jpg"
              alt="ภาพบรรยากาศหอประชุมและห้องประชุม มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw, 680px"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to top, rgba(24,24,27,0.45) 0%, transparent 60%)",
              }}
              aria-hidden="true"
            />

            {/* Top Bar on Image: Location Badge & Status */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 text-[#582c83] text-xs font-bold rounded-full shadow-sm border border-white/60">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                สวนดุสิต ลำปาง
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 text-emerald-700 text-xs font-bold rounded-full shadow-sm border border-white/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                เปิดรับจองออนไลน์
              </span>
            </div>

            {/* Room Tabs Switcher Floating at bottom of image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-black/50 backdrop-blur-md rounded-xl border border-white/20">
                <button
                  type="button"
                  onClick={() => setActiveRoom("floor7")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeRoom === "floor7"
                      ? "bg-white text-[#18181b] shadow-sm"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  ห้องประชุมชั้น 7 (450 คน)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoom("floor2")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeRoom === "floor2"
                      ? "bg-white text-[#18181b] shadow-sm"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  หอประชุมชั้น 2 (250 คน)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Info Section based on active tab */}
          <div className="p-5 sm:p-6 space-y-4 bg-white flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#18181b]">
                    {currentRoom.title}
                  </h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${currentRoom.badgeColor}`}>
                    {currentRoom.floorLabel}
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#52525b] flex items-center gap-1.5 bg-[#f8f8fc] px-2.5 py-1 rounded-lg border border-[#e4e2ea]">
                  <Users className="w-3.5 h-3.5 text-[#582c83]" aria-hidden="true" />
                  {currentRoom.capacity}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed">
                {currentRoom.description}
              </p>
            </div>

            {/* Tech Equipment Spec Grid */}
            <div className="pt-3 border-t border-[#e4e2ea] space-y-2.5">
              <span className="text-xs font-bold text-[#18181b] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                โสตทัศนูปกรณ์และสิ่งอำนวยความสะดวก:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentRoom.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-xs text-[#52525b]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported Layouts Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[#71717a] mr-1 flex items-center gap-1">
                <LayoutList className="w-3.5 h-3.5 text-[#582c83]" aria-hidden="true" />
                ผังที่รองรับ:
              </span>
              {currentRoom.layouts.map((layout, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium bg-[#f5f0fa] text-[#582c83] px-2 py-0.5 rounded-md border border-[#582c83]/15"
                >
                  {layout}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bento 2: Quick Status & Booking Console (4 Cols) ───────── */}
        <div className="lg:col-span-4 flex flex-col gap-5 justify-between">
          {/* Live Status Card */}
          <div className="card p-5 sm:p-6 bg-white space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#e4e2ea]">
                <span className="text-xs font-bold text-[#71717a] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#582c83]" aria-hidden="true" />
                  เวลาทำการระบบ
                </span>
                <span className="text-xs font-mono font-bold text-[#18181b] bg-[#f8f8fc] px-2.5 py-1 rounded-md border border-[#e4e2ea]">
                  {formattedToday}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <span className="text-sm font-extrabold text-[#18181b]">ระบบเปิดรับจองปกติ</span>
                </div>
                <p className="text-xs text-[#52525b] mt-1 leading-relaxed">
                  ช่วงเวลาให้บริการห้องประชุม <strong>08:30 – 16:30 น.</strong> รองรับการจองล่วงหน้าทั้งหน่วยงานภายในและภายนอก
                </p>
              </div>

              {/* Service Highlights Box */}
              <div className="bg-[#faf9fd] border border-[#582c83]/10 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#582c83]">
                  <Building className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>2 ห้องประชุมมาตรฐานพร้อมใช้งาน</span>
                </div>
                <ul className="text-xs text-[#52525b] space-y-1 pl-1">
                  <li>• ชั้น 2: สัมมนา อบรม กิจกรรมพิธีการ 250 ท่าน</li>
                  <li>• ชั้น 7: ประชุมวิชาการขนาดใหญ่ 450 ท่าน</li>
                </ul>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2">
              <Link
                href={`/book?room=${activeRoom}`}
                className="w-full btn-primary touch-target text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>เริ่มจองห้องประชุมนี้</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <p className="text-[11px] text-center text-[#71717a] mt-2">
                กรอกข้อมูลกิจกรรมและเลือกอาหารผ่านระบบออนไลน์ได้ใน 5 ขั้นตอน
              </p>
            </div>
          </div>

          {/* Quick Admin & Transparency Notice */}
          <div className="card p-4 bg-[#f8f8fc] border border-[#e4e2ea] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#e4e2ea] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#582c83]" aria-hidden="true" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#18181b]">ความปลอดภัยข้อมูล</p>
                <p className="text-[#71717a] text-[11px]">ไม่เปิดเผยข้อมูลส่วนบุคคลในตาราง</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO 3 & 4: TECH AMENITIES & SERVICE HIGHLIGHTS ─────────── */}
      <section aria-labelledby="amenities-heading" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <h2 id="amenities-heading" className="sr-only">จุดเด่นและสิ่งอำนวยความสะดวก</h2>

        <div className="card card-hover p-4 sm:p-5 space-y-2 bg-white">
          <div className="w-10 h-10 rounded-xl bg-[#f5f0fa] border border-[#582c83]/15 flex items-center justify-center text-[#582c83]">
            <Wifi className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-[#18181b]">Wi-Fi ความเร็วสูง</h3>
          <p className="text-xs text-[#52525b] leading-relaxed">
            เครือข่ายอินเทอร์เน็ตความเร็วสูงครอบคลุมทั้งหอประชุม รองรับผู้เข้าร่วมจำนวนมาก
          </p>
        </div>

        <div className="card card-hover p-4 sm:p-5 space-y-2 bg-white">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Monitor className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-[#18181b]">จอแสดงผล LED & โสตฯ</h3>
          <p className="text-xs text-[#52525b] leading-relaxed">
            จอภาพขนาดใหญ่ พร้อมระบบเครื่องเสียง ไมค์ลอย และอุปกรณ์ฉายภาพมาตรฐานสากล
          </p>
        </div>

        <div className="card card-hover p-4 sm:p-5 space-y-2 bg-white">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Utensils className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-[#18181b]">บริการจัดเลี้ยงอาหาร</h3>
          <p className="text-xs text-[#52525b] leading-relaxed">
            มีเมนูอาหารกลางวันและอาหารว่างมาตรฐานจากครัวสวนดุสิตให้เลือกจัดสรรในฟอร์มจอง
          </p>
        </div>

        <div className="card card-hover p-4 sm:p-5 space-y-2 bg-white">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CalendarDays className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-[#18181b]">ตรวจสอบคิวโปร่งใส</h3>
          <p className="text-xs text-[#52525b] leading-relaxed">
            เช็กช่วงเวลาว่างล่วงหน้าผ่านปฏิทินกลางออนไลน์ ป้องกันการจองช่วงเวลาซ้ำซ้อน
          </p>
        </div>
      </section>

      {/* ── PUBLIC CALENDAR SECTION ───────────────────────────────────── */}
      <section aria-labelledby="calendar-heading" className="w-full">
        <PublicCalendar />
      </section>
    </div>
  );
}
