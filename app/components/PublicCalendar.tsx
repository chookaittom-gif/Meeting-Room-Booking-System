"use client";

import React, { useState, useEffect } from "react";
import { PublicCalendarEvent, BookingStatus } from "@/lib/types";
import { Calendar as CalendarIcon, List, Filter, ChevronLeft, ChevronRight, X, Clock, MapPin, Tag, Loader2, Sparkles } from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending: { label: "รอการอนุมัติ", bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/40", dot: "bg-amber-400" },
  approved: { label: "อนุมัติแล้ว", bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400" },
  rejected: { label: "ไม่อนุมัติ", bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/40", dot: "bg-rose-400" },
  cancelled: { label: "ยกเลิก", bg: "bg-slate-700/40", text: "text-slate-400", border: "border-slate-600/40", dot: "bg-slate-400" },
};

function formatThaiDate(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const bangkok = new Date(d.getTime() + 7 * 3600 * 1000);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const day = bangkok.getUTCDate();
  const month = months[bangkok.getUTCMonth()];
  const year = bangkok.getUTCFullYear() + 543;
  return `${day} ${month} ${year}`;
}

function formatThaiTime(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const bangkok = new Date(d.getTime() + 7 * 3600 * 1000);
  const h = String(bangkok.getUTCHours()).padStart(2, "0");
  const m = String(bangkok.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} น.`;
}

export function PublicCalendar() {
  const [events, setEvents] = useState<PublicCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<PublicCalendarEvent | null>(null);

  // Current calendar month view state (Bangkok time)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (roomFilter !== "all") params.append("room_id", roomFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/calendar?${params.toString()}`);
      const data = (await res.json()) as any;
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [roomFilter, statusFilter]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const thaiMonthName = `${thaiMonths[month]} ${year + 543}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Filter events for month cells
  const getEventsForDay = (dayNum: number) => {
    return events.filter((ev) => {
      const d = new Date(ev.starts_at * 1000);
      const bangkok = new Date(d.getTime() + 7 * 3600 * 1000);
      return (
        bangkok.getUTCFullYear() === year &&
        bangkok.getUTCMonth() === month &&
        bangkok.getUTCDate() === dayNum
      );
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Controls */}
      <div className="bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 sm:p-7 shadow-[0_12px_45px_rgba(0,0,0,0.6)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
              <CalendarIcon className="w-5 h-5 text-violet-400" />
              ตารางการใช้ห้องประชุม (Calendar HUD)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              ตรวจสอบช่วงเวลาว่างและการจัดกิจกรรม (ไม่แสดงข้อมูลส่วนบุคคลของผู้ประสานงาน)
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl self-start sm:self-auto border border-white/10">
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
                viewMode === "month"
                  ? "bg-gradient-to-r from-violet-600 to-[#582c83] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-violet-400/40"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              ปฏิทินรายเดือน
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-violet-600 to-[#582c83] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-violet-400/40"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <List className="w-4 h-4" />
              รายการจอง
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-violet-400" />
            กรองตามห้อง:
          </span>
          {[
            { id: "all", label: "ทั้งหมด" },
            { id: "floor2", label: "หอประชุมชั้น 2" },
            { id: "floor7", label: "ห้องประชุมชั้น 7" },
          ].map((rf) => (
            <button
              key={rf.id}
              onClick={() => setRoomFilter(rf.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all touch-target ${
                roomFilter === rf.id
                  ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)] border border-violet-400/40"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
              }`}
            >
              {rf.label}
            </button>
          ))}

          <span className="font-bold text-slate-200 ml-2 flex items-center gap-1">
            สถานะ:
          </span>
          {[
            { id: "all", label: "ทุกสถานะ" },
            { id: "pending", label: "รอการอนุมัติ" },
            { id: "approved", label: "อนุมัติแล้ว" },
            { id: "rejected", label: "ไม่อนุมัติ" },
            { id: "cancelled", label: "ยกเลิก" },
          ].map((sf) => (
            <button
              key={sf.id}
              onClick={() => setStatusFilter(sf.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all touch-target ${
                statusFilter === sf.id
                  ? "bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)] border border-violet-400/40"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          <p className="text-sm text-slate-300 mt-3 font-medium">กำลังโหลดข้อมูลปฏิทิน HUD...</p>
        </div>
      ) : viewMode === "month" ? (
        /* =================== MONTH VIEW =================== */
        <div className="bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {thaiMonthName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                aria-label="เดือนก่อนหน้า"
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition-all touch-target"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="เดือนถัดไป"
                className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition-all touch-target"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-white/10 text-center text-xs font-bold text-slate-300 bg-white/5">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
              <div key={i} className={`py-2.5 ${i === 0 ? "text-rose-400 font-extrabold" : ""}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-white/10 border-b border-white/10">
            {/* Empty offset days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] bg-black/20 p-1.5" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayEvents = getEventsForDay(dayNum);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 flex flex-col transition-colors hover:bg-white/5 ${
                    isToday ? "bg-violet-950/30 ring-1 ring-inset ring-violet-500/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-gradient-to-r from-violet-600 to-[#582c83] text-white shadow-[0_0_10px_rgba(139,92,246,0.6)]"
                          : "text-slate-200"
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>

                  {/* Day Events Badges */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-none">
                    {dayEvents.map((ev) => {
                      const cfg = STATUS_CONFIG[ev.status];
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left p-1 rounded-lg border text-[11px] leading-tight block truncate font-medium transition-transform active:scale-95 ${cfg.bg} ${cfg.text} ${cfg.border} shadow-xs`}
                          title={`${ev.room_name} (${formatThaiTime(ev.starts_at)} - ${formatThaiTime(ev.ends_at)}): ${ev.activity_name}`}
                        >
                          <span className="font-bold">[{ev.room_id === "floor7" ? "ช.7" : "ช.2"}]</span>{" "}
                          {formatThaiTime(ev.starts_at)} {ev.activity_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* =================== LIST VIEW =================== */
        <div className="bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
          {events.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              ไม่พบรายการจองห้องประชุมตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {events.map((ev) => {
                const cfg = STATUS_CONFIG[ev.status];
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-4 sm:p-5 hover:bg-white/5 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs font-semibold text-violet-300 bg-violet-950/60 border border-violet-500/30 px-2 py-0.5 rounded-md">
                          {ev.room_name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{ev.booking_code}</span>
                      </div>
                      <h4 className="font-bold text-base text-white">{ev.activity_name}</h4>
                      <p className="text-xs text-slate-300 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-violet-400" />
                          {formatThaiDate(ev.starts_at)} ({formatThaiTime(ev.starts_at)} – {formatThaiTime(ev.ends_at)})
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-200 hover:bg-white/10 hover:border-violet-500/40 touch-target shrink-0 transition-all"
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================== EVENT DETAIL MODAL (No PII) =================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#16112a] rounded-3xl max-w-md w-full border border-white/15 shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-extrabold text-base text-white">รายละเอียดการจองห้องประชุม</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                aria-label="ปิด"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 touch-target transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">รหัสอ้างอิง:</span>
                <span className="font-mono font-bold text-sm text-violet-300 bg-violet-950/60 border border-violet-500/30 px-2.5 py-1 rounded-md">
                  {selectedEvent.booking_code}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">ชื่อกิจกรรม:</span>
                <h4 className="font-bold text-base text-white">{selectedEvent.activity_name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-violet-400" />
                    สถานที่
                  </span>
                  <p className="font-semibold text-xs text-slate-200">{selectedEvent.room_name}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-violet-400" />
                    สถานะ
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_CONFIG[selectedEvent.status].bg
                    } ${STATUS_CONFIG[selectedEvent.status].text} ${
                      STATUS_CONFIG[selectedEvent.status].border
                    }`}
                  >
                    {STATUS_CONFIG[selectedEvent.status].label}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  วันและเวลา
                </span>
                <p className="font-semibold text-xs text-slate-200">
                  วันที่ {formatThaiDate(selectedEvent.starts_at)}
                </p>
                <p className="text-xs text-slate-400">
                  เวลา {formatThaiTime(selectedEvent.starts_at)} – {formatThaiTime(selectedEvent.ends_at)}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-[11px] text-slate-300 leading-relaxed">
                ℹ️ ข้อมูลผู้ประสานงานและรายละเอียดอาหารจะไม่แสดงในปฏิทินสาธารณะตามระเบียบรักษาความปลอดภัยข้อมูลส่วนบุคคล
              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 font-bold text-xs text-white touch-target transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
