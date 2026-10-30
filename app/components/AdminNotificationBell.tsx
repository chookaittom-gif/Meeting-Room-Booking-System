"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CheckCheck,
  Loader2,
  Calendar,
} from "lucide-react";

interface NotificationItem {
  id: string;
  booking_id: string;
  event_type: "pending" | "approved" | "rejected" | "cancelled";
  is_read: number;
  created_at: number;
  booking_code: string;
  activity_name: string;
  room_id: string;
  starts_at: number;
  ends_at: number;
  current_booking_status: string;
  reason?: string;
  changed_by?: string;
}

interface AdminNotificationBellProps {
  onSelectBooking?: (bookingCode: string) => void;
}

function formatRelativeThaiTime(epochSec: number): string {
  const diffSec = Math.floor(Date.now() / 1000) - epochSec;
  if (diffSec < 60) return "เมื่อสักครู่";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "เมื่อวานนี้";
  return `${days} วันที่แล้ว`;
}

export function AdminNotificationBell({ onSelectBooking }: AdminNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as any;
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (id === "all" || n.id === id ? { ...n, is_read: 1 } : n))
        );
        if (id === "all") {
          setUnreadCount(0);
        } else {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      }
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.is_read === 0) {
      handleMarkAsRead(item.id);
    }
    if (onSelectBooking) {
      onSelectBooking(item.booking_code);
    }
    setIsOpen(false);
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "pending":
        return {
          icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
          title: "คำขอจองใหม่",
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        };
      case "approved":
        return {
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
          title: "อนุมัติแล้ว",
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          title: "ไม่อนุมัติ",
          bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        };
      case "cancelled":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />,
          title: "ยกเลิกแล้ว",
          bg: "bg-slate-700/40 text-slate-300 border-slate-600/40",
        };
      default:
        return {
          icon: <Bell className="w-3.5 h-3.5 text-violet-400" />,
          title: "การแจ้งเตือน",
          bg: "bg-violet-500/20 text-violet-300 border-violet-500/40",
        };
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button (min 44x44px touch target) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="การแจ้งเตือน"
        className="relative inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-violet-500/40 hover:bg-white/10 transition-all touch-target focus:outline-hidden focus:ring-2 focus:ring-violet-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-[#16112a] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">การแจ้งเตือน HUD</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => handleMarkAsRead("all", e)}
                className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-white font-bold py-1 px-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/10">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-30 text-violet-400" />
                <p className="text-xs">ไม่มีรายการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((item) => {
                const badge = getEventBadge(item.event_type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3 ${
                      item.is_read === 0 ? "bg-violet-950/20" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{badge.icon}</div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          {badge.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatRelativeThaiTime(item.created_at)}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-white truncate">{item.activity_name}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="font-mono text-violet-300">{item.booking_code}</span>
                        {item.is_read === 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="text-[10px] text-violet-400 hover:text-violet-300 underline"
                          >
                            ทำเครื่องหมายอ่านแล้ว
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
