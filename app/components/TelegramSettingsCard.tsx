"use client";

import React, { useEffect, useState } from "react";
import { Send, Loader2, Sparkles, Settings2, Trash2 } from "lucide-react";
import { useAlertDialog } from "./AlertDialog";
import { formatThaiEpochDate } from "@/lib/date-utils";

interface TgStatus {
  key_available: boolean;
  configured: boolean;
  enabled: boolean;
  bot_username: string | null;
  token_last4: string | null;
  chat_id: string | null;
  updated_at: number | null;
  decrypt_failed: boolean;
  can_edit: boolean;
}

const input =
  "w-full min-h-[44px] px-3.5 rounded-xl border border-[#e4e2ea] bg-white text-sm text-[#18181b] focus:outline-none focus:ring-2 focus:ring-[#582c83] disabled:opacity-50";
const btn =
  "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e4e2ea] bg-white hover:bg-[#f8f8fc] text-xs font-bold text-[#18181b] touch-target disabled:opacity-40 transition-colors shadow-2xs";

export function TelegramSettingsCard() {
  const dialog = useAlertDialog();
  const [st, setSt] = useState<TgStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "test" | "toggle" | "delete">("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/telegram");
      const data = (await res.json()) as any;
      if (res.ok && data.telegram) setSt(data.telegram);
    } catch {
      /* card stays hidden until the status loads */
    }
  };
  useEffect(() => {
    load();
  }, []);

  const call = async (method: string, body: object = {}) => {
    const res = await fetch("/api/admin/telegram", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    return { ok: res.ok, data };
  };

  const run = async (kind: typeof busy, fn: () => Promise<{ ok: boolean; data: any }>, after?: () => void) => {
    setBusy(kind);
    setFeedback(null);
    try {
      const { ok, data } = await fn();
      setFeedback({ ok, text: ok ? data.message : data.error || "เกิดข้อผิดพลาด" });
      if (ok) after?.();
    } catch {
      setFeedback({ ok: false, text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" });
    } finally {
      setBusy("");
      load();
      setTimeout(() => setFeedback(null), 8000);
    }
  };

  const save = () =>
    run("save", () => call("PUT", { token: token.trim(), chat_id: chatId.trim() }), () => {
      setToken("");
      setOpen(false);
    });

  const remove = async () => {
    const ok = await dialog.confirm({
      title: "ลบการตั้งค่า Telegram?",
      message: "ระบบจะลบ Bot Token และ Chat ID ที่บันทึกไว้ และหยุดแจ้งเตือนเข้า Telegram จนกว่าจะตั้งค่าใหม่",
      confirmLabel: "ลบการตั้งค่า",
      tone: "danger",
    });
    if (ok) run("delete", () => call("DELETE"), () => setOpen(false));
  };

  if (!st) return null;

  const badge = !st.key_available
    ? { text: "ยังไม่ตั้งค่ากุญแจเข้ารหัส", cls: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" }
    : !st.configured
      ? { text: "ยังไม่ตั้งค่า", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" }
      : st.decrypt_failed
        ? { text: "กรุณากรอก Token ใหม่", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" }
        : st.enabled
          ? { text: "เปิดใช้งาน", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" }
          : { text: "ปิดใช้งาน", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

  const active = st.configured && st.enabled && !st.decrypt_failed;
  const summary = st.configured
    ? [st.bot_username && `บอท @${st.bot_username}`, st.chat_id && `กลุ่ม ${st.chat_id}`, st.token_last4 && `Token ••••${st.token_last4}`, st.updated_at && `อัปเดตล่าสุด ${formatThaiEpochDate(st.updated_at, false)}`]
        .filter(Boolean)
        .join(" · ")
    : "แจ้งเตือนเข้ากลุ่ม Telegram เมื่อมีคำขอจองใหม่ และเมื่ออนุมัติห้อง";

  return (
    <div className="card p-4 sm:p-5 bg-white border border-[#e4e2ea] space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              active ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm text-[#18181b]">การแจ้งเตือน Telegram Bot</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.text}
              </span>
            </div>
            <p className="text-xs text-[#52525b] mt-0.5 break-words">{summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          {st.can_edit && (
            <button type="button" onClick={() => setOpen((v) => !v)} disabled={!st.key_available} aria-expanded={open} className={btn}>
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
              {st.configured ? "เปลี่ยนค่า" : "ตั้งค่า"}
            </button>
          )}
          {st.configured && (
            <>
              <button
                type="button"
                onClick={() => run("test", () => call("POST"))}
                disabled={busy !== "" || !st.enabled || st.decrypt_failed}
                className={btn}
              >
                {busy === "test" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                ทดสอบส่ง
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={st.enabled}
                onClick={() => run("toggle", () => call("PATCH", { enabled: !st.enabled }))}
                disabled={busy !== "" || st.decrypt_failed}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#582c83] before:absolute before:-inset-2.5 before:rounded-full before:content-[''] disabled:opacity-50 ${
                  st.enabled ? "bg-[#059669]" : "bg-gray-300"
                }`}
              >
                <span className="sr-only">เปิดปิดการแจ้งเตือน Telegram</span>
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    st.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {!st.key_available && (
        <p role="status" className="text-xs font-semibold px-3 py-2 rounded-lg border bg-amber-50 text-amber-900 border-amber-200">
          ยังไม่ได้ตั้งค่ากุญแจเข้ารหัสบนเซิร์ฟเวอร์ จึงยังบันทึก Token ไม่ได้ (ผู้พัฒนาต้องตั้งค่า TELEGRAM_ENCRYPTION_KEY ก่อน)
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className={`text-xs font-semibold px-3 py-2 rounded-lg border ${
            feedback.ok ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {open && st.can_edit && st.key_available && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-3 pt-3 border-t border-[#e4e2ea]"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 block">
              <span className="text-xs font-bold text-[#18181b]">Bot Token</span>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={st.configured ? "กรอกใหม่เพื่อเปลี่ยน (ไม่แสดงค่าเดิม)" : "123456789:AA…"}
                className={input}
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-bold text-[#18181b]">Chat ID</span>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="-1001234567890"
                className={input}
              />
            </label>
          </div>
          <p className="text-[11px] text-[#71717a]">
            Chat ID ของกลุ่มขึ้นต้นด้วย -100 และต้องเพิ่มบอทเข้ากลุ่มก่อน ระบบจะตรวจ Token และส่งข้อความทดสอบเข้ากลุ่มก่อนบันทึก
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy !== "" || !token.trim() || !chatId.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white text-xs font-bold touch-target disabled:opacity-50 transition-colors"
            >
              {busy === "save" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {busy === "save" ? "กำลังตรวจสอบ..." : "ตรวจสอบและบันทึก"}
            </button>
            <button
              type="button"
              onClick={() => {
                setToken("");
                setOpen(false);
              }}
              disabled={busy === "save"}
              className={btn}
            >
              ยกเลิก
            </button>
            {st.configured && (
              <button
                type="button"
                onClick={remove}
                disabled={busy !== ""}
                className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100 text-xs font-bold touch-target disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                ลบการตั้งค่า
              </button>
            )}
          </div>
        </form>
      )}
      {dialog.element}
    </div>
  );
}
