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
      <body className="min-h-full flex flex-col antialiased bg-[#0b0816] text-slate-100 selection:bg-violet-500/30 selection:text-white relative">
        {/* Ambient Backdrop Space Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-violet-600/20 via-purple-900/10 to-transparent rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -left-48 w-96 h-96 bg-violet-800/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 -right-48 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Header Navigation */}
        <header className="w-full bg-[#120d24]/75 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 shrink-0 p-1 rounded-xl bg-white/10 border border-white/15 shadow-inner group-hover:scale-105 group-hover:border-violet-400/40 transition-all">
                <Image
                  src="/images/meeting.png"
                  alt="ตราสัญลักษณ์ระบบจองห้องประชุม"
                  fill
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-white to-amber-200 leading-tight tracking-tight group-hover:from-violet-100 group-hover:to-white transition-all">
                  ระบบจองห้องประชุม
                </span>
                <span className="text-xs text-violet-300/70">
                  มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/book"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-white bg-gradient-to-r from-violet-600 to-[#582c83] hover:from-violet-500 hover:to-violet-700 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_28px_rgba(139,92,246,0.55)] hover:-translate-y-0.5 border border-violet-400/30 transition-all touch-target"
              >
                จองห้องประชุม
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-violet-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 transition-all touch-target"
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
