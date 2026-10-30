import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-4 sm:py-8">
      {/* Hero Section */}
      <div className="w-full bg-white rounded-2xl border border-[#e6e2ea] overflow-hidden shadow-sm">
        <div className="relative w-full h-48 sm:h-72 bg-[#582c83]/5">
          <Image
            src="/images/meeting-room.png"
            alt="ภาพหอประชุมและห้องประชุม มหาวิทยาลัยสวนดุสิต ลำปาง"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
            <div className="text-white">
              <span className="inline-block px-3 py-1 bg-[#582c83] text-white text-xs font-semibold rounded-full mb-2">
                บริการจองห้องประชุมออนไลน์
              </span>
              <h1 className="text-xl sm:text-3xl font-bold">
                หอประชุมชั้น 2 และห้องประชุมชั้น 7
              </h1>
              <p className="text-xs sm:text-sm text-gray-200 mt-1">
                มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#1e1e24]">
              ตรวจสอบวันว่างและส่งคำขอจองห้องประชุม
            </h2>
            <p className="text-sm text-[#595963] max-w-xl">
              เปิดให้บริการทุกวัน ระหว่างเวลา 08:00 – 18:00 น. รองรับรูปแบบโต๊ะทั้ง Theater, Classroom, Cluster, U-Shape และ Boardroom พร้อมบริการอาหารกลางวันและเครื่องดื่ม
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white font-medium text-base shadow-sm transition-colors touch-target text-center"
            >
              เริ่มจองห้องประชุม
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Room Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <div className="bg-white rounded-xl border border-[#e6e2ea] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#582c83] bg-[#f5f0fa] px-2.5 py-1 rounded-md">
              ชั้น 2
            </span>
            <span className="text-xs text-[#595963]">ความจุสูงสุด 100 คน</span>
          </div>
          <h3 className="text-lg font-bold text-[#1e1e24]">หอประชุมชั้น 2</h3>
          <p className="text-sm text-[#595963]">
            รูปแบบหอประชุมปรับเปลี่ยนได้ตามความต้องการ รองรับทั้งงานประชุม สัมมนา และกิจกรรมพิธีการต่างๆ
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#e6e2ea] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#582c83] bg-[#f5f0fa] px-2.5 py-1 rounded-md">
              ชั้น 7
            </span>
            <span className="text-xs text-[#595963]">ความจุสูงสุด 300 คน</span>
          </div>
          <h3 className="text-lg font-bold text-[#1e1e24]">ห้องประชุมชั้น 7</h3>
          <p className="text-sm text-[#595963]">
            ห้องประชุมขนาดใหญ่ รองรับผู้เข้าร่วมได้ถึง 300 คน พร้อมระบบโสตทัศนูปกรณ์ครบครันสำหรับงานสัมมนาขนาดใหญ่
          </p>
        </div>
      </div>
    </div>
  );
}
