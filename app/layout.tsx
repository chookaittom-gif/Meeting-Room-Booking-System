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
      <body className="min-h-full flex flex-col antialiased bg-[#fcfbfe] text-[#1e1e24]">
        {/* Header Navigation */}
        <header className="w-full bg-white border-b border-[#e6e2ea] sticky top-0 z-40 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src="/images/meeting.png"
                  alt="ตราสัญลักษณ์ระบบจองห้องประชุม"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base sm:text-lg text-[#582c83] leading-tight">
                  ระบบจองห้องประชุม
                </span>
                <span className="text-xs text-[#595963]">
                  มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/book"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#582c83] hover:bg-[#48236b] transition-colors touch-target shadow-xs"
              >
                จองห้องประชุม
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-[#582c83] bg-[#f5f0fa] hover:bg-[#ebe2f5] transition-colors touch-target"
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
