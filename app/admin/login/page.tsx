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
      {/* Ambient background glow (Futuristic Cyber Glass effect) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-violet-600/25 via-purple-900/20 to-amber-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-[#16112a]/90 backdrop-blur-3xl rounded-3xl border border-white/15 p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.85)] hover:border-violet-500/40 transition-all space-y-6">
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto mb-2 p-1.5 rounded-2xl bg-white/10 border border-white/15 shadow-inner">
            <Image
              src="/images/meeting.png"
              alt="ระบบจองห้องประชุม"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-400" />
            เข้าสู่ระบบผู้ดูแล (Admin)
          </h1>
          <p className="text-xs text-violet-300/80 font-medium">
            ระบบจองห้องประชุม มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง
          </p>
        </div>

        {errorMsg && (
          <div role="alert" className="bg-rose-950/60 backdrop-blur-md border border-rose-500/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-rose-200 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-400" />
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 text-sm text-white touch-target transition-all placeholder:text-slate-500 shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-violet-400" />
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
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 text-sm text-white touch-target transition-all placeholder:text-slate-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors touch-target rounded-lg"
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
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 via-[#582c83] to-violet-700 hover:from-violet-500 hover:to-violet-600 shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] border border-violet-400/40 transition-all touch-target flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
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
