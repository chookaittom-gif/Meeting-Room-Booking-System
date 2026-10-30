"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        setErrorMsg(data.error || "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล");
        setIsLoading(false);
        return;
      }

      // Success
      router.push("/admin");
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-10 sm:py-16">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#e6e2ea] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <Image
              src="/images/meeting.png"
              alt="ระบบจองห้องประชุม"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-[#1e1e24]">เข้าสู่ระบบผู้ดูแล (Admin)</h1>
          <p className="text-xs text-[#595963]">
            ระบบจองห้องประชุม มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1e1e24] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#582c83]" />
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="chookait / pathaithep / nathlada"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1e1e24] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#582c83]" />
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white font-bold text-sm touch-target transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <div className="text-center">
          <span className="text-[11px] text-[#71717a]">
            รหัสผ่านเริ่มต้นสำหรับ Admin: Admin@1234
          </span>
        </div>
      </div>
    </div>
  );
}
