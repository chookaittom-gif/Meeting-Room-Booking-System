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
  Volume2,
  VolumeX,
} from "lucide-react";

const SOUND_PREF_KEY = "notif-sound-enabled";

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const newestSeenIdRef = useRef<string | null>(null);
  const firstLoadDoneRef = useRef(false);

  // Load sound preference once on mount
  useEffect(() => {
    try {
      const pref = localStorage.getItem(SOUND_PREF_KEY);
      if (pref === "off") setSoundEnabled(false);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_PREF_KEY, next ? "on" : "off");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  const playNotifySound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio("/sounds/notify.wav");
      audio.volume = 0.6;
      audio.play().catch(() => {
        /* autoplay blocked until first user gesture — ignore */
      });
    } catch {
      /* audio unsupported */
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as any;
      if (data.success) {
        const items: NotificationItem[] = data.notifications || [];
        const newest = items[0]?.id ?? null;
        const unread = data.unread_count || 0;
        // Play sound when genuinely new notifications arrive (skip the very first load)
        if (
          firstLoadDoneRef.current &&
          newest &&
          newest !== newestSeenIdRef.current &&
          unread > 0
        ) {
          playNotifySound();
        }
        newestSeenIdRef.current = newest;
        firstLoadDoneRef.current = true;
        setNotifications(items);
        setUnreadCount(unread);
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
        className="relative inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-[#e6e2ea] text-[#595963] hover:text-[#582c83] hover:border-[#582c83] hover:bg-[#faf8fd] shadow-2xs transition-colors touch-target focus:outline-hidden focus:ring-2 focus:ring-[#582c83]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white border border-[#e6e2ea] shadow-[0_20px_50px_rgba(88,44,131,0.12)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
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
            <div className="flex items-center gap-1">
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
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
                title={soundEnabled ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                  soundEnabled ? "text-[#582c83] hover:bg-white" : "text-[#b9b4c4] hover:bg-white"
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
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
                    className={`p-3.5 hover:bg-[#faf8fd] transition-colors cursor-pointer flex items-start gap-3 ${
                      item.is_read === 0 ? "bg-[#fcfaff]" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{badge.icon}</div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                          {badge.title}
                        </span>
                        <span className="text-xs text-[#8e8e99] font-mono">
                          {formatRelativeThaiTime(item.created_at)}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#1e1e24] truncate">{item.activity_name}</p>
                      <div className="flex items-center justify-between text-xs text-[#595963]">
                        <span className="font-mono text-[#582c83] font-semibold">{item.booking_code}</span>
                        {item.is_read === 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="text-xs text-[#582c83] hover:underline"
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
