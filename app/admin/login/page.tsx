"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative flex items-center justify-center py-12 sm:py-20 px-4 min-h-[calc(100vh-160px)]">
      {/* Ambient background glow (Royal Aurora effect) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-purple-200/50 via-violet-100/40 to-amber-100/30 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/80 p-7 sm:p-9 shadow-[0_20px_50px_rgba(88,44,131,0.08)] space-y-6">
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto mb-2 p-1.5 rounded-2xl bg-gradient-to-br from-[#582c83]/10 to-transparent border border-[#582c83]/15 shadow-inner">
            <Image
              src="/images/meeting.png"
              alt="ระบบจองห้องประชุม"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1e1e24] tracking-tight flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#582c83]" />
            เข้าสู่ระบบผู้ดูแล (Admin)
          </h1>
          <p className="text-xs text-[#595963] font-medium">
            ระบบจองห้องประชุม มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="bg-red-50/90 backdrop-blur-xs border border-red-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-800 shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1e1e24] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#582c83]" />
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white/95 text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target transition-all shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1e1e24] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#582c83]" />
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่าน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-[#e6e2ea] bg-white/95 text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#595963] hover:text-[#1e1e24] transition-colors touch-target rounded-lg"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] hover:from-violet-700 hover:to-[#381a54] shadow-[0_4px_20px_rgba(88,44,131,0.22)] hover:shadow-[0_6px_25px_rgba(88,44,131,0.32)] border border-white/20 transition-all touch-target flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังตรวจสอบข้อมูล...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
