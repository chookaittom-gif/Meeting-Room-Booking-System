import { thaiMonthYearFull } from "@/lib/monthly-report";
import type { MonthlyReport } from "@/lib/monthly-report";
import { formatThaiEpochDate, formatThaiEpochTime } from "@/lib/date-utils";

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

// ขนาดตัวอักษรชุดเดียว ใช้ร่วมกันทั้งหน้าเว็บและงานพิมพ์ (TH Sarabun New)
const SZ = {
  body: "12pt",
  title: "16pt",
  h2: "13.5pt",
  table: "11.5pt",
  small: "10.5pt",
};

const SHEET_FONT = "'TH Sarabun New','TH SarabunPSK','TH Sarabun',sans-serif";

export default function MonthlyReportSheet({ report, monthKey, printedAt }: Props) {
  const approvedBookings = report.approved_bookings || [];
  const hasApprovedBookings = approvedBookings.length > 0;
  const internalCount = report.purposes?.find((p) => p.meeting_type === "internal")?.count ?? 0;

  const sheetStyle: React.CSSProperties = {
    fontFamily: SHEET_FONT,
    fontSize: SZ.body,
    lineHeight: 1.25,
    color: "#000",
    maxWidth: "210mm",
    padding: "clamp(14px, 4vw, 10mm)",
  };
  const h2Style: React.CSSProperties = { fontSize: SZ.h2, marginBottom: "2px" };
  const tableStyle: React.CSSProperties = {
    borderCollapse: "collapse",
    fontSize: SZ.table,
    marginTop: "2px",
  };

  return (
    <div className="w-full">
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
        .report-sheet th { overflow-wrap: normal; word-break: keep-all; text-align: center; vertical-align: middle; }
        @media screen and (max-width: 480px) { .report-scroll { overflow-x: auto; } .report-scroll > table { min-width: 560px; } }
        @media (max-width: 480px) { .report-sheet th, .report-sheet td { padding-left: 3px !important; padding-right: 3px !important; } }
        .report-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; min-height: 0 !important; }
          body > header, body > footer { display: none !important; }
          .report-page { padding: 0 !important; min-height: 0 !important; }
          .report-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
          .report-section { break-inside: avoid; page-break-inside: avoid; }
          .report-page-break { break-before: page !important; page-break-before: always !important; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* แผ่นที่ 1: สรุปภาพรวมและสถิติ */}
      <div
        className="report-sheet bg-white mx-auto shadow-[0_2px_16px_rgba(88,44,131,0.10)] border border-[#e4e2ea]"
        style={sheetStyle}
      >
        {/* หัวรายงาน */}
        <header className="text-center mb-3 report-section">
          <div className="text-right text-[#222] font-semibold mb-0.5" style={{ fontSize: SZ.table }}>
            หน้า 1
          </div>
          <p>มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง</p>
          <h1 className="font-bold" style={{ fontSize: SZ.title, margin: "1px 0" }}>
            รายงานสรุปการใช้บริการห้องประชุม
          </h1>
          <p className="font-bold" style={{ fontSize: SZ.h2 }}>
            ประจำเดือน {thaiMonthYearFull(monthKey)}
          </p>
          <p style={{ fontSize: SZ.table, marginTop: "2px", color: "#333" }}>
            ข้อมูล ณ วันที่ {printedAt} | หน่วยงานที่รับผิดชอบข้อมูล: งานอาคารสถานที่ ศูนย์การศึกษาลำปาง
          </p>
        </header>

        {/* 1. สรุปภาพรวม */}
        <section className="report-section mb-2.5">
          <h2 className="font-bold" style={h2Style}>
            1. สรุปภาพรวมการให้บริการ
          </h2>
          <ul style={{ paddingLeft: "1.4em", listStyle: "disc" }}>
            <li>จำนวนวันเปิดให้บริการในเดือนนี้ (วันทำการ): {report.operational_days} วัน</li>
            <li>
              จำนวนห้องประชุมทั้งหมดที่อยู่ในการดูแล: {report.total_rooms} ห้อง
              (หอประชุมชั้น 2 จำนวน 1 ห้อง และห้องประชุมชั้น 7 จำนวน 1 ห้อง)
            </li>
            <li>จำนวนการจองและเข้าใช้งานรวม (อนุมัติ): {fmt(report.total_bookings)} ครั้ง</li>
            <li>จำนวนชั่วโมงการใช้งานรวมทั้งหมด: {fmt(report.total_hours)} ชั่วโมง</li>
            <li>
              อัตราการครองใช้ห้องประชุมเฉลี่ย: {fmt(report.overall_utilization_pct)}%
              <span style={{ fontSize: SZ.small, color: "#444" }}>
                {" "}
                (คิดจากชั่วโมงให้บริการ {report.operational_days} วัน × 8 ชม./วัน × {report.total_rooms} ห้อง)
              </span>
            </li>
          </ul>
        </section>

        {/* 2. ตารางรายห้อง */}
        <section className="report-section mb-2.5">
          <h2 className="font-bold" style={h2Style}>
            2. ตารางสถิติการใช้งานห้องประชุม
          </h2>
          <table className="w-full table-fixed" style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f0eaf6" }}>
                <th style={{ ...tdStyle, width: "22%" }}>ชื่อห้องประชุม</th>
                <th style={{ ...tdStyle, width: "19%" }}>จำนวนครั้ง<br />(ครั้ง)</th>
                <th style={{ ...tdStyle, width: "19%" }}>ชั่วโมงรวม<br />(ชม.)</th>
                <th style={{ ...tdStyle, width: "17%" }}>อัตราการใช้<br />(%)</th>
                <th style={{ ...tdStyle, width: "23%" }}>โครงการที่จองหลัก</th>
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
        <section className="report-section mb-2.5">
          <h2 className="font-bold" style={h2Style}>
            3. จำแนกสถิติตามประเภทการใช้งาน
          </h2>
          {report.purposes.length === 0 ? (
            <p>ไม่มีการใช้งานในเดือนนี้</p>
          ) : (
            <ul style={{ paddingLeft: "1.4em", listStyle: "disc" }}>
              {report.purposes.map((p) => (
                <li key={p.meeting_type}>
                  {p.label_th}: {fmt(p.count)} ครั้ง ({fmt(p.pct)}%)
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. สรุปประมาณการรายรับและค่าใช้จ่าย */}
        <section className="report-section mb-2.5">
          <h2 className="font-bold" style={h2Style}>
            4. สรุปประมาณการรายรับและค่าใช้จ่าย (คำขอที่อนุมัติ)
          </h2>
          <table className="w-full table-fixed" style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#f0eaf6" }}>
                <th style={{ ...tdStyle, width: "38%" }}>รายการรายรับ/ค่าบริการ</th>
                <th style={{ ...tdStyle, width: "20%" }}>จำนวนเงิน<br />(บาท)</th>
                <th style={{ ...tdStyle, width: "42%" }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>ค่าบำรุงสถานที่/ค่าห้องประชุม</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmtMoney(report.financial.room_fee_thb)}</td>
                <td style={tdStyle}>
                  คำนวณตามประเภทห้องและลักษณะการใช้งาน
                  {internalCount > 0 && ` (รวมการจองภายในองค์กร ${internalCount} ครั้ง — ไม่มีค่าใช้จ่าย)`}
                </td>
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
        </section>

        {/* 5. สรุปรายการอาหารและเครื่องดื่มที่ให้บริการ */}
        <section className="report-section mb-2.5">
          <h2 className="font-bold" style={h2Style}>
            5. สรุปรายการอาหารและเครื่องดื่มที่ให้บริการ (คำขอที่อนุมัติ)
          </h2>
          {report.catering.length === 0 ? (
            <p style={{ marginTop: "2px" }}>ไม่มีรายการสั่งอาหารและเครื่องดื่มในเดือนนี้</p>
          ) : (
            <div className="report-scroll"><table className="w-full table-fixed" style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: "#f0eaf6" }}>
                  <th style={{ ...tdStyle, width: "9%" }}>ลำดับ</th>
                  <th style={tdStyle}>รายการอาหาร / เครื่องดื่ม</th>
                  <th style={{ ...tdStyle, width: "17%" }}>จำนวนรวม<br />(ชุด)</th>
                  <th style={{ ...tdStyle, width: "20%" }}>ยอดเงินรวม<br />(บาท)</th>
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
            </table></div>
          )}
        </section>

        {/* 6. การยกเลิก */}
        <section className="report-section mb-2.5">
          <h2 className="font-bold" style={h2Style}>
            6. รายงานสถิติการยกเลิกการจอง
          </h2>
          <ul style={{ paddingLeft: "1.4em", listStyle: "disc" }}>
            <li>จำนวนการยกเลิกการจอง: {fmt(report.cancelled_count)} ครั้ง</li>
          </ul>
        </section>

        {/* 7. สรุปรายการคำขอที่ได้รับการอนุมัติ */}
        <section className="report-section mb-2.5">
          <h2 className="font-bold" style={h2Style}>
            7. สรุปรายการคำขอที่ได้รับการอนุมัติ
          </h2>
          {hasApprovedBookings ? (
            <p>
              มีรายการคำขอที่ได้รับการอนุมัติทั้งสิ้น <strong>{approvedBookings.length}</strong> รายการ (แสดงรายละเอียดในตารางแนบท้าย)
            </p>
          ) : (
            <p style={{ color: "#555" }}>ไม่มีรายการคำขอที่อนุมัติในเดือนนี้</p>
          )}
        </section>

        {/* 8. การยืนยันจากระบบ */}
        <section className="report-section">
          <h2 className="font-bold" style={h2Style}>
            8. ข้อมูลการยืนยันจากระบบ
          </h2>
          <p>
            จัดทำโดย: ระบบจองห้องประชุมอัตโนมัติ มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
        </section>
      </div>

      {/* แผ่นที่ 2: รายละเอียดรายการจองที่อนุมัติ (ถ้ามีรายการ) */}
      {hasApprovedBookings && (
        <div
          className="report-sheet report-page-break bg-white mx-auto shadow-[0_2px_16px_rgba(88,44,131,0.10)] border border-[#e4e2ea] mt-8"
          style={sheetStyle}
        >
          {/* หัวตารางหน้า 2 */}
          <header className="mb-3 report-section">
            <div className="text-right text-[#222] font-semibold mb-0.5" style={{ fontSize: SZ.table }}>
              หน้า 2
            </div>
            <div className="text-center">
              <p>มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง</p>
              <h2 className="font-bold" style={{ fontSize: SZ.title, margin: "1px 0" }}>
                รายละเอียดรายการจองห้องประชุมที่ได้รับการอนุมัติ
              </h2>
              <p className="font-bold" style={{ fontSize: SZ.h2 }}>
                ประจำเดือน {thaiMonthYearFull(monthKey)}
              </p>
            </div>
          </header>

          {/* ตารางรายการจองที่อนุมัติ: ไม่ครอบด้วย report-section เพื่อให้แถวไหลต่อข้ามหน้าได้ */}
          <div className="report-scroll"><table
            className="w-full table-fixed"
            style={{ ...tableStyle, fontSize: SZ.small }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f0eaf6" }}>
                <th style={{ ...tdStyle, width: "6%" }}>ลำดับ</th>
                <th style={{ ...tdStyle, width: "15%" }}>วันที่-เวลา</th>
                <th style={{ ...tdStyle, width: "13%" }}>ห้องประชุม</th>
                <th style={tdStyle}>ชื่อกิจกรรม / โครงการ</th>
                <th style={{ ...tdStyle, width: "17%" }}>ผู้ขอจอง /<br />โทรศัพท์</th>
                <th style={{ ...tdStyle, width: "10%" }}>ผู้เข้าร่วม<br />(คน)</th>
                <th style={{ ...tdStyle, width: "11%" }}>ยอดรวม<br />(บาท)</th>
              </tr>
            </thead>
            <tbody>
              {approvedBookings.map((b, idx) => (
                <tr key={b.id || idx}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                  <td style={tdStyle}>
                    <div className="font-semibold">{formatThaiEpochDate(b.starts_at, false)}</div>
                    <div style={{ color: "#444" }}>
                      {formatThaiEpochTime(b.starts_at)} – {formatThaiEpochTime(b.ends_at)}
                    </div>
                  </td>
                  <td style={tdStyle}>{b.room_name}</td>
                  <td style={tdStyle}>
                    <div className="font-bold">{b.activity_name}</div>
                    {b.project_name && b.project_name !== b.activity_name && (
                      <div style={{ color: "#555" }}>
                        โครงการ: {b.project_name}
                      </div>
                    )}
                    <div style={{ color: "#666" }}>
                      รหัส: {b.booking_code}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div>{b.coordinator_name}</div>
                    {b.coordinator_phone && (
                      <div style={{ color: "#555" }}>{b.coordinator_phone}</div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    {fmt(b.attendees_count)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: "600" }}>
                    {fmtMoney(b.total_amount_thb)}
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "#faf7fd", fontWeight: "bold" }}>
                <td style={{ ...tdStyle, textAlign: "center" }} colSpan={5}>
                  รวมทั้งสิ้น ({approvedBookings.length} รายการ)
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  {fmtMoney(approvedBookings.reduce((sum, b) => sum + (b.attendees_count || 0), 0))}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", color: "#582c83" }}>
                  {fmtMoney(approvedBookings.reduce((sum, b) => sum + (b.total_amount_thb || 0), 0))}
                </td>
              </tr>
            </tbody>
          </table></div>

          {/* ท้ายแผ่นที่ 2 */}
          <footer className="report-section mt-4 pt-2" style={{ borderTop: "1px dashed #ccc", fontSize: SZ.small, color: "#555" }}>
            <div className="flex justify-between items-center gap-2">
              <span>จัดทำโดย: ระบบจองห้องประชุมอัตโนมัติ มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง</span>
              <span>ข้อมูล ณ {printedAt}</span>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export function buildPrintedAt(): string {
  const nowIct = new Date(Date.now() + 7 * 3600 * 1000);
  return `${String(nowIct.getUTCDate()).padStart(2, "0")} ${THAI_ABBR_MONTHS[nowIct.getUTCMonth()]} ${nowIct.getUTCFullYear() + 543} เวลา ${String(nowIct.getUTCHours()).padStart(2, "0")}:${String(nowIct.getUTCMinutes()).padStart(2, "0")} น.`;
}

const tdStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "2px 6px",
  verticalAlign: "top",
};
