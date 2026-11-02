"use client";

import React, { useMemo, useState } from "react";
import type { MonthlyStat, RoomStat, TopItemStat } from "@/lib/stats";

const PURPLE = "#582c83";
const PURPLE_LIGHT = "#9a6fc0";
const AMBER = "#f59e0b";
const EMERALD = "#10b981";
const EMERALD_LIGHT = "#34d399";
const ROSE = "#e11d48";
const GRAY = "#9ca3af";

/* ── Monthly Trend: stacked bars (bookings) or single bars (hours) ── */

interface MonthlyTrendProps {
  monthly: MonthlyStat[];
  mode: "bookings" | "hours";
}

export function MonthlyTrendChart({ monthly, mode }: MonthlyTrendProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 720;
  const H = 260;
  const PAD_L = 34;
  const PAD_B = 30;
  const PAD_T = 14;
  const plotW = W - PAD_L - 8;
  const plotH = H - PAD_B - PAD_T;

  const values = useMemo(
    () =>
      monthly.map((m) =>
        mode === "hours" ? m.hours_approved : m.counts.approved + m.counts.pending + m.counts.rejected + m.counts.cancelled
      ),
    [monthly, mode]
  );
  const rawMax = Math.max(...values, mode === "hours" ? 1 : 0);
  const step = rawMax > 40 ? 10 : rawMax > 16 ? 5 : rawMax > 6 ? 2 : 1;
  const yMax = Math.max(step, Math.ceil(rawMax / step) * step);
  const barSlot = plotW / monthly.length;
  const barW = Math.min(38, barSlot * 0.56);
  const yOf = (v: number) => PAD_T + plotH - (v / yMax) * plotH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD_T + plotH * f,
    label: Math.round(yMax * (1 - f)),
  }));

  const hovered = hoverIdx != null ? monthly[hoverIdx] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="กราฟแนวโน้มการจองรายเดือน">
        {/* gridlines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - 8} y1={g.y} y2={g.y} stroke="#e8e4ee" strokeWidth="1" />
            <text x={PAD_L - 6} y={g.y + 3.5} textAnchor="end" fontSize="10" fill="#8e8e99">
              {g.label}
            </text>
          </g>
        ))}

        {monthly.map((m, i) => {
          const cx = PAD_L + barSlot * i + barSlot / 2;
          const x = cx - barW / 2;
          const isHover = hoverIdx === i;
          if (mode === "hours") {
            const v = m.hours_approved;
            const y = yOf(v);
            const h = PAD_T + plotH - y;
            return (
              <g key={m.month} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
                <rect x={x} y={y} width={barW} height={Math.max(h, v > 0 ? 3 : 0)} rx="5" fill={EMERALD} opacity={isHover ? 1 : 0.88} />
                {!isHover && v > 0 && (
                  <rect x={x} y={y} width={barW} height={Math.min(10, Math.max(h, 0))} rx="5" fill={EMERALD_LIGHT} opacity="0.55" />
                )}
                <MonthLabel cx={cx} y={H - 8} month={m.label_th} idx={i} total={monthly.length} />
              </g>
            );
          }
          // stacked: approved (bottom), pending, rejected, cancelled (top)
          const segs = [
            { v: m.counts.approved, fill: EMERALD },
            { v: m.counts.pending, fill: AMBER },
            { v: m.counts.rejected, fill: ROSE },
            { v: m.counts.cancelled, fill: GRAY },
          ];
          let acc = 0;
          const bands = segs
            .filter((s) => s.v > 0)
            .map((s) => {
              const band = {
                key: s.fill,
                fill: s.fill,
                y: yOf(acc + s.v),
                h: Math.max((s.v / yMax) * plotH, 2),
              };
              acc += s.v;
              return band;
            });
          return (
            <g key={m.month} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
              {bands.map((b) => (
                <rect key={b.key} x={x} y={b.y} width={barW} height={b.h} rx="2" fill={b.fill} opacity={isHover ? 1 : 0.9} />
              ))}
              {bands.length === 0 && <circle cx={cx} cy={PAD_T + plotH - 2} r="2.5" fill="#d4cfe0" />}
              <MonthLabel cx={cx} y={H - 8} month={m.label_th} idx={i} total={monthly.length} />
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full rounded-2xl bg-[#1e1e24] text-white text-xs px-3 py-2 shadow-xl whitespace-nowrap"
          style={{
            left: `${((PAD_L + barSlot * hoverIdx! + barSlot / 2) / W) * 100}%`,
            top: `${(yOf(values[hoverIdx!]) / H) * 100 - 2}%`,
          }}
        >
          <p className="font-bold mb-1">{hovered.label_th}</p>
          {mode === "hours" ? (
            <p>ใช้งาน {hovered.hours_approved.toLocaleString("th-TH")} ชม. (อนุมัติ)</p>
          ) : (
            <div className="space-y-0.5">
              <p className="text-emerald-300">อนุมัติ {hovered.counts.approved}</p>
              <p className="text-amber-300">รออนุมัติ {hovered.counts.pending}</p>
              <p className="text-rose-300">ไม่อนุมัติ {hovered.counts.rejected}</p>
              <p className="text-gray-300">ยกเลิก {hovered.counts.cancelled}</p>
              <p className="font-bold border-t border-white/20 mt-1 pt-1">รวม {hovered.total}</p>
            </div>
          )}
        </div>
      )}

      {/* legend */}
      {mode === "bookings" ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center mt-1 text-xs text-[#595963]">
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: EMERALD }} />อนุมัติ</span>
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: AMBER }} />รออนุมัติ</span>
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: ROSE }} />ไม่อนุมัติ</span>
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full" style={{ background: GRAY }} />ยกเลิก</span>
        </div>
      ) : (
        <p className="text-center text-xs text-[#8e8e99] mt-1">ชั่วโมงการใช้งานสะสมของคำขอที่อนุมัติแล้ว</p>
      )}
    </div>
  );
}

function MonthLabel({ cx, y, month, idx, total }: { cx: number; y: number; month: string; idx: number; total: number }) {
  const skip = total > 8 ? (idx % 2 === 1 ? true : false) : false;
  if (skip) return null;
  return (
    <text x={cx} y={y} textAnchor="middle" fontSize="10" fill="#595963" fontWeight={600}>
      {month}
    </text>
  );
}

/* ── Status Donut ── */

interface DonutProps {
  summary: { pending: number; approved: number; rejected: number; cancelled: number };
}

export function StatusDonut({ summary }: DonutProps) {
  const total = summary.pending + summary.approved + summary.rejected + summary.cancelled;
  const R = 54;
  const C = 2 * Math.PI * R;
  const segs = [
    { label: "อนุมัติ", v: summary.approved, color: EMERALD },
    { label: "รออนุมัติ", v: summary.pending, color: AMBER },
    { label: "ไม่อนุมัติ", v: summary.rejected, color: ROSE },
    { label: "ยกเลิก", v: summary.cancelled, color: GRAY },
  ].filter((s) => s.v > 0);

  let offset = 0;
  return (
    <div className="flex items-center justify-center gap-5 flex-wrap sm:flex-nowrap">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0" role="img" aria-label="สัดส่วนสถานะคำขอจอง">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#efecf4" strokeWidth="18" />
        {segs.length === 0 && <circle cx="70" cy="70" r={R} fill="none" stroke="#efecf4" strokeWidth="18" />}
        {segs.map((s) => {
          const len = (s.v / total) * C;
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="800" fill="#1e1e24">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#8e8e99">
          คำขอทั้งหมด
        </text>
      </svg>
      <div className="space-y-1.5 text-xs min-w-28">
        {segs.length === 0 && <p className="text-[#8e8e99]">ยังไม่มีข้อมูล</p>}
        {segs.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[#595963]">
              <i className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-bold text-[#1e1e24]">
              {s.v} <span className="text-xs font-medium text-[#8e8e99]">({Math.round((s.v / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Room split horizontal bars ── */

export function RoomBars({ rooms }: { rooms: RoomStat[] }) {
  const max = Math.max(...rooms.map((r) => r.count), 1);
  const totalHours = rooms.reduce((s, r) => s + r.hours_approved, 0);
  if (rooms.length === 0) return <p className="text-xs text-[#8e8e99] py-4 text-center">ยังไม่มีข้อมูล</p>;
  return (
    <div className="space-y-4">
      {rooms.map((r, i) => (
        <div key={r.room_id}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-[#1e1e24]">{r.room_name}</span>
            <span className="text-[#595963]">
              {r.count} ครั้ง · {r.hours_approved.toLocaleString("th-TH")} ชม.
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#efecf4] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${(r.count / max) * 100}%`,
                background: i === 0 ? `linear-gradient(90deg, ${PURPLE}, #7a45b0)` : PURPLE_LIGHT,
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-[#8e8e99]">รวมชั่วโมงที่อนุมัติ {totalHours.toLocaleString("th-TH")} ชม. ในรอบ 12 เดือน</p>
    </div>
  );
}

/* ── Popular slots ── */

export function SlotBars({ slots }: { slots: { morning: number; afternoon: number } }) {
  const total = slots.morning + slots.afternoon;
  const max = Math.max(slots.morning, slots.afternoon, 1);
  const rows = [
    { label: "เช้า (เริ่มก่อน 12:00)", v: slots.morning, fill: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
    { label: "บ่าย (เริ่มตั้งแต่ 12:00)", v: slots.afternoon, fill: `linear-gradient(90deg, ${PURPLE}, #7a45b0)` },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-[#1e1e24]">{r.label}</span>
            <span className="text-[#595963]">
              {r.v} ครั้ง{total > 0 && <> · {Math.round((r.v / total) * 100)}%</>}
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#efecf4] overflow-hidden">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(r.v / max) * 100}%`, background: r.fill }} />
          </div>
        </div>
      ))}
      <p className="text-xs text-[#8e8e99]">นับจากคำขอที่อนุมัติแล้วและรออนุมัติในรอบ 12 เดือน</p>
    </div>
  );
}

/* ── Top catering items ── */

export function TopItemsBars({ items }: { items: TopItemStat[] }) {
  if (items.length === 0) return <p className="text-xs text-[#8e8e99] py-4 text-center">ยังไม่มีรายการอาหาร</p>;
  const max = Math.max(...items.map((i) => i.quantity), 1);
  return (
    <div className="space-y-3.5">
      {items.map((it, i) => (
        <div key={it.name}>
          <div className="flex items-center justify-between text-xs mb-1 gap-2">
            <span className="font-semibold text-[#1e1e24] truncate">{it.name}</span>
            <span className="text-[#595963] shrink-0">{it.quantity.toLocaleString("th-TH")} ชุด</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#efecf4] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${(it.quantity / max) * 100}%`,
                background: i === 0 ? "linear-gradient(90deg, #7a45b0, #582c83)" : PURPLE_LIGHT,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
