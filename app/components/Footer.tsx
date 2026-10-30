import React from "react";

export function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-[#e6e2ea] bg-white py-6 px-4 text-center text-sm text-[#595963]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <p className="font-medium text-[#1e1e24]">
            ระบบจองห้องประชุม V.1 | © 2026 มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
          <p className="text-xs text-[#71717a] mt-1">
            พัฒนาโดย: นายชูเกียรติ กุศลสถิตย์
          </p>
        </div>
        <div className="text-xs text-[#71717a]">
          หอประชุมชั้น 2 และห้องประชุมชั้น 7
        </div>
      </div>
    </footer>
  );
}
