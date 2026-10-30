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
  const [isLoading, setIsLoading] = useState(false);
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
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          title: "คำขอจองใหม่",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "approved":
        return {
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
          title: "อนุมัติแล้ว",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
          title: "ไม่อนุมัติ",
          bg: "bg-rose-50 text-rose-800 border-rose-200",
        };
      case "cancelled":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-gray-600" />,
          title: "ยกเลิกแล้ว",
          bg: "bg-gray-100 text-gray-700 border-gray-200",
        };
      default:
        return {
          icon: <Bell className="w-3.5 h-3.5 text-purple-600" />,
          title: "การแจ้งเตือน",
          bg: "bg-purple-50 text-purple-800 border-purple-200",
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
        className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-[#e6e2ea] text-[#595963] hover:text-[#582c83] hover:border-[#582c83] hover:bg-[#faf8fd] transition-colors touch-target focus:outline-hidden focus:ring-2 focus:ring-[#582c83]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#e6e2ea] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#faf8fd] border-b border-[#e6e2ea]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#1e1e24]">การแจ้งเตือน</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => handleMarkAsRead("all", e)}
                className="inline-flex items-center gap-1 text-xs text-[#582c83] hover:text-[#432066] font-medium py-1 px-2 rounded-lg hover:bg-white transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#8e8e99] space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-30 text-[#582c83]" />
                <p className="text-xs">ไม่มีรายการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((item) => {
                const badge = getEventBadge(item.event_type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 sm:p-4 cursor-pointer transition-colors flex items-start gap-3 hover:bg-[#fcfbfe] ${
                      item.is_read === 0 ? "bg-[#faf8fd]" : "bg-white"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{badge.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${badge.bg}`}
                        >
                          {badge.title}
                        </span>
                        <span className="text-[11px] text-[#8e8e99]">
                          {formatRelativeThaiTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#1e1e24] truncate">
                        {item.activity_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#595963]">
                        <span className="font-mono font-medium text-[#582c83]">
                          {item.booking_code}
                        </span>
                        <span>•</span>
                        <span>
                          {item.room_id === "floor2" ? "หอประชุมชั้น 2" : "ห้องประชุมชั้น 7"}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="mt-1 text-[11px] text-rose-700 bg-rose-50/70 p-1 rounded">
                          เหตุผล: {item.reason}
                        </p>
                      )}
                    </div>
                    {item.is_read === 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#582c83] shrink-0 mt-2" />
                    )}
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
