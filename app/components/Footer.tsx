import React from "react";

export function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-white/10 bg-[#120d24]/75 backdrop-blur-2xl py-6 px-4 text-center text-sm text-slate-400 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <p className="font-semibold text-slate-200">
            ระบบจองห้องประชุม V.1 | © 2026 มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
          <p className="text-xs text-violet-300/70 mt-1">
            พัฒนาโดย: นายชูเกียรติ กุศลสถิตย์
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          หอประชุมชั้น 2 และห้องประชุมชั้น 7
        </div>
      </div>
    </footer>
  );
}
