"use client";

import React, { useState, useEffect } from "react";
import { PublicCalendarEvent, BookingStatus } from "@/lib/types";
import { Calendar as CalendarIcon, List, Filter, ChevronLeft, ChevronRight, X, Clock, MapPin, Tag, Loader2 } from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: "รอการอนุมัติ", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  approved: { label: "อนุมัติแล้ว", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
  rejected: { label: "ไม่อนุมัติ", bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300" },
  cancelled: { label: "ยกเลิก", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
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
      <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 p-5 sm:p-7 shadow-[0_12px_40px_rgba(88,44,131,0.06)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e1e24] flex items-center gap-2 tracking-tight">
              <CalendarIcon className="w-5 h-5 text-[#582c83]" />
              ตารางการใช้ห้องประชุม
            </h2>
            <p className="text-xs sm:text-sm text-[#595963] mt-0.5">
              ตรวจสอบช่วงเวลาว่างและการจัดกิจกรรม (ไม่แสดงข้อมูลส่วนบุคคลของผู้ประสานงาน)
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#582c83]/10 p-1 rounded-2xl self-start sm:self-auto border border-[#582c83]/15">
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
                viewMode === "month"
                  ? "bg-gradient-to-r from-[#582c83] to-[#48236b] text-white shadow-xs"
                  : "text-[#582c83] hover:bg-white/80"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              ปฏิทินรายเดือน
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-[#582c83] to-[#48236b] text-white shadow-xs"
                  : "text-[#582c83] hover:bg-white/80"
              }`}
            >
              <List className="w-4 h-4" />
              รายการจอง
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#582c83]/10 text-xs">
          <span className="font-semibold text-[#1e1e24] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#582c83]" />
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
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors touch-target ${
                roomFilter === rf.id
                  ? "bg-[#582c83] text-white font-bold"
                  : "bg-gray-100 text-[#595963] hover:bg-gray-200"
              }`}
            >
              {rf.label}
            </button>
          ))}

          <span className="font-semibold text-[#1e1e24] ml-2 flex items-center gap-1">
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
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors touch-target ${
                statusFilter === sf.id
                  ? "bg-[#582c83] text-white font-bold"
                  : "bg-gray-100 text-[#595963] hover:bg-gray-200"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#e6e2ea]">
          <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
          <p className="text-sm text-[#595963] mt-3">กำลังโหลดข้อมูลปฏิทิน...</p>
        </div>
      ) : viewMode === "month" ? (
        /* =================== MONTH VIEW =================== */
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden shadow-[0_12px_40px_rgba(88,44,131,0.06)]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#582c83]/10 bg-[#582c83]/5">
            <h3 className="font-bold text-base sm:text-lg text-[#1e1e24]">{thaiMonthName}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                aria-label="เดือนก่อนหน้า"
                className="p-2 rounded-lg border border-[#e6e2ea] bg-white hover:bg-gray-50 text-[#1e1e24] touch-target"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="เดือนถัดไป"
                className="p-2 rounded-lg border border-[#e6e2ea] bg-white hover:bg-gray-50 text-[#1e1e24] touch-target"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-[#e6e2ea] text-center text-xs font-bold text-[#595963] bg-gray-50">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
              <div key={i} className={`py-2.5 ${i === 0 ? "text-red-500" : ""}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#e6e2ea]">
            {/* Empty offset days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] bg-gray-50/30 p-1.5" />
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
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 flex flex-col transition-colors hover:bg-gray-50/80 ${
                    isToday ? "bg-[#f5f0fa]/40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? "bg-[#582c83] text-white" : "text-[#1e1e24]"
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
                          className={`w-full text-left p-1 rounded-md border text-[11px] leading-tight block truncate font-medium transition-transform active:scale-95 ${cfg.bg} ${cfg.text} ${cfg.border}`}
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
        <div className="bg-white rounded-2xl border border-[#e6e2ea] overflow-hidden shadow-xs">
          {events.length === 0 ? (
            <div className="p-12 text-center text-[#595963] text-sm">
              ไม่พบรายการจองห้องประชุมตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="divide-y divide-[#e6e2ea]">
              {events.map((ev) => {
                const cfg = STATUS_CONFIG[ev.status];
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs font-semibold text-[#582c83] bg-[#f5f0fa] px-2 py-0.5 rounded-md">
                          {ev.room_name}
                        </span>
                        <span className="text-xs font-mono text-[#595963]">{ev.booking_code}</span>
                      </div>
                      <h4 className="font-bold text-base text-[#1e1e24]">{ev.activity_name}</h4>
                      <p className="text-xs text-[#595963] flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#582c83]" />
                          {formatThaiDate(ev.starts_at)} ({formatThaiTime(ev.starts_at)} – {formatThaiTime(ev.ends_at)})
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#e6e2ea] text-xs font-medium text-[#1e1e24] hover:bg-gray-100 touch-target shrink-0"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e6e2ea] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-[#e6e2ea] flex items-center justify-between">
              <h3 className="font-bold text-base text-[#1e1e24]">รายละเอียดการจองห้องประชุม</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                aria-label="ปิด"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#595963]">รหัสอ้างอิง:</span>
                <span className="font-mono font-bold text-sm text-[#582c83] bg-[#f5f0fa] px-2.5 py-1 rounded-md">
                  {selectedEvent.booking_code}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#595963]">ชื่อกิจกรรม:</span>
                <h4 className="font-bold text-base text-[#1e1e24]">{selectedEvent.activity_name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e6e2ea]">
                <div className="space-y-1">
                  <span className="text-xs text-[#595963] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#582c83]" />
                    สถานที่
                  </span>
                  <p className="font-semibold text-xs text-[#1e1e24]">{selectedEvent.room_name}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#595963] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#582c83]" />
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

              <div className="space-y-1 pt-2 border-t border-[#e6e2ea]">
                <span className="text-xs text-[#595963] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#582c83]" />
                  วันและเวลา
                </span>
                <p className="font-semibold text-xs text-[#1e1e24]">
                  วันที่ {formatThaiDate(selectedEvent.starts_at)}
                </p>
                <p className="text-xs text-[#595963]">
                  เวลา {formatThaiTime(selectedEvent.starts_at)} – {formatThaiTime(selectedEvent.ends_at)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-[#71717a] leading-relaxed">
                ℹ️ ข้อมูลผู้ประสานงานและรายละเอียดอาหารจะไม่แสดงในปฏิทินสาธารณะตามระเบียบรักษาความปลอดภัยข้อมูลส่วนบุคคล
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-[#e6e2ea] flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-white border border-[#e6e2ea] hover:bg-gray-100 font-medium text-xs text-[#1e1e24] touch-target"
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
