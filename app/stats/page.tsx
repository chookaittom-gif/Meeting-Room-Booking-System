"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Users,
  BadgeCheck,
  BarChart3,
  Loader2,
  ArrowLeft,
  UtensilsCrossed,
  Clock3,
  DoorOpen,
  PieChart,
  FileText,
} from "lucide-react";
import type { BookingStats } from "@/lib/stats";
import { MonthlyTrendChart, StatusDonut, RoomBars, SlotBars, TopItemsBars } from "../components/StatsCharts";

type TrendMode = "bookings" | "hours";

export default function StatsPage() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendMode, setTrendMode] = useState<TrendMode>("bookings");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats?months=12");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { success: boolean; stats: BookingStats };
        if (!cancelled) setStats(data.stats);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดสถิติได้ กรุณาลองใหม่ภายหลัง");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = stats && stats.monthly.some((m) => m.total > 0);

  return (
    <main className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-[#582c83] to-[#48236b] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(88,44,131,0.25)] border border-white/20 shrink-0">
            <BarChart3 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-[#582c83] tracking-tight">สถิติการจองห้องประชุม</h1>
            <p className="text-xs sm:text-sm text-[#595963]">ข้อมูลรวม 12 เดือนล่าสุด (ไม่แสดงข้อมูลส่วนบุคคล)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white bg-[#582c83] hover:bg-[#48236b] shadow-[0_2px_8px_rgba(88,44,131,0.22)] transition-colors touch-target"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            รายงานประจำเดือน
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-[#582c83] bg-white border border-[#e6e2ea] hover:bg-[#faf8fd] transition-colors touch-target"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            หน้าหลัก
          </Link>
        </div>
      </div>

      {loading && <StatsSkeleton />}

      {!loading && error && (
        <div role="alert" className="bg-red-50/90 border border-red-200 rounded-3xl p-5 text-sm text-red-800 flex items-start gap-2.5">
          <PieChart className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          {error}
        </div>
      )}

      {!loading && !error && stats && !hasData && (
        <div className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_16px_48px_rgba(88,44,131,0.06)] p-10 text-center space-y-3">
          <BarChart3 className="w-10 h-10 mx-auto text-[#582c83] opacity-30" aria-hidden="true" />
          <p className="font-bold text-[#1e1e24]">ยังไม่มีข้อมูลการจองในช่วง 12 เดือนนี้</p>
          <p className="text-xs text-[#8e8e99]">เมื่อมีคำขอจองเข้ามา สถิติจะแสดงในหน้านี้โดยอัตโนมัติ</p>
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-1.5 mt-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-[#582c83] hover:bg-[#48236b] transition-colors touch-target"
          >
            <CalendarCheck className="w-4 h-4" aria-hidden="true" />
            เริ่มจองห้องประชุม
          </Link>
        </div>
      )}

      {!loading && !error && stats && hasData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard
              icon={<CalendarCheck className="w-5 h-5" aria-hidden="true" />}
              label="จองเดือนนี้"
              value={stats.kpi.this_month_total.toLocaleString("th-TH")}
              sub="คำขอทั้งหมด"
            />
            <KpiCard
              icon={
                stats.kpi.mom_change_pct == null ? (
                  <TrendingUp className="w-5 h-5" aria-hidden="true" />
                ) : stats.kpi.mom_change_pct >= 0 ? (
                  <TrendingUp className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-5 h-5" aria-hidden="true" />
                )
              }
              label="เทียบเดือนก่อน"
              value={stats.kpi.mom_change_pct == null ? "—" : `${stats.kpi.mom_change_pct > 0 ? "+" : ""}${stats.kpi.mom_change_pct}%`}
              sub={`เดือนก่อน ${stats.kpi.prev_month_total} คำขอ`}
              tone={stats.kpi.mom_change_pct == null ? "neutral" : stats.kpi.mom_change_pct >= 0 ? "up" : "down"}
            />
            <KpiCard
              icon={<Users className="w-5 h-5" aria-hidden="true" />}
              label="ผู้เข้าร่วมเฉลี่ย"
              value={stats.kpi.avg_attendees_this_month != null ? stats.kpi.avg_attendees_this_month.toLocaleString("th-TH") : "—"}
              sub="คน / งาน (เดือนนี้)"
            />
            <KpiCard
              icon={<BadgeCheck className="w-5 h-5" aria-hidden="true" />}
              label="อัตราอนุมัติ"
              value={`${stats.kpi.approval_rate_12m}%`}
              sub="ในรอบ 12 เดือน"
            />
          </div>

          {/* Main trend chart */}
          <section
            aria-labelledby="trend-heading"
            className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-7 shadow-[0_16px_48px_rgba(88,44,131,0.06)]"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-[#582c83]" aria-hidden="true" />
                <h2 id="trend-heading" className="font-extrabold text-sm sm:text-base text-[#1e1e24]">
                  แนวโน้มการจองรายเดือน
                </h2>
              </div>
              <div className="inline-flex rounded-xl bg-[#f3f0f8] p-1" role="tablist" aria-label="โหมดกราฟ">
                {(
                  [
                    { id: "bookings", label: "จำนวนจอง" },
                    { id: "hours", label: "ชั่วโมงใช้งาน" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={trendMode === t.id}
                    onClick={() => setTrendMode(t.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors touch-target ${
                      trendMode === t.id ? "bg-white text-[#582c83] shadow-sm" : "text-[#8e8e99] hover:text-[#582c83]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <MonthlyTrendChart monthly={stats.monthly} mode={trendMode} />
          </section>

          {/* Secondary charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            <section
              aria-labelledby="rooms-heading"
              className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-7 shadow-[0_16px_48px_rgba(88,44,131,0.06)]"
            >
              <div className="flex items-center gap-2 mb-5">
                <DoorOpen className="w-4.5 h-4.5 text-[#582c83]" aria-hidden="true" />
                <h2 id="rooms-heading" className="font-extrabold text-sm sm:text-base text-[#1e1e24]">
                  การใช้งานแยกตามห้อง
                </h2>
              </div>
              <RoomBars rooms={stats.rooms} />
            </section>

            <section
              aria-labelledby="status-heading"
              className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-7 shadow-[0_16px_48px_rgba(88,44,131,0.06)]"
            >
              <div className="flex items-center gap-2 mb-5">
                <PieChart className="w-4.5 h-4.5 text-[#582c83]" aria-hidden="true" />
                <h2 id="status-heading" className="font-extrabold text-sm sm:text-base text-[#1e1e24]">
                  สถานะคำขอจอง (12 เดือน)
                </h2>
              </div>
              <StatusDonut summary={stats.status_summary} />
            </section>

            <section
              aria-labelledby="slots-heading"
              className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-7 shadow-[0_16px_48px_rgba(88,44,131,0.06)]"
            >
              <div className="flex items-center gap-2 mb-5">
                <Clock3 className="w-4.5 h-4.5 text-[#582c83]" aria-hidden="true" />
                <h2 id="slots-heading" className="font-extrabold text-sm sm:text-base text-[#1e1e24]">
                  ช่วงเวลายอดนิยม
                </h2>
              </div>
              <SlotBars slots={stats.popular_slots} />
            </section>

            <section
              aria-labelledby="items-heading"
              className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-5 sm:p-7 shadow-[0_16px_48px_rgba(88,44,131,0.06)]"
            >
              <div className="flex items-center gap-2 mb-5">
                <UtensilsCrossed className="w-4.5 h-4.5 text-[#582c83]" aria-hidden="true" />
                <h2 id="items-heading" className="font-extrabold text-sm sm:text-base text-[#1e1e24]">
                  เมนูจัดเลี้ยงยอดนิยม
                </h2>
              </div>
              <TopItemsBars items={stats.top_items} />
            </section>
          </div>

          <p className="text-center text-xs text-[#8e8e99]">
            อัปเดตล่าสุด: {new Date(stats.generated_at * 1000).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })} ·
            ข้อมูลรวมเพื่อการแสดงผลสาธารณะ ไม่มีข้อมูลส่วนบุคคลของผู้ประสานงาน
          </p>
        </>
      )}
    </main>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "up" | "down";
}) {
  return (
    <div className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-4 sm:p-5 shadow-[0_16px_48px_rgba(88,44,131,0.06)]">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            tone === "up" ? "bg-emerald-100 text-emerald-700" : tone === "down" ? "bg-rose-100 text-rose-700" : "bg-[#f3f0f8] text-[#582c83]"
          }`}
        >
          {icon}
        </span>
        <span className="text-xs sm:text-xs font-semibold text-[#595963] leading-tight">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-[#1e1e24] leading-tight">{value}</p>
      <p className="text-xs sm:text-xs text-[#8e8e99] mt-0.5">{sub}</p>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="กำลังโหลดสถิติ">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white/88 rounded-3xl border border-white/80 p-5 h-28" />
        ))}
      </div>
      <div className="bg-white/88 rounded-3xl border border-white/80 p-7 h-80" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white/88 rounded-3xl border border-white/80 p-7 h-56" />
        ))}
      </div>
    </div>
  );
}
