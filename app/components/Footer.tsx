import React from "react";
import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-[#e4e2ea] bg-white py-5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f5f0fa] border border-[#582c83]/15 flex items-center justify-center shrink-0" aria-hidden="true">
            <Building2 className="w-4 h-4 text-[#582c83]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#18181b] leading-tight">
              ระบบจองห้องประชุม V.1
            </p>
            <p className="text-xs text-[#52525b] font-medium">
              © 2026 มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง · พัฒนาโดย นายชูเกียรติ กุศลสถิตย์
            </p>
          </div>
        </div>
        <div className="text-xs text-[#52525b] font-semibold px-3 py-1.5 rounded-lg border border-[#e4e2ea] bg-[#f8f8fc] whitespace-nowrap">
          หอประชุมชั้น 2 · ห้องประชุมชั้น 7
        </div>
      </div>
    </footer>
  );
}
