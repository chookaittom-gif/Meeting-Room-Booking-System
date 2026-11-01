import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Footer } from "./components/Footer";
import { verifySessionToken } from "../lib/auth";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, LogIn, BarChart3, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "ระบบจองห้องประชุม | มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง",
  description: "ระบบบริการจองหอประชุมชั้น 2 และห้องประชุมชั้น 7 มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hide the login button when an admin session cookie is already valid
  const sessionCookie = (await cookies()).get("admin_session")?.value;
  const isLoggedIn = sessionCookie
    ? (await verifySessionToken(sessionCookie)) !== null
    : false;

  return (
    <html lang="th" className="h-full">
      <body
        className="min-h-full flex flex-col antialiased text-[#18181b] selection:bg-purple-100 selection:text-[#582c83]"
        style={{ backgroundColor: "var(--brand-ground)" }}
      >
        {/* Subtle top accent line */}
        <div className="h-[3px] w-full bg-[#582c83] shrink-0" />

        {/* Header Navigation */}
        <header className="w-full bg-white border-b border-[#e4e2ea] sticky top-0 z-40 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="max-w-5xl mx-auto px-4 py-0 flex items-center justify-between" style={{ minHeight: "64px" }}>
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 touch-target" aria-label="หน้าหลัก ระบบจองห้องประชุม">
              <div
                className="relative w-10 h-10 shrink-0 rounded-[10px] bg-[#f5f0fa] border border-[#582c83]/20 flex items-center justify-center overflow-hidden"
                aria-hidden="true"
              >
                <Image
                  src="/images/meeting.png"
                  alt=""
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-extrabold text-xs min-[400px]:text-sm sm:text-lg text-[#582c83] tracking-tight whitespace-nowrap truncate">
                  ระบบจองห้องประชุม
                </span>
                <span className="hidden sm:block text-[11px] text-[#52525b] font-medium whitespace-nowrap">
                  มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1.5 sm:gap-3 shrink-0" aria-label="เมนูหลัก">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white bg-[#582c83] hover:bg-[#48236b] shadow-[0_2px_8px_rgba(88,44,131,0.22)] hover:shadow-[0_4px_14px_rgba(88,44,131,0.3)] transition-colors touch-target whitespace-nowrap"
              >
                <CalendarDays className="w-4 h-4" aria-hidden="true" />
                <span className="hidden min-[420px]:inline">จองห้องประชุม</span>
                <span className="hidden min-[375px]:inline min-[420px]:hidden">จองห้อง</span>
                <span className="min-[375px]:hidden">จอง</span>
              </Link>
              <Link
                href="/stats"
                aria-label="สถิติการจอง"
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-[#52525b] bg-white hover:bg-[#f5f0fa] border border-[#e4e2ea] hover:border-[#582c83]/40 hover:text-[#582c83] transition-colors touch-target whitespace-nowrap"
              >
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">สถิติ</span>
              </Link>
              {!isLoggedIn ? (
                <Link
                  href="/admin"
                  aria-label="เข้าสู่ระบบผู้ดูแล"
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-[#52525b] bg-white hover:bg-[#f5f0fa] border border-[#e4e2ea] hover:border-[#582c83]/40 hover:text-[#582c83] transition-colors touch-target whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">เข้าสู่ระบบ</span>
                </Link>
              ) : (
                <Link
                  href="/admin"
                  aria-label="ไปยังหน้าผู้ดูแลระบบ"
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-[#52525b] bg-white hover:bg-[#f5f0fa] border border-[#e4e2ea] hover:border-[#582c83]/40 hover:text-[#582c83] transition-colors touch-target whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">ผู้ดูแล</span>
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-8">
          {children}
        </main>

        {/* System Footer on every page */}
        <Footer />
      </body>
    </html>
  );
}
