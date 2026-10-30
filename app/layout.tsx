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
      <body className="min-h-full flex flex-col antialiased bg-gradient-to-br from-[#fcfbfe] via-[#faf7fd] to-[#f5eefc] text-[#1e1e24]">
        {/* Header Navigation */}
        <header className="w-full bg-white/80 backdrop-blur-xl border-b border-[#582c83]/10 sticky top-0 z-40 shadow-[0_4px_25px_rgba(88,44,131,0.04)] transition-all">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 shrink-0 p-1 rounded-xl bg-white/90 border border-[#582c83]/15 shadow-xs group-hover:scale-105 transition-transform">
                <Image
                  src="/images/meeting.png"
                  alt="ตราสัญลักษณ์ระบบจองห้องประชุม"
                  fill
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg text-[#582c83] leading-tight tracking-tight group-hover:text-[#48236b] transition-colors">
                  ระบบจองห้องประชุม
                </span>
                <span className="text-xs text-[#595963]">
                  มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/book"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#582c83] to-[#48236b] hover:from-[#48236b] hover:to-[#381a54] shadow-[0_4px_14px_rgba(88,44,131,0.2)] hover:shadow-[0_6px_18px_rgba(88,44,131,0.3)] hover:-translate-y-0.5 transition-all touch-target"
              >
                จองห้องประชุม
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-[#582c83] bg-[#582c83]/10 hover:bg-[#582c83]/15 border border-[#582c83]/15 transition-all touch-target"
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
