import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import {
  getMonthlyReport,
  reportCurrentMonth,
  thaiMonthYearFull,
  lastMonthKeys,
} from "@/lib/monthly-report";
import ReportToolbar from "../../components/ReportToolbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายงานสรุปการใช้บริการห้องประชุมประจำเดือน",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ month?: string }>;
}

const THAI_ABBR_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default async function MonthlyReportPage({ searchParams }: Props) {
  const sessionCookie = (await cookies()).get("admin_session")?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;
  if (!session) redirect("/admin/login");

  const db = await getD1Database();
  if (!db) {
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12">
        <p className="text-center text-[#52525b]">ระบบฐานข้อมูลไม่พร้อมใช้งาน</p>
      </main>
    );
  }

  const params = await searchParams;
  const current = reportCurrentMonth();
  const monthKey = /^\d{4}-\d{2}$/.test(params.month || "") ? params.month! : current;
  const report = await getMonthlyReport(db, monthKey);

  const [gy, gm] = monthKey.split("-").map(Number);
  const monthOptions = lastMonthKeys(current, 12).map((key) => ({ key, label: key }));
  const nowIct = new Date(Date.now() + 7 * 3600 * 1000);
  const printedAt = `${String(nowIct.getUTCDate()).padStart(2, "0")} ${THAI_ABBR_MONTHS[nowIct.getUTCMonth()]} ${nowIct.getUTCFullYear() + 543} เวลา ${String(nowIct.getUTCHours()).padStart(2, "0")}:${String(nowIct.getUTCMinutes()).padStart(2, "0")} น.`;

  return (
    <main className="report-page flex-1 w-full max-w-4xl mx-auto px-4 py-6">
      <style>{`
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .report-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
        }
      `}</style>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap"
      />

      <ReportToolbar monthKey={monthKey} monthOptions={monthOptions} />

      <div
        className="report-sheet bg-white mx-auto p-10 shadow-[0_2px_16px_rgba(88,44,131,0.10)] border border-[#e4e2ea]"
        style={{
          fontFamily: "'TH Sarabun New','TH SarabunPSK','TH Sarabun',Sarabun,sans-serif",
          fontSize: "16pt",
          lineHeight: 1.45,
          color: "#000",
          maxWidth: "210mm",
        }}
      >
        {/* หัวรายงาน */}
        <header className="text-center mb-5">
          <p style={{ fontSize: "15pt" }}>มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง</p>
          <h1 className="font-bold" style={{ fontSize: "20pt", margin: "2px 0" }}>
            รายงานสรุปการใช้บริการห้องประชุม
          </h1>
          <p className="font-bold" style={{ fontSize: "18pt" }}>
            ประจำเดือน {thaiMonthYearFull(monthKey)}
          </p>
          <p style={{ fontSize: "14pt", marginTop: "4px" }}>
            ข้อมูล ณ วันที่ {printedAt} | หน่วยงานที่รับผิดชอบข้อมูล: งานอาคารสถานที่และกายภาพ ศูนย์การศึกษาลำปาง
          </p>
        </header>

        {/* 1. สรุปภาพรวม */}
        <section className="mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            1. สรุปภาพรวมการให้บริการ
          </h2>
          <ul style={{ paddingLeft: "1.6em", listStyle: "disc" }}>
            <li>จำนวนวันเปิดให้บริการในเดือนนี้ (วันทำการ): {report.operational_days} วัน</li>
            <li>
              จำนวนห้องประชุมทั้งหมดที่อยู่ในการดูแล: {report.total_rooms} ห้อง
              (หอประชุมชั้น 2 จำนวน 1 ห้อง และห้องประชุมชั้น 7 จำนวน 1 ห้อง)
            </li>
            <li>จำนวนการจองและเข้าใช้งานรวม (อนุมัติ): {fmt(report.total_bookings)} ครั้ง</li>
            <li>จำนวนชั่วโมงการใช้งานรวมทั้งหมด: {fmt(report.total_hours)} ชั่วโมง</li>
            <li>
              อัตราการครองใช้ห้องประชุมเฉลี่ย: {fmt(report.overall_utilization_pct)}%
              <span style={{ fontSize: "13pt", color: "#444" }}>
                {" "}
                (คำนวณจากชั่วโมงให้บริการ {report.operational_days} วัน × 8 ชม./วัน × {report.total_rooms} ห้อง)
              </span>
            </li>
          </ul>
        </section>

        {/* 2. ตารางรายห้อง */}
        <section className="mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            2. ตารางสถิติการใช้งานห้องประชุม
          </h2>
          <table
            className="w-full"
            style={{ borderCollapse: "collapse", fontSize: "15pt", marginTop: "4px" }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0eaf6" }}>
                <th style={tdStyle}>ชื่อห้องประชุม</th>
                <th style={tdStyle}>จำนวนครั้งที่ใช้งาน (ครั้ง)</th>
                <th style={tdStyle}>ชั่วโมงรวม (ชม.)</th>
                <th style={tdStyle}>อัตราการใช้งาน (%)</th>
                <th style={tdStyle}>โครงการที่จองหลัก</th>
              </tr>
            </thead>
            <tbody>
              {report.rooms.map((r) => (
                <tr key={r.room_id}>
                  <td style={tdStyle}>{r.room_name}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{fmt(r.count)}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{fmt(r.hours)}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{fmt(r.utilization_pct)}</td>
                  <td style={tdStyle}>{r.top_project || "–"}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "#faf7fd", fontWeight: "bold" }}>
                <td style={tdStyle}>รวมทั้งสิ้น</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{fmt(report.total_bookings)}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{fmt(report.total_hours)}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{fmt(report.overall_utilization_pct)}</td>
                <td style={tdStyle}>–</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. จำแนกตามประเภทการใช้งาน */}
        <section className="mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            3. จำแนกสถิติตามประเภทการใช้งาน
          </h2>
          {report.purposes.length === 0 ? (
            <p>ไม่มีการใช้งานในเดือนนี้</p>
          ) : (
            <ul style={{ paddingLeft: "1.6em", listStyle: "disc" }}>
              {report.purposes.map((p) => (
                <li key={p.meeting_type}>
                  {p.label_th}: {fmt(p.count)} ครั้ง ({fmt(p.pct)}%)
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. การยกเลิก */}
        <section className="mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            4. รายงานสถิติการยกเลิกการจอง
          </h2>
          <ul style={{ paddingLeft: "1.6em", listStyle: "disc" }}>
            <li>จำนวนการยกเลิกการจอง: {fmt(report.cancelled_count)} ครั้ง</li>
          </ul>
        </section>

        {/* 5. การยืนยันจากระบบ */}
        <section>
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            5. ข้อมูลการยืนยันจากระบบ
          </h2>
          <p>
            จัดทำโดย: ระบบจองห้องประชุมอัตโนมัติ มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
        </section>
      </div>
    </main>
  );
}

const tdStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "2px 8px",
  verticalAlign: "top",
};
