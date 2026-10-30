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
} from "lucide-react";

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
        if (res.status === 401) router.push("/admin/login");
        return;
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
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // Status update action
  const handleUpdateStatus = async (
    bookingId: string,
    fromStatus: BookingStatus,
    toStatus: BookingStatus,
    reason?: string
  ) => {
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_status: fromStatus, to_status: toStatus, reason }),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        setIsProcessingAction(false);
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
        <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Admin Header */}
      <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 p-5 sm:p-7 shadow-[0_12px_40px_rgba(88,44,131,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#582c83] to-[#48236b] text-white flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1e1e24] tracking-tight">แดชบอร์ดผู้ดูแลระบบ (Admin)</h1>
            <p className="text-xs text-[#595963]">
              เข้าสู่ระบบโดย: <strong>{adminUser.displayName}</strong> ({adminUser.username})
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold touch-target transition-all hover:shadow-xs active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { id: "all", label: "ทั้งหมด", count: stats.all, color: "text-[#582c83]" },
          { id: "pending", label: "รอการอนุมัติ", count: stats.pending, color: "text-amber-600" },
          { id: "approved", label: "อนุมัติแล้ว", count: stats.approved, color: "text-emerald-600" },
          { id: "rejected", label: "ไม่อนุมัติ", count: stats.rejected, color: "text-rose-600" },
          { id: "cancelled", label: "ยกเลิก", count: stats.cancelled, color: "text-gray-600" },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === st.id
                ? "bg-white border-[#582c83] ring-2 ring-[#582c83]/40 shadow-sm"
                : "bg-white/80 backdrop-blur-md border-white/60 hover:bg-white hover:shadow-xs"
            }`}
          >
            <span className="text-xs font-semibold text-[#595963] block">{st.label}</span>
            <span className={`text-2xl font-black ${st.color} block mt-0.5`}>{st.count}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 p-4 sm:p-5 shadow-[0_12px_40px_rgba(88,44,131,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกิจกรรม, โครงการ, ผู้ประสานงาน หรือรหัสจอง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e6e2ea] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-xs touch-target"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#582c83] text-white font-medium touch-target hover:bg-[#48236b]"
          >
            ค้นหา
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="font-semibold text-[#1e1e24] shrink-0">ห้อง:</span>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#e6e2ea] bg-white text-xs touch-target focus:outline-none focus:ring-2 focus:ring-[#582c83]"
          >
            <option value="all">ทุกห้อง</option>
            <option value="floor2">หอประชุมชั้น 2</option>
            <option value="floor7">ห้องประชุมชั้น 7</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#e6e2ea]">
          <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
          <p className="text-sm text-[#595963] mt-3">กำลังโหลดข้อมูลรายการจอง...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e2ea] p-12 text-center text-sm text-[#595963]">
          ไม่พบรายการจองตามเงื่อนไขที่เลือก
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const cfg = STATUS_CONFIG[b.status as BookingStatus];

            return (
              <div
                key={b.id}
                className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(88,44,131,0.08)] transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e6e2ea]">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs font-semibold text-[#582c83] bg-[#f5f0fa] px-2.5 py-0.5 rounded-md">
                      {b.room_name}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#595963]">{b.booking_code}</span>
                  </div>

                  <div className="text-xs text-[#595963]">
                    ยื่นคำขอเมื่อ: {formatThaiDate(b.created_at)}
                  </div>
                </div>

                {/* Main info row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <h3 className="font-bold text-base text-[#1e1e24]">{b.activity_name}</h3>
                    <p className="text-xs text-[#595963]">โครงการ: {b.project_name}</p>
                    <div className="text-xs text-[#1e1e24] font-medium flex flex-wrap items-center gap-3 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#582c83]" />
                        {formatThaiDate(b.starts_at)} ({formatThaiTime(b.starts_at)} – {formatThaiTime(b.ends_at)})
                      </span>
                      <span>•</span>
                      <span>ผู้เข้าร่วม: {b.attendees_count} คน (เจ้าหน้าที่ {b.staff_count} คน)</span>
                      <span>•</span>
                      <span>ผังโต๊ะ: {b.table_layout}</span>
                    </div>
                  </div>

                  {/* Coordinator & Price */}
                  <div className="bg-[#fcfbfe] rounded-xl p-3 border border-[#e6e2ea] space-y-1 text-xs">
                    <span className="font-bold text-[#582c83] block">ผู้ประสานงาน:</span>
                    <p className="font-semibold text-[#1e1e24]">{b.coordinator_name}</p>
                    <p className="flex items-center gap-1 text-[#595963]">
                      <Phone className="w-3 h-3 text-[#582c83]" />
                      <a href={`tel:${b.coordinator_phone}`} className="hover:underline text-[#582c83] font-medium">
                        {b.coordinator_phone}
                      </a>
                    </p>
                    {b.coordinator_line_id && (
                      <p className="flex items-center gap-1 text-[#595963]">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        LINE: {b.coordinator_line_id}
                      </p>
                    )}
                    <div className="pt-2 border-t border-[#e6e2ea] flex justify-between items-center font-bold">
                      <span className="text-gray-600">ยอดรวม (VAT):</span>
                      <span className="text-[#582c83] text-sm">{b.total_price_thb?.toLocaleString()} บาท</span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e6e2ea]">
                  <button
                    onClick={() => setSelectedBookingDetails(b)}
                    className="text-xs font-semibold text-[#582c83] hover:underline flex items-center gap-1 touch-target"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    ดูรายการอาหาร/ของว่าง ({b.items?.length || 0} รายการ) และประวัติ
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    {b.status === "pending" && (
                      <>
                        <button
                          disabled={isProcessingAction}
                          onClick={() => handleUpdateStatus(b.id, "pending", "approved")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold touch-target shadow-xs disabled:opacity-50 transition-colors"
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
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold touch-target shadow-xs disabled:opacity-50 transition-colors"
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
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium touch-target transition-colors"
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold touch-target transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#e6e2ea] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e6e2ea]">
              <h3 className="font-bold text-base text-red-700 flex items-center gap-1.5">
                <XCircle className="w-5 h-5 text-red-600" />
                ระบุเหตุผลที่ไม่อนุมัติคำขอ
              </h3>
              <button
                onClick={() => setRejectingBooking(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#595963]">
              คำขอ: <strong className="text-[#1e1e24]">{rejectingBooking.activity_name}</strong> ({rejectingBooking.booking_code})
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1e1e24]">
                เหตุผลการไม่อนุมัติ <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="เช่น ห้องปิดปรับปรุงระบบไฟฟ้าในวันดังกล่าว หรือ ขัดต่อระเบียบการใช้สถานที่"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#e6e2ea] focus:outline-none focus:ring-2 focus:ring-red-500 text-xs touch-target"
              />
              <p className="text-[11px] text-gray-500">เหตุผลนี้จะถูกบันทึกในประวัติของระบบ</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl border border-[#e6e2ea] text-xs font-semibold text-[#1e1e24] hover:bg-gray-50 touch-target"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isProcessingAction}
                onClick={() => handleUpdateStatus(rejectingBooking.id, "pending", "rejected", rejectReason.trim())}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold touch-target shadow-xs disabled:opacity-50"
              >
                {isProcessingAction ? "กำลังบันทึก..." : "ยืนยันไม่อนุมัติ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details & Items Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#e6e2ea] shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e2ea]">
              <div>
                <h3 className="font-bold text-base text-[#1e1e24]">รายละเอียดรายการจอง</h3>
                <span className="font-mono text-xs text-[#582c83] font-bold">{selectedBookingDetails.booking_code}</span>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Food items */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#582c83]">รายการอาหารและเครื่องดื่ม</h4>
              {!selectedBookingDetails.items || selectedBookingDetails.items.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">ไม่มีรายการอาหารและเครื่องดื่ม</p>
              ) : (
                <div className="border border-[#e6e2ea] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#f5f0fa] text-[#582c83] font-bold">
                      <tr>
                        <th className="py-2 px-3">รายการ</th>
                        <th className="py-2 px-3 text-center">จำนวน</th>
                        <th className="py-2 px-3 text-right">รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e2ea]">
                      {selectedBookingDetails.items.map((it: any) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-medium">{it.item_name}</td>
                          <td className="py-2 px-3 text-center">{it.quantity}</td>
                          <td className="py-2 px-3 text-right font-semibold">{it.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#fcfbfe] border-t border-[#e6e2ea] font-bold">
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-right">ยอดรวม (VAT):</td>
                        <td className="py-2 px-3 text-right text-[#582c83]">{selectedBookingDetails.total_price_thb?.toLocaleString()} บาท</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Status History */}
            <div className="space-y-2 pt-2 border-t border-[#e6e2ea]">
              <h4 className="font-bold text-xs text-[#582c83]">ประวัติการเปลี่ยนสถานะ</h4>
              <div className="space-y-2">
                {selectedBookingDetails.history?.map((h: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-[#e6e2ea] text-xs space-y-0.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[#1e1e24]">
                        {h.from_status ? `${h.from_status} → ` : ""}{h.to_status}
                      </span>
                      <span className="text-gray-500 text-[11px]">{formatThaiDate(h.changed_at)} {formatThaiTime(h.changed_at)}</span>
                    </div>
                    {h.reason && <p className="text-gray-600 text-[11px]">เหตุผล: {h.reason}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="px-5 py-2 rounded-xl bg-white border border-[#e6e2ea] text-xs font-semibold text-[#1e1e24] hover:bg-gray-50 touch-target"
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
