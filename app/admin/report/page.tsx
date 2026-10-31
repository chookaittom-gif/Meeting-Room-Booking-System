import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getD1Database } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import {
  getMonthlyReport,
  reportCurrentMonth,
  lastMonthKeys,
} from "@/lib/monthly-report";
import ReportToolbar from "../../components/ReportToolbar";
import MonthlyReportSheet, { buildPrintedAt } from "../../components/MonthlyReportSheet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายงานสรุปการใช้บริการห้องประชุมประจำเดือน",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ month?: string }>;
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
  const monthOptions = lastMonthKeys(current, 12).map((key) => ({ key, label: key }));

  return (
    <main className="report-page flex-1 w-full max-w-4xl mx-auto px-4 py-6">
      <ReportToolbar monthKey={monthKey} monthOptions={monthOptions} />
      <MonthlyReportSheet report={report} monthKey={monthKey} printedAt={buildPrintedAt()} />
    </main>
  );
}
