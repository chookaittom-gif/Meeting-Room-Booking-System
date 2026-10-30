import React from "react";

export function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-[#582c83]/10 bg-white/80 backdrop-blur-xl py-6 px-4 text-center text-sm text-[#595963] shadow-[0_-4px_20px_rgba(88,44,131,0.02)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <p className="font-bold text-[#1e1e24]">
            ระบบจองห้องประชุม V.1 | © 2026 มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
          <p className="text-xs text-[#582c83] font-medium mt-1">
            พัฒนาโดย: นายชูเกียรติ กุศลสถิตย์
          </p>
        </div>
        <div className="text-xs text-[#595963] font-semibold bg-[#582c83]/6 px-3 py-1.5 rounded-xl border border-[#582c83]/10">
          หอประชุมชั้น 2 และห้องประชุมชั้น 7
        </div>
      </div>
    </footer>
  );
}
