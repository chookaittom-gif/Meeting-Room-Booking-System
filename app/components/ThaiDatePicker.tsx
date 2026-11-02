"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { formatThaiDateString } from "@/lib/date-utils";

interface ThaiDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDaysAhead?: number; // default: 30
}

const THAI_MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_DAY_HEADERS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ThaiDatePicker({
  value,
  onChange,
  minDate,
  maxDaysAhead = 30,
}: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view month & year based on value or today
  const initialDate = value ? parseLocalDate(value) : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Today and min/max constraints
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const min = minDate ? parseLocalDate(minDate) : today;
  min.setHours(0, 0, 0, 0);

  const max = new Date(today);
  max.setDate(max.getDate() + maxDaysAhead);
  max.setHours(23, 59, 59, 999);

  // Synchronize view when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseLocalDate(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside and Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  // Calendar math
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days: { day: number; dateStr: string; disabled: boolean; isSelected: boolean; isToday: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(viewYear, viewMonth, d);
    cur.setHours(0, 0, 0, 0);
    const dateStr = formatToYMD(cur);
    const disabled = cur < min || cur > max;
    const isSelected = value === dateStr;
    const isToday = cur.getTime() === today.getTime();
    days.push({ day: d, dateStr, disabled, isSelected, isToday });
  }

  // Quick action dates
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatToYMD(tomorrow);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button Box */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-2.5 rounded-xl border text-left bg-white flex items-center justify-between text-sm touch-target transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#582c83] ${
          isOpen ? "border-[#582c83] ring-2 ring-[#582c83]/20" : "border-[#e6e2ea] hover:border-[#582c83]/50"
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? "font-semibold text-[#1e1e24]" : "text-[#a1a1aa]"}>
          {value ? formatThaiDateString(value) : "เลือกวันที่ต้องการจอง"}
        </span>
        <Calendar className="w-4 h-4 text-[#582c83] shrink-0" />
      </button>

      {/* Selected Date Badge */}
      {value && (
        <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f0fa] border border-[#582c83]/20 text-[#582c83] text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>วันที่เลือก: {formatThaiDateString(value)}</span>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Calendar Popover / Modal */}
      {isOpen && (
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:translate-y-0 sm:inset-auto sm:absolute sm:left-0 sm:top-full sm:mt-2 z-50 w-auto sm:w-[320px] bg-white rounded-2xl border border-[#e6e2ea] shadow-[0_20px_48px_rgba(88,44,131,0.16)] p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-[#f0ebf5]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#595963] hover:text-[#582c83] hover:bg-[#f5f0fa] active:scale-95 transition-[transform,colors]"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold text-[#1e1e24]">
              {THAI_MONTH_NAMES[viewMonth]} {viewYear + 543}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#595963] hover:text-[#582c83] hover:bg-[#f5f0fa] active:scale-95 transition-[transform,colors]"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {THAI_DAY_HEADERS.map((dayName, idx) => (
              <span
                key={dayName}
                className={`text-xs font-bold py-1 ${
                  idx === 0 ? "text-rose-600" : idx === 6 ? "text-amber-700" : "text-[#595963]"
                }`}
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before month day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />
            ))}

            {/* Month Day Cells */}
            {days.map((item) => (
              <button
                key={item.dateStr}
                type="button"
                disabled={item.disabled}
                onClick={() => handleSelectDate(item.dateStr)}
                className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition-colors ${
                  item.isSelected
                    ? "bg-[#582c83] text-white shadow-sm ring-2 ring-[#582c83]/30 scale-105"
                    : item.disabled
                    ? "text-gray-300 cursor-not-allowed line-through"
                    : "text-[#1e1e24] hover:bg-[#f5f0fa] hover:text-[#582c83] active:scale-90"
                } ${item.isToday && !item.isSelected ? "border border-[#582c83] text-[#582c83]" : ""}`}
              >
                {item.day}
              </button>
            ))}
          </div>

          {/* Quick Shortcuts: วันนี้ / พรุ่งนี้ */}
          <div className="pt-2 border-t border-[#f0ebf5] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleSelectDate(tomorrowStr)}
              className="text-xs font-bold text-[#582c83] hover:underline px-2 py-1 rounded-lg hover:bg-[#f5f0fa]"
            >
              ⚡ พรุ่งนี้ ({formatThaiDateString(tomorrowStr)})
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[#595963] hover:text-[#1e1e24] px-2 py-1"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
