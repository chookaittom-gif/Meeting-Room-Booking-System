import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "./components/Footer";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ระบบจองห้องประชุม | มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง",
  description: "ระบบบริการจองหอประชุมชั้น 2 และห้องประชุมชั้น 7 มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-gradient-to-br from-[#fbfbfe] via-[#f7f4fc] to-[#f0eaf7] text-[#1e1e24] relative selection:bg-purple-200 selection:text-[#582c83]">
        {/* Ambient Royal Aurora Backdrop Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-purple-200/50 via-violet-100/30 to-transparent rounded-full blur-[110px]" />
          <div className="absolute top-1/4 -right-36 w-96 h-96 bg-amber-200/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 -left-36 w-96 h-96 bg-violet-200/40 rounded-full blur-[120px]" />
        </div>

        {/* Header Navigation */}
        <header className="w-full bg-white/85 backdrop-blur-2xl border-b border-[#582c83]/10 sticky top-0 z-40 shadow-[0_4px_25px_rgba(88,44,131,0.04)] transition-all">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 shrink-0 p-1 rounded-2xl bg-white border border-[#582c83]/15 shadow-sm group-hover:scale-105 group-hover:border-[#582c83]/30 transition-all">
                <Image
                  src="/images/meeting.png"
                  alt="ตราสัญลักษณ์ระบบจองห้องประชุม"
                  fill
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#582c83] via-[#7c3aed] to-[#582c83] leading-tight tracking-tight group-hover:from-violet-700 group-hover:to-[#48236b] transition-all">
                  ระบบจองห้องประชุม
                </span>
                <span className="text-xs text-[#595963] font-medium">
                  มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/book"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] hover:from-violet-700 hover:to-[#381a54] shadow-[0_4px_16px_rgba(88,44,131,0.22)] hover:shadow-[0_6px_22px_rgba(88,44,131,0.32)] hover:-translate-y-0.5 border border-white/20 transition-all touch-target"
              >
                จองห้องประชุม
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl text-[#582c83] bg-[#582c83]/8 hover:bg-[#582c83]/15 border border-[#582c83]/15 transition-all touch-target"
              >
                ผู้ดูแลระบบ
              </Link>
            </div>
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
