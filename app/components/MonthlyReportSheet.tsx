import { thaiMonthYearFull } from "@/lib/monthly-report";
import type { MonthlyReport } from "@/lib/monthly-report";

interface Props {
  report: MonthlyReport;
  monthKey: string;
  printedAt: string;
}

const THAI_ABBR_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function fmtMoney(n: number): string {
  return (n || 0).toLocaleString();
}

export default function MonthlyReportSheet({ report, monthKey, printedAt }: Props) {
  return (
    <div className="w-full">
      <style>{`
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .report-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
          .report-section { break-inside: avoid; page-break-inside: avoid; }
        }
        .report-section { break-inside: avoid; page-break-inside: avoid; }
      `}</style>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap"
      />

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
        <header className="text-center mb-5 report-section">
          <p style={{ fontSize: "15pt" }}>มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง</p>
          <h1 className="font-bold" style={{ fontSize: "20pt", margin: "2px 0" }}>
            รายงานสรุปการใช้บริการห้องประชุม
          </h1>
          <p className="font-bold" style={{ fontSize: "18pt" }}>
            ประจำเดือน {thaiMonthYearFull(monthKey)}
          </p>
          <p style={{ fontSize: "14pt", marginTop: "4px" }}>
            ข้อมูล ณ วันที่ {printedAt} | หน่วยงานที่รับผิดชอบข้อมูล: งานอาคารสถานที่ ศูนย์การศึกษาลำปาง
          </p>
        </header>

        {/* 1. สรุปภาพรวม */}
        <section className="report-section mb-4">
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
        <section className="report-section mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            2. ตารางสถิติการใช้งานห้องประชุม
          </h2>
          <div className="overflow-x-auto"><table
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
          </table></div>
        </section>

        {/* 3. จำแนกตามประเภทการใช้งาน */}
        <section className="report-section mb-4">
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

        {/* 4. สรุปประมาณการรายรับและค่าใช้จ่าย */}
        <section className="report-section mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            4. สรุปประมาณการรายรับและค่าใช้จ่าย (คำขอที่อนุมัติ)
          </h2>
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "collapse", fontSize: "15pt", marginTop: "4px" }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f0eaf6" }}>
                  <th style={tdStyle}>รายการรายรับ/ค่าบริการ</th>
                  <th style={{ ...tdStyle, textAlign: "right", width: "170px" }}>จำนวนเงิน (บาท)</th>
                  <th style={tdStyle}>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>ค่าบำรุงสถานที่/ค่าห้องประชุม</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmtMoney(report.financial.room_fee_thb)}</td>
                  <td style={tdStyle}>คำนวณตามประเภทห้องและลักษณะการใช้งาน</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ค่าอาหารและเครื่องดื่ม</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmtMoney(report.financial.catering_fee_thb)}</td>
                  <td style={tdStyle}>รวมอาหารว่างและอาหารกลางวันทุกรายการ</td>
                </tr>
                <tr style={{ backgroundColor: "#faf7fd", fontWeight: "bold" }}>
                  <td style={tdStyle}>ยอดรวมทั้งสิ้น (รวม VAT)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmtMoney(report.financial.grand_total_thb)}</td>
                  <td style={tdStyle}>ยอดประมาณการรายรับรวมของงานที่อนุมัติ</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle, color: "#582c83" }}>เงินประกันการจองห้อง (50% ของค่าห้อง)</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#582c83", fontWeight: "bold" }}>
                    {fmtMoney(report.financial.deposit_thb)}
                  </td>
                  <td style={{ ...tdStyle, color: "#582c83" }}>
                    เงินประกันการจองล่วงหน้าเพื่อยืนยันสิทธิ์ (เพื่อการตรวจสอบ)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. สรุปรายการอาหารและเครื่องดื่มที่ให้บริการ */}
        <section className="report-section mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            5. สรุปรายการอาหารและเครื่องดื่มที่ให้บริการ (คำขอที่อนุมัติ)
          </h2>
          {report.catering.length === 0 ? (
            <p style={{ marginTop: "4px" }}>ไม่มีรายการสั่งอาหารและเครื่องดื่มในเดือนนี้</p>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full"
                style={{ borderCollapse: "collapse", fontSize: "15pt", marginTop: "4px" }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f0eaf6" }}>
                    <th style={{ ...tdStyle, width: "60px", textAlign: "center" }}>ลำดับ</th>
                    <th style={tdStyle}>รายการอาหาร / เครื่องดื่ม</th>
                    <th style={{ ...tdStyle, textAlign: "center", width: "140px" }}>จำนวนรวม (ชุด)</th>
                    <th style={{ ...tdStyle, textAlign: "right", width: "160px" }}>ยอดเงินรวม (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.catering.map((item, idx) => (
                    <tr key={item.item_code}>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                      <td style={tdStyle}>{item.item_name}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{fmtMoney(item.quantity)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#faf7fd", fontWeight: "bold" }}>
                    <td style={{ ...tdStyle, textAlign: "center" }} colSpan={2}>
                      รวมค่าอาหารและเครื่องดื่มทั้งสิ้น
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {fmtMoney(report.catering.reduce((sum, item) => sum + item.quantity, 0))}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {fmtMoney(report.financial.catering_fee_thb)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 6. การยกเลิก */}
        <section className="report-section mb-4">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            6. รายงานสถิติการยกเลิกการจอง
          </h2>
          <ul style={{ paddingLeft: "1.6em", listStyle: "disc" }}>
            <li>จำนวนการยกเลิกการจอง: {fmt(report.cancelled_count)} ครั้ง</li>
          </ul>
        </section>

        {/* 7. การยืนยันจากระบบ */}
        <section className="report-section">
          <h2 className="font-bold" style={{ fontSize: "17pt" }}>
            7. ข้อมูลการยืนยันจากระบบ
          </h2>
          <p>
            จัดทำโดย: ระบบจองห้องประชุมอัตโนมัติ มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
        </section>
      </div>
    </div>
  );
}

export function buildPrintedAt(): string {
  const nowIct = new Date(Date.now() + 7 * 3600 * 1000);
  return `${String(nowIct.getUTCDate()).padStart(2, "0")} ${THAI_ABBR_MONTHS[nowIct.getUTCMonth()]} ${nowIct.getUTCFullYear() + 543} เวลา ${String(nowIct.getUTCHours()).padStart(2, "0")}:${String(nowIct.getUTCMinutes()).padStart(2, "0")} น.`;
}

const tdStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "2px 8px",
  verticalAlign: "top",
};
