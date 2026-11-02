"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingStatus, TableLayout, MeetingType } from "@/lib/types";
import { AdminNotificationBell } from "@/app/components/AdminNotificationBell";
import { TelegramSettingsCard } from "@/app/components/TelegramSettingsCard";
import { AdminUserManagementModal } from "@/app/components/AdminUserManagementModal";
import { useAlertDialog } from "@/app/components/AlertDialog";
import {
  ShieldCheck,
  LogOut,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Calendar,
  Utensils,
  ChevronDown,
  X,
  User,
  Sparkles,
  Users,
} from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string; dot: string; pulse: boolean }> = {
  pending: { label: "รอการอนุมัติ", bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-300", dot: "bg-amber-500", pulse: true },
  approved: { label: "อนุมัติแล้ว", bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-300", dot: "bg-emerald-500", pulse: false },
  rejected: { label: "ไม่อนุมัติ", bg: "bg-rose-50", text: "text-rose-900", border: "border-rose-300", dot: "bg-rose-500", pulse: false },
  cancelled: { label: "ยกเลิก", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", dot: "bg-gray-400", pulse: false },
};

function formatThaiDate(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const bangkok = new Date(d.getTime() + 7 * 3600 * 1000);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${bangkok.getUTCDate()} ${months[bangkok.getUTCMonth()]} ${bangkok.getUTCFullYear() + 543}`;
}

function formatThaiTime(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const bangkok = new Date(d.getTime() + 7 * 3600 * 1000);
  const h = String(bangkok.getUTCHours()).padStart(2, "0");
  const m = String(bangkok.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} น.`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [rejectingBooking, setRejectingBooking] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any>(null);
  const dialog = useAlertDialog();

  // LINE Notification settings state
  const [lineSettings, setLineSettings] = useState<{ enabled: boolean; groupId: string | null; configured: boolean }>({
    enabled: true,
    groupId: null,
    configured: false,
  });
  const [isTogglingLine, setIsTogglingLine] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingFeedback, setPingFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isSessionExpiredModalOpen, setIsSessionExpiredModalOpen] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.success && data.settings) {
          setLineSettings({
            enabled: data.settings.line_notify_enabled,
            groupId: data.settings.group_id,
            configured: data.settings.configured,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleToggleLine = async () => {
    setIsTogglingLine(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_notify_enabled: !lineSettings.enabled }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setLineSettings((prev) => ({ ...prev, enabled: data.line_notify_enabled }));
      }
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setIsTogglingLine(false);
    }
  };

  const handleTestPing = async () => {
    setIsTestingPing(true);
    setPingFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', { method: 'POST' });
      const data = (await res.json()) as any;
      if (data.success) {
        setPingFeedback({ type: 'success', text: data.message });
      } else {
        setPingFeedback({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการส่งข้อความทดสอบ' });
      }
    } catch (err: any) {
      setPingFeedback({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาดในการส่งข้อความ' });
    } finally {
      setIsTestingPing(false);
      setTimeout(() => setPingFeedback(null), 6000);
    }
  };

  // Check auth
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (!res.ok) {
        // Only show "session expired" on the login page if the user actually HAD a session
        // (avoids confusing first-time visitors with an expiry notice)
        const hadSession = typeof window !== "undefined" && sessionStorage.getItem("mrb_had_session") === "1";
        if (hadSession) {
          sessionStorage.removeItem("mrb_had_session");
          router.push("/admin/login?reason=expired");
        } else {
          router.push("/admin/login");
        }
        return;
      }
      const data = (await res.json()) as any;
      setAdminUser(data.admin);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("mrb_had_session", "1");
      }
      loadSettings();
    } catch {
      router.push("/admin/login");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Background 8-hour session expiry monitor
  useEffect(() => {
    if (!adminUser?.expiresAt) return;

    const verifySession = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec >= adminUser.expiresAt) {
        setIsSessionExpiredModalOpen(true);
      }
    };

    verifySession();
    const timer = setInterval(verifySession, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, [adminUser?.expiresAt]);

  // Load bookings
  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (roomFilter !== "all") params.append("room_id", roomFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login?reason=expired");
          return;
        }
        throw new Error("Failed to load");
      }

      const data = (await res.json()) as any;
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadBookings();
    }
  }, [adminUser, statusFilter, roomFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings();
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("mrb_had_session");
      }
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  const handleUpdateStatus = async (
    bookingId: string,
    expectedCurrentStatus: BookingStatus,
    newStatus: BookingStatus,
    reason?: string
  ) => {
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_status: expectedCurrentStatus,
          to_status: newStatus,
          reason,
        }),
      });

      // Parse body defensively — the server may return non-JSON on some failures
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        await dialog.alert({
          title: "ไม่สามารถปรับสถานะได้",
          message: `${data?.error || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"} (รหัส ${res.status})`,
          tone: "danger",
          confirmLabel: "รับทราบ",
          cancelLabel: "",
        });
        return;
      }

      // Reload
      setRejectingBooking(null);
      setRejectReason("");
      await loadBookings();
    } catch {
      await dialog.alert({
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง",
        tone: "danger",
        confirmLabel: "รับทราบ",
        cancelLabel: "",
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Stats calculation
  const stats = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  if (!adminUser) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Admin Header */}
      {/* Top Admin Header — relative z-50 keeps the notification dropdown above later backdrop-blur cards */}
      <div className="relative z-50 bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-7 shadow-[0_16px_48px_rgba(88,44,131,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-[#582c83] to-[#48236b] text-white flex items-center justify-center font-bold shadow-[0_4px_16px_rgba(88,44,131,0.25)] border border-white/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#1e1e24] tracking-tight">
              แผงควบคุมระบบ (Admin Dashboard)
            </h1>
              {adminUser.role === "superadmin" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#f5f0fa] text-[#582c83] border border-[#582c83]/20 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Superadmin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  ผู้ดูแลระบบ
                </span>
              )}
            </div>
            <p className="text-xs text-[#595963] font-medium">
              เข้าสู่ระบบโดย: <strong className="text-[#582c83]">{adminUser.displayName}</strong> ({adminUser.username})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {adminUser.role === "superadmin" && (
            <button
              type="button"
              onClick={() => setIsUserManagementOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#582c83]/20 bg-[#f5f0fa] hover:bg-[#ede5f7] text-[#582c83] text-xs font-bold touch-target transition-[transform,background-color] duration-150 shadow-2xs active:scale-95"
              title="จัดการผู้ดูแลระบบและรหัสผ่าน"
            >
              <Users className="w-3.5 h-3.5" />
              <span>จัดการผู้ดูแลระบบ</span>
            </button>
          )}
          <AdminNotificationBell
            onSelectBooking={(code) => {
              setSearchQuery(code);
              setStatusFilter("all");
              setRoomFilter("all");
            }}
          />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 text-xs font-bold touch-target transition-[transform,background-color] duration-150 shadow-2xs active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* LINE Notification Console */}
      <div className="card p-4 sm:p-5 bg-white border border-[#e4e2ea] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            lineSettings.enabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-[#18181b]">การแจ้งเตือน LINE Messaging API</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                lineSettings.enabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${lineSettings.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {lineSettings.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </span>
            </div>
            <p className="text-xs text-[#52525b] mt-0.5">
              แจ้งเตือนเข้ากลุ่ม {lineSettings.groupId ? `(${lineSettings.groupId})` : ''} เมื่อมีคำขอจองใหม่ และเมื่ออนุมัติห้อง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          {pingFeedback && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
              pingFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {pingFeedback.text}
            </span>
          )}

          <button
            type="button"
            onClick={handleTestPing}
            disabled={isTestingPing || !lineSettings.enabled}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e4e2ea] bg-white hover:bg-[#f8f8fc] text-xs font-bold text-[#18181b] touch-target disabled:opacity-40 transition-colors shadow-2xs"
          >
            {isTestingPing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            ทดสอบส่ง (Ping)
          </button>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={lineSettings.enabled}
            onClick={handleToggleLine}
            disabled={isTogglingLine}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#582c83] before:absolute before:-inset-2.5 before:rounded-full before:content-[''] ${
              lineSettings.enabled ? 'bg-[#059669]' : 'bg-gray-300'
            }`}
          >
            <span className="sr-only">เปิดปิดการแจ้งเตือน LINE</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                lineSettings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <TelegramSettingsCard />

      {/* Stats Counter Bar (Aurora Telemetry HUD) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: "all", label: "ทั้งหมด", count: stats.all, color: "text-[#582c83]", dot: "bg-[#582c83]", pulse: false },
          { id: "pending", label: "รอการอนุมัติ", count: stats.pending, color: "text-amber-600", dot: "bg-amber-500", pulse: true },
          { id: "approved", label: "อนุมัติแล้ว", count: stats.approved, color: "text-emerald-600", dot: "bg-emerald-500", pulse: false },
          { id: "rejected", label: "ไม่อนุมัติ", count: stats.rejected, color: "text-rose-600", dot: "bg-rose-500", pulse: false },
          { id: "cancelled", label: "ยกเลิก", count: stats.cancelled, color: "text-gray-600", dot: "bg-gray-400", pulse: false },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`p-4 rounded-2xl border text-left transition-colors ${
              statusFilter === st.id
                ? "bg-gradient-to-br from-white to-[#faf7fd] border-[#582c83] ring-2 ring-[#582c83]/30 shadow-md"
                : "bg-white/85 backdrop-blur-xl border-white/80 hover:border-[#582c83]/30 hover:bg-white shadow-[0_4px_20px_rgba(88,44,131,0.03)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#595963] block">{st.label}</span>
              {st.pulse ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              ) : (
                <span className={`inline-block w-2 h-2 rounded-full ${st.dot}`}></span>
              )}
            </div>
            <span className={`text-2xl sm:text-3xl font-black ${st.color} block mt-1 tracking-tight`}>
              {st.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-4 sm:p-5 shadow-[0_12px_40px_rgba(88,44,131,0.05)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8e8e99] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกิจกรรม, โครงการ, ผู้ประสานงาน หรือรหัสจอง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-xs touch-target shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] text-white font-bold touch-target hover:from-violet-700 hover:to-[#381a54] shadow-xs border border-white/20 transition-[background-color,box-shadow] duration-150 shrink-0"
          >
            ค้นหา
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="font-bold text-[#1e1e24] shrink-0">ห้อง:</span>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] text-xs touch-target focus:outline-none focus:ring-2 focus:ring-[#582c83] font-medium shadow-2xs"
          >
            <option value="all">ทุกห้อง</option>
            <option value="floor2">หอประชุมชั้น 2</option>
            <option value="floor7">ห้องประชุมชั้น 7</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white/90 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_12px_40px_rgba(88,44,131,0.06)]">
          <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
          <p className="text-sm text-[#595963] mt-3 font-semibold">กำลังโหลดข้อมูลรายการจอง...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white/88 backdrop-blur-xl rounded-3xl border border-white/80 p-12 text-center text-sm text-[#595963] shadow-[0_12px_40px_rgba(88,44,131,0.05)] font-medium">
          ไม่พบรายการจองตามเงื่อนไขที่เลือก
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const cfg = STATUS_CONFIG[b.status as BookingStatus];

            return (
              <div
                key={b.id}
                className="bg-white/88 backdrop-blur-xl rounded-3xl border border-white/80 p-6 sm:p-7 shadow-[0_10px_35px_rgba(88,44,131,0.05)] hover:border-[#582c83]/30 hover:shadow-[0_16px_45px_rgba(88,44,131,0.09)] transition-[border-color,box-shadow] duration-200 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e6e2ea]">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} shadow-2xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="text-xs font-bold text-[#582c83] bg-[#f5f0fa] border border-[#582c83]/15 px-2.5 py-1 rounded-xl">
                      {b.room_name}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#595963] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                      {b.booking_code}
                    </span>
                  </div>

                  <div className="text-xs text-[#595963] font-medium">
                    ยื่นคำขอเมื่อ: {formatThaiDate(b.created_at)}
                  </div>
                </div>

                {/* Main info row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-[#1e1e24]">{b.activity_name}</h3>
                    <p className="text-xs text-[#595963] font-medium">โครงการ: {b.project_name}</p>
                    <div className="text-xs text-[#1e1e24] font-medium flex flex-wrap items-center gap-3 pt-1">
                      <span className="flex items-center gap-1.5 text-[#582c83] font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#582c83]" />
                        {formatThaiDate(b.starts_at)} ({formatThaiTime(b.starts_at)} – {formatThaiTime(b.ends_at)})
                      </span>
                      <span className="text-gray-300">•</span>
                      <span>ผู้เข้าร่วม: <strong className="text-[#1e1e24]">{b.attendees_count}</strong> คน (เจ้าหน้าที่ {b.staff_count} คน)</span>
                      <span className="text-gray-300">•</span>
                      <span>ผังโต๊ะ: <strong className="text-[#1e1e24]">{b.table_layout}</strong></span>
                    </div>
                  </div>

                  {/* Coordinator & Price */}
                  <div className="bg-[#faf8fd] rounded-2xl p-3.5 border border-[#e6e2ea] space-y-1.5 text-xs">
                    <span className="font-bold text-[#582c83] block">ผู้ประสานงาน:</span>
                    <p className="font-bold text-[#1e1e24]">{b.coordinator_name}</p>
                    <p className="flex items-center gap-1 text-[#595963]">
                      <Phone className="w-3 h-3 text-[#582c83]" />
                      <a href={`tel:${b.coordinator_phone}`} className="hover:underline text-[#582c83] font-semibold">
                        {b.coordinator_phone}
                      </a>
                    </p>
                    {b.coordinator_line_id && (
                      <p className="flex items-center gap-1 text-[#595963]">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        LINE: {b.coordinator_line_id}
                      </p>
                    )}
                    <div className="pt-2 border-t border-[#e6e2ea] space-y-1">
                      {b.room_fee_thb ? (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#595963]">ค่าห้องจ่ายรายวัน:</span>
                            <span className="font-semibold text-[#1e1e24]">{b.room_fee_thb.toLocaleString()} บาท</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-amber-800 font-medium">เงินประกัน (50%):</span>
                            <span className="font-bold text-amber-700">{b.deposit_thb?.toLocaleString()} บาท</span>
                          </div>
                          {b.total_price_thb > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[#595963]">ค่าอาหาร/เครื่องดื่ม:</span>
                              <span className="font-semibold text-[#1e1e24]">{b.total_price_thb.toLocaleString()} บาท</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center font-bold pt-1 border-t border-dashed border-[#e6e2ea]">
                            <span className="text-[#1e1e24]">ยอดรวมทั้งสิ้น:</span>
                            <span className="text-[#582c83] text-sm font-black">{(b.room_fee_thb + (b.total_price_thb || 0)).toLocaleString()} บาท</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-[#595963]">ยอดรวม (VAT):</span>
                          <span className="text-[#582c83] text-sm font-black">{b.total_price_thb?.toLocaleString()} บาท</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e6e2ea]">
                  <button
                    onClick={() => setSelectedBookingDetails(b)}
                    className="text-xs font-bold text-[#582c83] hover:underline flex items-center gap-1.5 touch-target transition-colors"
                  >
                    <Utensils className="w-3.5 h-3.5 text-[#582c83]" />
                    ดูรายการอาหาร/ของว่าง ({b.items?.length || 0} รายการ) และประวัติ
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    {b.status === "pending" && (
                      <>
                        <button
                          disabled={isProcessingAction}
                          onClick={() => handleUpdateStatus(b.id, "pending", "approved")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold touch-target shadow-xs disabled:opacity-50 transition-[transform,background-color] duration-150 active:scale-95"
                        >
                          <CheckCircle className="w-4 h-4" />
                          อนุมัติ
                        </button>
                        <button
                          disabled={isProcessingAction}
                          onClick={() => {
                            setRejectingBooking(b);
                            setRejectReason("");
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold touch-target shadow-xs disabled:opacity-50 transition-[transform,background-color] duration-150 active:scale-95"
                        >
                          <XCircle className="w-4 h-4" />
                          ไม่อนุมัติ
                        </button>
                        <button
                          disabled={isProcessingAction}
                          onClick={async () => {
                            const ok = await dialog.confirm({
                              title: "ยืนยันการยกเลิกคำขอจอง",
                              message: "คำขอนี้จะถูกเปลี่ยนเป็นสถานะยกเลิก และไม่สามารถเปลี่ยนกลับได้",
                              tone: "danger",
                              confirmLabel: "ยืนยันยกเลิก",
                            });
                            if (ok) {
                              handleUpdateStatus(b.id, "pending", "cancelled", "ยกเลิกคำขอ");
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold touch-target transition-colors"
                        >
                          ยกเลิก
                        </button>
                      </>
                    )}

                    {b.status === "approved" && (
                      <button
                        disabled={isProcessingAction}
                        onClick={async () => {
                          const ok = await dialog.confirm({
                            title: "ยืนยันการยกเลิกรายการที่อนุมัติแล้ว",
                            message: "ช่วงเวลาจะถูกคืนสู่ระบบและผู้จองจะเห็นสถานะเปลี่ยนเป็นยกเลิก",
                            tone: "danger",
                            confirmLabel: "ยืนยันยกเลิก",
                          });
                          if (ok) {
                            handleUpdateStatus(b.id, "approved", "cancelled", "ผู้ดูแลยกเลิกหลังการอนุมัติ");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 bg-red-50/70 text-red-700 hover:bg-red-100 text-xs font-bold touch-target transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        ยกเลิกการจองนี้
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.18)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e6e2ea]">
              <h3 className="font-extrabold text-base text-rose-700 flex items-center gap-1.5">
                <XCircle className="w-5 h-5 text-rose-600" />
                ระบุเหตุผลที่ไม่อนุมัติคำขอ
              </h3>
              <button
                onClick={() => setRejectingBooking(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#595963] font-medium">
              คำขอ: <strong className="text-[#1e1e24]">{rejectingBooking.activity_name}</strong> ({rejectingBooking.booking_code})
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1e1e24]">
                เหตุผลการไม่อนุมัติ <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="เช่น ห้องปิดปรับปรุงระบบไฟฟ้าในวันดังกล่าว หรือ ขัดต่อระเบียบการใช้สถานที่"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs touch-target shadow-2xs"
              />
              <p className="text-xs text-gray-500">เหตุผลนี้จะถูกบันทึกในประวัติของระบบ</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl border border-[#e6e2ea] text-xs font-bold text-gray-700 hover:bg-gray-50 touch-target"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isProcessingAction}
                onClick={() => handleUpdateStatus(rejectingBooking.id, "pending", "rejected", rejectReason.trim())}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold touch-target shadow-xs disabled:opacity-50"
              >
                {isProcessingAction ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & Items Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.18)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e2ea]">
              <div>
                <h3 className="font-black text-base text-[#1e1e24]">รายละเอียดรายการจอง</h3>
                <span className="font-mono text-xs text-[#582c83] font-bold bg-[#f5f0fa] border border-[#582c83]/15 px-2.5 py-0.5 rounded-lg">{selectedBookingDetails.booking_code}</span>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            {selectedBookingDetails.room_fee_thb ? (
              <div className="p-3.5 bg-[#faf7fd] rounded-2xl border border-[#e6e2ea] space-y-2 text-xs">
                <h4 className="font-bold text-[#582c83]">สรุปยอดค่าบริการ</h4>
                <div className="flex justify-between items-center">
                  <span className="text-[#595963]">ค่าห้องจ่ายรายวัน:</span>
                  <span className="font-bold text-[#1e1e24]">{selectedBookingDetails.room_fee_thb.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800 font-medium">เงินประกันการจองห้อง (50%):</span>
                  <span className="font-bold text-amber-700">{selectedBookingDetails.deposit_thb?.toLocaleString()} บาท</span>
                </div>
                {selectedBookingDetails.total_price_thb > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#595963]">ค่าอาหารและเครื่องดื่ม:</span>
                    <span className="font-bold text-[#1e1e24]">{selectedBookingDetails.total_price_thb.toLocaleString()} บาท</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#e6e2ea] flex justify-between items-center text-sm font-black">
                  <span className="text-[#1e1e24]">ยอดรวมทั้งสิ้น (รวม VAT):</span>
                  <span className="text-[#582c83]">{(selectedBookingDetails.room_fee_thb + (selectedBookingDetails.total_price_thb || 0)).toLocaleString()} บาท</span>
                </div>
              </div>
            ) : null}

            {/* Food items */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#582c83]">รายการอาหารและเครื่องดื่ม</h4>
              {!selectedBookingDetails.items || selectedBookingDetails.items.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-2xl border border-gray-100">ไม่มีรายการอาหารและเครื่องดื่ม</p>
              ) : (
                <div className="border border-[#e6e2ea] rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#f5f0fa] text-[#582c83] font-bold border-b border-[#e6e2ea]">
                      <tr>
                        <th className="py-2.5 px-3">รายการ</th>
                        <th className="py-2.5 px-3 text-center">จำนวน</th>
                        <th className="py-2.5 px-3 text-right">รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e2ea]">
                      {selectedBookingDetails.items.map((it: any) => (
                        <tr key={it.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-medium text-[#1e1e24]">{it.item_name}</td>
                          <td className="py-2.5 px-3 text-center text-[#595963]">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#1e1e24]">{it.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#faf8fd] border-t border-[#e6e2ea] font-bold">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right text-gray-600">ยอดรวม (VAT):</td>
                        <td className="py-2.5 px-3 text-right text-[#582c83] font-black">{selectedBookingDetails.total_price_thb?.toLocaleString()} บาท</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Equipment & Notes */}
            {(() => {
              let eqItems: string[] = [];
              let eqOther = "";
              let eqNotes = "";
              if (selectedBookingDetails.equipment_needed) {
                try {
                  const parsed = typeof selectedBookingDetails.equipment_needed === "string"
                    ? JSON.parse(selectedBookingDetails.equipment_needed)
                    : selectedBookingDetails.equipment_needed;
                  if (Array.isArray(parsed.items)) eqItems = parsed.items;
                  if (parsed.other) eqOther = parsed.other;
                  if (parsed.notes) eqNotes = parsed.notes;
                } catch {
                  eqOther = String(selectedBookingDetails.equipment_needed);
                }
              }
              const hasEq = eqItems.length > 0 || eqOther || eqNotes;
              return (
                <div className="space-y-2 pt-2 border-t border-[#e6e2ea]">
                  <h4 className="font-bold text-xs text-[#582c83]">อุปกรณ์และหมายเหตุที่ต้องการ</h4>
                  {!hasEq ? (
                    <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      ไม่ได้ระบุอุปกรณ์หรือหมายเหตุเพิ่มเติม
                    </p>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1.5">
                      {eqItems.length > 0 && (
                        <div>
                          <span className="font-bold text-[#1e1e24]">อุปกรณ์: </span>
                          <span className="text-[#582c83] font-semibold">{eqItems.join(", ")}</span>
                        </div>
                      )}
                      {eqOther && (
                        <div>
                          <span className="font-bold text-[#1e1e24]">อุปกรณ์อื่นๆ: </span>
                          <span className="text-gray-700">{eqOther}</span>
                        </div>
                      )}
                      {eqNotes && (
                        <div>
                          <span className="font-bold text-[#1e1e24]">หมายเหตุเพิ่มเติม: </span>
                          <span className="text-gray-700">{eqNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Status History */}
            <div className="space-y-2 pt-2 border-t border-[#e6e2ea]">
              <h4 className="font-bold text-xs text-[#582c83]">ประวัติการเปลี่ยนสถานะ</h4>
              <div className="space-y-2">
                {selectedBookingDetails.history?.map((h: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-[#e6e2ea] text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#1e1e24]">
                        {h.from_status ? `${h.from_status} → ` : ""}{h.to_status}
                      </span>
                      <span className="text-gray-500 text-xs">{formatThaiDate(h.changed_at)} {formatThaiTime(h.changed_at)}</span>
                    </div>
                    {h.reason && <p className="text-gray-600 text-xs">เหตุผล: {h.reason}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="px-5 py-2 rounded-xl bg-white border border-[#e6e2ea] text-xs font-bold text-[#1e1e24] hover:bg-gray-50 touch-target transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Management Modal */}
      {adminUser.role === 'superadmin' && (
        <AdminUserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentAdmin={adminUser}
          onUserUpdated={checkAuth}
        />
      )}

      {/* ── 8-Hour Session Expired Alert Modal ──────────────────────────────── */}
      {isSessionExpiredModalOpen && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.3)] p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-lg text-[#1e1e24]">เซสชันหมดอายุ</h3>
              <p className="text-xs text-[#595963] leading-relaxed">
                ระยะเวลาการเข้าสู่ระบบของคุณครบกำหนด <strong>8 ชั่วโมง</strong> แล้ว เพื่อความปลอดภัยของข้อมูล กรุณาเข้าสู่ระบบใหม่อีกครั้ง
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/admin/login?reason=expired")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white text-xs font-bold touch-target shadow-2xs transition-[transform,background-color] duration-150 active:scale-95"
              >
                เข้าสู่ระบบใหม่
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog.element}
    </div>
  );
}