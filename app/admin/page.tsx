"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingStatus, TableLayout, MeetingType } from "@/lib/types";
import { AdminNotificationBell } from "@/app/components/AdminNotificationBell";
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
  Activity,
  Layers,
} from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string; dot: string; pulse: boolean }> = {
  pending: { label: "รอการอนุมัติ", bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/40", dot: "bg-amber-400", pulse: true },
  approved: { label: "อนุมัติแล้ว", bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400", pulse: false },
  rejected: { label: "ไม่อนุมัติ", bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/40", dot: "bg-rose-400", pulse: false },
  cancelled: { label: "ยกเลิก", bg: "bg-slate-700/40", text: "text-slate-400", border: "border-slate-600/40", dot: "bg-slate-400", pulse: false },
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

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/me");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        const data = (await res.json()) as any;
        setAdminUser(data.admin);
      } catch {
        router.push("/admin/login");
      }
    }
    checkAuth();
  }, [router]);

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
          router.push("/admin/login");
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
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expected_current_status: expectedCurrentStatus,
          new_status: newStatus,
          reason,
        }),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาดในการปรับสถานะ");
        return;
      }

      // Reload
      setRejectingBooking(null);
      setRejectReason("");
      await loadBookings();
    } catch {
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
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
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Admin Header */}
      <div className="bg-[#16112a]/90 backdrop-blur-3xl rounded-3xl border border-white/10 p-5 sm:p-7 shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-[#582c83] text-white flex items-center justify-center font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-violet-400/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              แผงควบคุม Cyber Command (Admin)
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              เข้าสู่ระบบโดย: <strong className="text-violet-300">{adminUser.displayName}</strong> ({adminUser.username})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AdminNotificationBell
            onSelectBooking={(code) => {
              setSearchQuery(code);
              setStatusFilter("all");
              setRoomFilter("all");
            }}
          />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold touch-target transition-all hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Stats Counter Bar (Telemetry HUD) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: "all", label: "ทั้งหมด", count: stats.all, color: "text-violet-300", dot: "bg-violet-400", pulse: false },
          { id: "pending", label: "รอการอนุมัติ", count: stats.pending, color: "text-amber-300", dot: "bg-amber-400", pulse: true },
          { id: "approved", label: "อนุมัติแล้ว", count: stats.approved, color: "text-emerald-300", dot: "bg-emerald-400", pulse: false },
          { id: "rejected", label: "ไม่อนุมัติ", count: stats.rejected, color: "text-rose-300", dot: "bg-rose-400", pulse: false },
          { id: "cancelled", label: "ยกเลิก", count: stats.cancelled, color: "text-slate-400", dot: "bg-slate-400", pulse: false },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === st.id
                ? "bg-violet-950/50 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.35)] ring-2 ring-violet-500/50"
                : "bg-[#16112a]/80 backdrop-blur-2xl border-white/10 hover:border-violet-500/40 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 block">{st.label}</span>
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
      <div className="bg-[#16112a]/90 backdrop-blur-3xl rounded-3xl border border-white/10 p-4 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกิจกรรม, โครงการ, ผู้ประสานงาน หรือรหัสจอง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs touch-target shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-[#582c83] text-white font-bold touch-target hover:from-violet-500 hover:to-violet-700 shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-400/30 transition-all shrink-0"
          >
            ค้นหา
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="font-bold text-slate-300 shrink-0">ห้อง:</span>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-[#140f26] text-white text-xs touch-target focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
          >
            <option value="all">ทุกห้อง</option>
            <option value="floor2">หอประชุมชั้น 2</option>
            <option value="floor7">ห้องประชุมชั้น 7</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          <p className="text-sm text-slate-300 mt-3 font-medium">กำลังโหลดข้อมูลรายการจอง...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#16112a]/80 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 text-center text-sm text-slate-400 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          ไม่พบรายการจองตามเงื่อนไขที่เลือก
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const cfg = STATUS_CONFIG[b.status as BookingStatus];

            return (
              <div
                key={b.id}
                className="bg-[#16112a]/85 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 sm:p-7 shadow-[0_8px_35px_rgba(0,0,0,0.5)] hover:border-violet-500/40 hover:shadow-[0_0_35px_rgba(139,92,246,0.18)] transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} shadow-inner`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="text-xs font-bold text-violet-300 bg-violet-950/60 border border-violet-500/30 px-2.5 py-1 rounded-xl">
                      {b.room_name}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                      {b.booking_code}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    ยื่นคำขอเมื่อ: {formatThaiDate(b.created_at)}
                  </div>
                </div>

                {/* Main info row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-white">{b.activity_name}</h3>
                    <p className="text-xs text-slate-300 font-medium">โครงการ: {b.project_name}</p>
                    <div className="text-xs text-slate-300 font-medium flex flex-wrap items-center gap-3 pt-1">
                      <span className="flex items-center gap-1.5 text-violet-300">
                        <Clock className="w-3.5 h-3.5 text-violet-400" />
                        {formatThaiDate(b.starts_at)} ({formatThaiTime(b.starts_at)} – {formatThaiTime(b.ends_at)})
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>ผู้เข้าร่วม: <strong className="text-white">{b.attendees_count}</strong> คน (เจ้าหน้าที่ {b.staff_count} คน)</span>
                      <span className="text-slate-600">•</span>
                      <span>ผังโต๊ะ: <strong className="text-white">{b.table_layout}</strong></span>
                    </div>
                  </div>

                  {/* Coordinator & Price */}
                  <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-1.5 text-xs">
                    <span className="font-bold text-violet-300 block">ผู้ประสานงาน:</span>
                    <p className="font-bold text-white">{b.coordinator_name}</p>
                    <p className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-violet-400" />
                      <a href={`tel:${b.coordinator_phone}`} className="hover:underline text-violet-300 font-medium">
                        {b.coordinator_phone}
                      </a>
                    </p>
                    {b.coordinator_line_id && (
                      <p className="flex items-center gap-1 text-slate-300">
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        LINE: {b.coordinator_line_id}
                      </p>
                    )}
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center font-bold">
                      <span className="text-slate-400">ยอดรวม (VAT):</span>
                      <span className="text-amber-300 text-sm font-extrabold">{b.total_price_thb?.toLocaleString()} บาท</span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setSelectedBookingDetails(b)}
                    className="text-xs font-bold text-violet-300 hover:text-white flex items-center gap-1.5 touch-target transition-colors"
                  >
                    <Utensils className="w-3.5 h-3.5 text-violet-400" />
                    ดูรายการอาหาร/ของว่าง ({b.items?.length || 0} รายการ) และประวัติ
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    {b.status === "pending" && (
                      <>
                        <button
                          disabled={isProcessingAction}
                          onClick={() => handleUpdateStatus(b.id, "pending", "approved")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold touch-target shadow-[0_0_15px_rgba(16,185,129,0.35)] disabled:opacity-50 transition-all active:scale-95"
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
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold touch-target shadow-[0_0_15px_rgba(244,63,94,0.35)] disabled:opacity-50 transition-all active:scale-95"
                        >
                          <XCircle className="w-4 h-4" />
                          ไม่อนุมัติ
                        </button>
                        <button
                          disabled={isProcessingAction}
                          onClick={() => {
                            if (confirm("ยืนยันการยกเลิกคำขอนี้หรือไม่?")) {
                              handleUpdateStatus(b.id, "pending", "cancelled", "ยกเลิกคำขอ");
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-bold touch-target transition-all"
                        >
                          ยกเลิก
                        </button>
                      </>
                    )}

                    {b.status === "approved" && (
                      <button
                        disabled={isProcessingAction}
                        onClick={() => {
                          if (confirm("ยืนยันการยกเลิกรายการที่อนุมัติแล้วหรือไม่? ช่วงเวลาจะถูกคืนสู่ระบบ")) {
                            handleUpdateStatus(b.id, "approved", "cancelled", "ผู้ดูแลยกเลิกหลังการอนุมัติ");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold touch-target transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#16112a] rounded-3xl max-w-md w-full border border-white/15 shadow-[0_20px_70px_rgba(0,0,0,0.9)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-extrabold text-base text-rose-400 flex items-center gap-1.5">
                <XCircle className="w-5 h-5 text-rose-400" />
                ระบุเหตุผลที่ไม่อนุมัติคำขอ
              </h3>
              <button
                onClick={() => setRejectingBooking(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 font-medium">
              คำขอ: <strong className="text-white">{rejectingBooking.activity_name}</strong> ({rejectingBooking.booking_code})
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                เหตุผลการไม่อนุมัติ <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="เช่น ห้องปิดปรับปรุงระบบไฟฟ้าในวันดังกล่าว หรือ ขัดต่อระเบียบการใช้สถานที่"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs touch-target shadow-inner"
              />
              <p className="text-[11px] text-slate-400">เหตุผลนี้จะถูกบันทึกในประวัติของระบบ</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 touch-target"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isProcessingAction}
                onClick={() => handleUpdateStatus(rejectingBooking.id, "pending", "rejected", rejectReason.trim())}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold touch-target shadow-[0_0_15px_rgba(244,63,94,0.4)] disabled:opacity-50"
              >
                {isProcessingAction ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & Items Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#16112a] rounded-3xl max-w-lg w-full border border-white/15 shadow-[0_20px_70px_rgba(0,0,0,0.9)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-extrabold text-base text-white">รายละเอียดรายการจอง</h3>
                <span className="font-mono text-xs text-violet-300 font-bold">{selectedBookingDetails.booking_code}</span>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Food items */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-violet-300">รายการอาหารและเครื่องดื่ม</h4>
              {!selectedBookingDetails.items || selectedBookingDetails.items.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-white/5 rounded-2xl border border-white/5">ไม่มีรายการอาหารและเครื่องดื่ม</p>
              ) : (
                <div className="border border-white/10 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-violet-200 font-bold border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-3">รายการ</th>
                        <th className="py-2.5 px-3 text-center">จำนวน</th>
                        <th className="py-2.5 px-3 text-right">รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {selectedBookingDetails.items.map((it: any) => (
                        <tr key={it.id} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-medium text-white">{it.item_name}</td>
                          <td className="py-2.5 px-3 text-center text-slate-300">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-200">{it.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-white/5 border-t border-white/10 font-bold">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right text-slate-300">ยอดรวม (VAT):</td>
                        <td className="py-2.5 px-3 text-right text-amber-300 font-extrabold">{selectedBookingDetails.total_price_thb?.toLocaleString()} บาท</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Status History */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h4 className="font-bold text-xs text-violet-300">ประวัติการเปลี่ยนสถานะ</h4>
              <div className="space-y-2">
                {selectedBookingDetails.history?.map((h: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">
                        {h.from_status ? `${h.from_status} → ` : ""}{h.to_status}
                      </span>
                      <span className="text-slate-400 text-[11px]">{formatThaiDate(h.changed_at)} {formatThaiTime(h.changed_at)}</span>
                    </div>
                    {h.reason && <p className="text-slate-300 text-[11px]">เหตุผล: {h.reason}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="px-5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white hover:bg-white/15 touch-target transition-all"
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
