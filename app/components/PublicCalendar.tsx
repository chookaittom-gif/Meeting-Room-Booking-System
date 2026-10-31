"use client";

import React, { useState, useEffect } from "react";
import { PublicCalendarEvent, BookingStatus } from "@/lib/types";
import { Calendar as CalendarIcon, List, Filter, ChevronLeft, ChevronRight, X, Clock, MapPin, Tag, Loader2 } from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending: { label: "รอการอนุมัติ", bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-300", dot: "bg-amber-500" },
  approved: { label: "อนุมัติแล้ว", bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-300", dot: "bg-emerald-500" },
  rejected: { label: "ไม่อนุมัติ", bg: "bg-rose-50", text: "text-rose-900", border: "border-rose-300", dot: "bg-rose-500" },
  cancelled: { label: "ยกเลิก", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", dot: "bg-gray-400" },
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
      <div className="card p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#18181b] flex items-center gap-2.5 tracking-tight overflow-wrap-break-word min-w-0">
              <CalendarIcon className="w-5 h-5 text-[#582c83] shrink-0" aria-hidden="true" />
              ตารางการใช้ห้องประชุม
            </h2>
            <p className="text-xs sm:text-sm text-[#52525b] mt-1 font-medium">
              ตรวจสอบช่วงเวลาว่างและการจัดกิจกรรม (ไม่แสดงข้อมูลส่วนบุคคลของผู้ประสานงาน)
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#f5f0fa] p-1 rounded-xl self-start sm:self-auto border border-[#e4e2ea]">
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors touch-target ${
                viewMode === "month"
                  ? "bg-[#582c83] text-white shadow-sm"
                  : "text-[#582c83] hover:bg-white"
              }`}
            >
              <CalendarIcon className="w-4 h-4" aria-hidden="true" />
              ปฏิทินรายเดือน
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors touch-target ${
                viewMode === "list"
                  ? "bg-[#582c83] text-white shadow-sm"
                  : "text-[#582c83] hover:bg-white"
              }`}
            >
              <List className="w-4 h-4" aria-hidden="true" />
              รายการจอง
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#e4e2ea] text-xs">
          <span className="font-bold text-[#18181b] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#582c83]" aria-hidden="true" />
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors touch-target ${
                roomFilter === rf.id
                  ? "bg-[#582c83] text-white"
                  : "bg-[#f5f0fa] text-[#52525b] hover:bg-[#ede6f5]"
              }`}
            >
              {rf.label}
            </button>
          ))}

          <span className="font-bold text-[#18181b] ml-2">สถานะ:</span>
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors touch-target ${
                statusFilter === sf.id
                  ? "bg-[#582c83] text-white"
                  : "bg-[#f5f0fa] text-[#52525b] hover:bg-[#ede6f5]"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 card">
          <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" aria-hidden="true" />
          <p className="text-sm text-[#52525b] mt-3 font-semibold">กำลังโหลดข้อมูลปฏิทิน...</p>
        </div>
      ) : viewMode === "month" ? (
        /* =================== MONTH VIEW =================== */
        <div className="card overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e2ea] bg-[#faf9fd]">
            <h3 className="font-extrabold text-base sm:text-lg text-[#18181b]">
              {thaiMonthName}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                aria-label="เดือนก่อนหน้า"
                className="p-2 rounded-lg border border-[#e4e2ea] bg-white hover:bg-[#f5f0fa] text-[#18181b] transition-colors touch-target"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="เดือนถัดไป"
                className="p-2 rounded-lg border border-[#e4e2ea] bg-white hover:bg-[#f5f0fa] text-[#18181b] transition-colors touch-target"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-[#e4e2ea] text-center text-xs font-bold text-[#52525b] bg-[#f8f8fc]">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
              <div key={i} className={`py-2.5 ${i === 0 ? "text-rose-600" : ""}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#e4e2ea]">
            {/* Empty offset days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] bg-[#fafafa] p-1.5" />
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
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 flex flex-col transition-colors hover:bg-[#faf8fd] ${
                    isToday ? "bg-purple-50/60 ring-1 ring-inset ring-[#582c83]/25" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-[#582c83] text-white"
                          : "text-[#18181b]"
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>

                  {/* Day Events Badges */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                    {dayEvents.map((ev) => {
                      const cfg = STATUS_CONFIG[ev.status];
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left p-1 rounded-md border text-[11px] leading-tight block truncate font-medium transition-opacity hover:opacity-80 active:scale-95 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          title={`${ev.room_name} (${formatThaiTime(ev.starts_at)} - ${formatThaiTime(ev.ends_at)}): ${ev.activity_name}`}
                        >
                          <span className="font-bold text-[#582c83]">[{ev.room_id === "floor7" ? "ช.7" : "ช.2"}]</span>{" "}
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
        <div className="card overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center text-[#52525b] text-sm font-medium">
              ไม่พบรายการจองห้องประชุมตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="divide-y divide-[#e4e2ea]">
              {events.map((ev) => {
                const cfg = STATUS_CONFIG[ev.status];
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-4 sm:p-5 hover:bg-[#faf8fd] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs font-bold text-[#582c83] bg-[#f5f0fa] border border-[#582c83]/15 px-2.5 py-0.5 rounded-md">
                          {ev.room_name}
                        </span>
                        <span className="text-xs font-mono text-[#52525b]">{ev.booking_code}</span>
                      </div>
                      <h4 className="font-bold text-base text-[#18181b] overflow-wrap-break-word">{ev.activity_name}</h4>
                      <p className="text-xs text-[#52525b] flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#582c83] shrink-0" aria-hidden="true" />
                        {formatThaiDate(ev.starts_at)} · {formatThaiTime(ev.starts_at)} – {formatThaiTime(ev.ends_at)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(ev);
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-[#e4e2ea] bg-white hover:bg-[#f5f0fa] text-xs font-bold text-[#18181b] touch-target shrink-0 transition-colors"
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
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e4e2ea] shadow-[0_25px_60px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="p-5 border-b border-[#e4e2ea] flex items-center justify-between bg-[#faf8fd]">
              <h3 id="modal-title" className="font-extrabold text-base text-[#18181b]">รายละเอียดการจองห้องประชุม</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                aria-label="ปิด"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#52525b] hover:text-[#18181b] hover:bg-white touch-target transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#52525b] font-medium">รหัสอ้างอิง:</span>
                <span className="font-mono font-bold text-sm text-[#582c83] bg-[#f5f0fa] border border-[#582c83]/15 px-3 py-1 rounded-lg">
                  {selectedEvent.booking_code}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[#52525b] font-medium">ชื่อกิจกรรม:</span>
                <h4 className="font-bold text-base text-[#18181b]">{selectedEvent.activity_name}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e4e2ea]">
                <div className="space-y-1">
                  <span className="text-xs text-[#52525b] flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#582c83]" aria-hidden="true" />
                    สถานที่
                  </span>
                  <p className="font-bold text-xs text-[#18181b]">{selectedEvent.room_name}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#52525b] flex items-center gap-1 font-medium">
                    <Tag className="w-3.5 h-3.5 text-[#582c83]" aria-hidden="true" />
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

              <div className="space-y-1 pt-2 border-t border-[#e4e2ea]">
                <span className="text-xs text-[#52525b] flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#582c83]" aria-hidden="true" />
                  วันและเวลา
                </span>
                <p className="font-bold text-xs text-[#18181b]">
                  วันที่ {formatThaiDate(selectedEvent.starts_at)}
                </p>
                <p className="text-xs text-[#52525b] font-medium">
                  เวลา {formatThaiTime(selectedEvent.starts_at)} – {formatThaiTime(selectedEvent.ends_at)}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-[11px] text-blue-700 leading-relaxed">
                ข้อมูลผู้ประสานงานและรายละเอียดอาหารจะไม่แสดงในปฏิทินสาธารณะตามระเบียบรักษาความปลอดภัยข้อมูลส่วนบุคคล
              </div>
            </div>

            <div className="p-4 bg-[#f8f8fc] border-t border-[#e4e2ea] flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-white border border-[#e4e2ea] hover:bg-[#f5f0fa] font-bold text-xs text-[#18181b] touch-target transition-colors"
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
