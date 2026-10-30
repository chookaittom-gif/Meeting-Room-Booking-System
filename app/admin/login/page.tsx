"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

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
      {/* Ambient background glow (Futuristic Glass effect) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-[#582c83]/20 via-purple-300/20 to-[#cba052]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-7 sm:p-9 shadow-[0_20px_50px_rgba(88,44,131,0.08)] space-y-6">
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
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e1e24] tracking-tight">เข้าสู่ระบบผู้ดูแล (Admin)</h1>
          <p className="text-xs text-[#595963]">
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
              className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target transition-all placeholder:text-[#a1a1aa]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1e1e24] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#582c83]" />
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-[#e6e2ea] bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target transition-all placeholder:text-[#a1a1aa]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#71717a] hover:text-[#582c83] rounded-lg transition-colors touch-target focus:outline-none focus:ring-2 focus:ring-[#582c83]"
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#582c83] to-[#48236b] hover:from-[#48236b] hover:to-[#361952] text-white font-bold text-sm touch-target transition-all shadow-[0_4px_16px_rgba(88,44,131,0.25)] hover:shadow-[0_6px_20px_rgba(88,44,131,0.35)] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
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
      </div>
    </div>
  );
}
