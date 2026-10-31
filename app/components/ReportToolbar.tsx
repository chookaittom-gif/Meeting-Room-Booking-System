"use client";

import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

interface Props {
  monthKey: string;
  monthOptions: { key: string; label: string }[];
}

export default function ReportToolbar({ monthKey, monthOptions }: Props) {
  const router = useRouter();

  return (
    <div className="no-print flex flex-wrap items-center gap-2 mb-6">
      <a
        href="/admin"
        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#e4e2ea] bg-white hover:bg-[#f5f0fa] text-xs font-semibold text-[#52525b] transition-colors touch-target"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        ย้อนกลับ
      </a>
      <select
        value={monthKey}
        onChange={(e) => router.push(`/admin/report?month=${e.target.value}`)}
        aria-label="เลือกเดือนที่ต้องการรายงาน"
        className="px-3 py-2.5 rounded-xl border border-[#e4e2ea] bg-white text-xs font-semibold text-[#1e1e24] focus:outline-none focus:ring-2 focus:ring-[#582c83] touch-target"
      >
        {monthOptions.map((opt) => {
          const [y, m] = opt.key.split("-").map(Number);
          return (
            <option key={opt.key} value={opt.key}>
              {THAI_MONTHS[m - 1]} {y + 543}
            </option>
          );
        })}
      </select>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#582c83] hover:bg-[#48236b] shadow-[0_2px_8px_rgba(88,44,131,0.22)] transition-colors touch-target"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
        พิมพ์ / บันทึก PDF
      </button>
    </div>
  );
}
