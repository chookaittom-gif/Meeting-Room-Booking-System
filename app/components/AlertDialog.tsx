"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, X } from "lucide-react";

export interface AlertDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" shows a red confirm button, "info" a purple one (default) */
  tone?: "danger" | "info";
}

interface ActiveDialog extends AlertDialogOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * In-app replacement for native alert()/confirm(), styled to match the system glass theme.
 * Usage:
 *   const dialog = useAlertDialog();
 *   const ok = await dialog.confirm({ title: "...", message: "...", tone: "danger" });
 *   dialog.alert({ title: "...", message: "..." });
 * Render {dialog.element} once per page.
 */
export function useAlertDialog() {
  const [active, setActive] = useState<ActiveDialog | null>(null);

  const open = (options: AlertDialogOptions, mode: "confirm" | "alert") =>
    new Promise<boolean>((resolve) => {
      setActive({ ...options, resolve: (v: boolean) => resolve(mode === "confirm" ? v : true) });
    });

  const confirm = (options: AlertDialogOptions) => open(options, "confirm");
  const alert = (options: AlertDialogOptions) => open(options, "alert");

  const close = (confirmed: boolean) => {
    setActive((prev) => {
      prev?.resolve(confirmed);
      return null;
    });
  };

  const element = active ? <DialogModal dialog={active} onClose={close} /> : null;

  return { confirm, alert, element };
}

function DialogModal({ dialog, onClose }: { dialog: ActiveDialog; onClose: (confirmed: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const danger = dialog.tone === "danger";

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e1e24]/45 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={dialog.title}
        className="w-full max-w-sm bg-white rounded-3xl border border-[#e6e2ea] shadow-[0_24px_64px_rgba(88,44,131,0.22)] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              danger ? "bg-rose-100 text-rose-600" : "bg-[#f3f0f8] text-[#582c83]"
            }`}
          >
            {danger ? <AlertTriangle className="w-5 h-5" aria-hidden="true" /> : <Info className="w-5 h-5" aria-hidden="true" />}
          </span>
          <button
            type="button"
            onClick={() => onClose(false)}
            aria-label="ปิดหน้าต่าง"
            className="w-8 h-8 -mt-1 -mr-1 rounded-lg flex items-center justify-center text-[#8e8e99] hover:bg-[#f3f0f8] hover:text-[#582c83] transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-1.5">
          <h2 className="font-extrabold text-[#1e1e24] text-base leading-snug">{dialog.title}</h2>
          <p className="text-xs sm:text-sm text-[#595963] leading-relaxed whitespace-pre-line">{dialog.message}</p>
        </div>
        <div className="flex gap-2.5 pt-1">
          {(dialog.cancelLabel === undefined ? "ยกเลิก" : dialog.cancelLabel) && (
            <button
              ref={cancelRef}
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-[#595963] bg-[#f3f0f8] hover:bg-[#ebe6f2] transition-colors touch-target"
            >
              {dialog.cancelLabel === undefined ? "ยกเลิก" : dialog.cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onClose(true)}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-colors touch-target ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#582c83] hover:bg-[#48236b]"
            }`}
          >
            {dialog.confirmLabel || "ตกลง"}
          </button>
        </div>
      </div>
    </div>
  );
}
