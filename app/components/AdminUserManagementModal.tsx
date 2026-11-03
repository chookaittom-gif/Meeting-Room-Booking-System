"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Key,
  Trash2,
  UserPlus,
  ShieldAlert,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Pencil,
  UtensilsCrossed,
} from "lucide-react";
import { AdminRole, AdminUser } from "@/lib/types";

interface AdminUserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: { id: string; username: string; displayName: string; role: AdminRole };
  onUserUpdated?: () => void;
}

export function AdminUserManagementModal({
  isOpen,
  onClose,
  currentAdmin,
  onUserUpdated,
}: AdminUserManagementModalProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sub-modal states
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addConfirmPassword, setAddConfirmPassword] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [isAdding, setIsAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Name state
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "staff">("admin");
  const [isSavingName, setIsSavingName] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = (await res.json()) as any;
        throw new Error(data.error || "ไม่สามารถโหลดรายชื่อผู้ดูแลระบบได้");
      }
      const data = (await res.json()) as any;
      setUsers(data.users || []);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setFeedback(null);
    }
  }, [isOpen]);

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    if (newPassword.length < 8) {
      setFeedback({ type: "error", text: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน" });
      return;
    }

    setIsResetting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }
      setFeedback({ type: "success", text: data.message });
      setResetTarget(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" });
    } finally {
      setIsResetting(false);
    }
  };

  // Handle Edit Name
  const handleEditName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    const trimmedName = editDisplayName.trim();
    if (trimmedName.length < 2) {
      setFeedback({ type: "error", text: "ชื่อ-นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร" });
      return;
    }

    setIsSavingName(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: trimmedName, role: editTarget.username === "chookait" ? "superadmin" : editRole }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการแก้ไขชื่อ");
      }

      setFeedback({ type: "success", text: data.message });
      setUsers((prev) =>
        prev.map((u) => (u.id === editTarget.id ? { ...u, displayName: trimmedName, role: editTarget.username === "chookait" ? "superadmin" : editRole } : u))
      );
      setEditTarget(null);
      if (editTarget.id === currentAdmin.id && onUserUpdated) {
        onUserUpdated();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการแก้ไขชื่อ" });
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUsername.trim() || !/^[a-zA-Z0-9_]{3,30}$/.test(newUsername.trim())) {
      setFeedback({ type: "error", text: "ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีดล่าง 3-30 ตัวอักษร" });
      return;
    }

    if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
      setFeedback({ type: "error", text: "กรุณาระบุชื่อ-นามสกุลให้ถูกต้อง" });
      return;
    }

    if (addPassword.length < 8) {
      setFeedback({ type: "error", text: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" });
      return;
    }

    if (addPassword !== addConfirmPassword) {
      setFeedback({ type: "error", text: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน" });
      return;
    }

    setIsAdding(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim().toLowerCase(),
          displayName: newDisplayName.trim(),
          password: addPassword,
          role: newRole,
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ");
      }
      setFeedback({ type: "success", text: data.message });
      setIsAddOpen(false);
      setNewUsername("");
      setNewDisplayName("");
      setAddPassword("");
      setAddConfirmPassword("");
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ" });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการลบบัญชี");
      }
      setFeedback({ type: "success", text: data.message });
      setDeleteTarget(null);
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "เกิดข้อผิดพลาดในการลบบัญชี" });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.22)] flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#e6e2ea] flex items-center justify-between gap-3 bg-gradient-to-r from-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f5f0fa] text-[#582c83] border border-[#582c83]/20 flex items-center justify-center font-bold shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-[#1e1e24] flex items-center gap-2">
                จัดการผู้ดูแลระบบ
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#f5f0fa] text-[#582c83] border border-[#582c83]/20">
                  Superadmin Only
                </span>
              </h2>
              <p className="text-xs text-[#595963]">
                กำหนดรหัสผ่าน เพิ่ม หรือจัดการบัญชีผู้ดูแลระบบในระบบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-5 sm:px-6 pt-4">
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 border-b border-[#f0edf4] bg-white">
          <span className="text-xs font-bold text-[#595963]">
            ผู้ดูแลระบบทั้งหมด ({users.length} บัญชี)
          </span>
          <button
            type="button"
            onClick={() => {
              setIsAddOpen(true);
              setFeedback(null);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white text-xs font-bold touch-target shadow-2xs transition-[transform,background-color] duration-150 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มผู้ดูแลระบบ</span>
          </button>
        </div>

        {/* User List Content */}
        <div className="p-5 sm:p-6 space-y-3 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs">
              ไม่พบข้อมูลผู้ดูแลระบบ
            </div>
          ) : (
            <div className="space-y-2.5">
              {users.map((u) => {
                const isSuper = u.role === "superadmin" || u.username === "chookait";
                const isSelf = u.id === currentAdmin.id;

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl border border-[#e6e2ea] bg-white hover:border-[#582c83]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          isSuper
                            ? "bg-[#f5f0fa] text-[#582c83] border-[#582c83]/25 shadow-2xs"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {u.displayName ? u.displayName.charAt(0) : u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#1e1e24]">{u.displayName}</h4>
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#f5f0fa] text-[#582c83] border border-[#582c83]/20 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              Superadmin
                            </span>
                          ) : u.role === "staff" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              <UtensilsCrossed className="w-3 h-3 text-sky-600" />
                              Staff (ฝ่ายอาหาร)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <UserCheck className="w-3 h-3 text-slate-500" />
                              Admin
                            </span>
                          )}
                          {isSelf && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              คุณ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#595963] font-mono mt-0.5">
                          @{u.username}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(u);
                          setEditDisplayName(u.displayName || "");
                          setEditRole(u.role === "staff" ? "staff" : "admin");
                          setFeedback(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold touch-target transition-[transform,background-color] duration-150 active:scale-95 shadow-2xs"
                        title="แก้ไขชื่อ-นามสกุล"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        <span>แก้ไขชื่อ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetTarget(u);
                          setNewPassword("");
                          setConfirmPassword("");
                          setFeedback(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#582c83] border border-[#582c83]/20 text-xs font-bold touch-target transition-[transform,background-color] duration-150 active:scale-95 shadow-2xs"
                        title="กำหนดรหัสผ่านใหม่"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>กำหนดรหัสผ่าน</span>
                      </button>

                      {/* Delete button (Cannot delete primary superadmin or oneself) */}
                      {!isSuper && !isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(u);
                            setFeedback(null);
                          }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 touch-target transition-[transform,background-color] duration-150 active:scale-95 shadow-2xs"
                          title="ลบบัญชีผู้ดูแลระบบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#e6e2ea] bg-gray-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-[#e6e2ea] text-xs font-bold text-[#1e1e24] hover:bg-gray-100 touch-target transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* ── Sub-modal: Reset Password ───────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.25)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e2ea]">
              <div>
                <h3 className="font-black text-base text-[#1e1e24] flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#582c83]" />
                  กำหนดรหัสผ่านใหม่
                </h3>
                <p className="text-xs text-[#595963] mt-0.5">
                  สำหรับผู้ใช้: <strong className="text-[#582c83]">{resetTarget.displayName}</strong> (@{resetTarget.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="กรอกรหัสผ่านใหม่"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#e6e2ea] focus:border-[#582c83] focus:ring-2 focus:ring-[#582c83]/15 text-xs outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-target"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="กรอกยืนยันรหัสผ่านใหม่อีกครั้ง"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6e2ea] focus:border-[#582c83] focus:ring-2 focus:ring-[#582c83]/15 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1.5">
                  สิทธิ์การใช้งาน (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole("admin")}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-colors touch-target ${
                      newRole === "admin"
                        ? "bg-purple-50 text-[#582c83] border-[#582c83] shadow-2xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-purple-700 shrink-0" />
                    <div>
                      <div className="font-extrabold">Admin</div>
                      <div className="text-[10px] text-gray-500 font-normal">อนุมัติ/ยกเลิกคำขอได้</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole("staff")}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-colors touch-target ${
                      newRole === "staff"
                        ? "bg-sky-50 text-sky-900 border-sky-400 shadow-2xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <div className="font-extrabold">Staff (ฝ่ายอาหาร)</div>
                      <div className="text-[10px] text-gray-500 font-normal">ดูข้อมูลอย่างเดียว</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e6e2ea]">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#e6e2ea] text-xs font-bold text-gray-700 hover:bg-gray-50 touch-target"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !newPassword || !confirmPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white text-xs font-bold touch-target shadow-2xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {isResetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isResetting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sub-modal: Add New Admin ─────────────────────────────────── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.25)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e6e2ea]">
              <div>
                <h3 className="font-black text-base text-[#1e1e24] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#582c83]" />
                  เพิ่มผู้ดูแลระบบใหม่
                </h3>
                <p className="text-xs text-[#595963] mt-0.5">
                  สร้างบัญชีผู้ดูแลระบบสำหรับจัดการการจองห้อง
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1">
                  ชื่อผู้ใช้ (Username)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  placeholder="เช่น somchai (3-30 ตัวอักษร)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6e2ea] focus:border-[#582c83] focus:ring-2 focus:ring-[#582c83]/15 text-xs outline-none transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1">
                  ชื่อ-นามสกุล (Display Name)
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6e2ea] focus:border-[#582c83] focus:ring-2 focus:ring-[#582c83]/15 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1">
                  รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัวอักษร)
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="กรอกรหัสผ่านเริ่มต้น"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#e6e2ea] focus:border-[#582c83] focus:ring-2 focus:ring-[#582c83]/15 text-xs outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-target"
                    tabIndex={-1}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type={showAddPassword ? "text" : "password"}
                  value={addConfirmPassword}
                  onChange={(e) => setAddConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="กรอกยืนยันรหัสผ่านอีกครั้ง"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6e2ea] focus:border-[#582c83] focus:ring-2 focus:ring-[#582c83]/15 text-xs outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e6e2ea]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#e6e2ea] text-xs font-bold text-gray-700 hover:bg-gray-50 touch-target"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !newUsername || !newDisplayName || !addPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white text-xs font-bold touch-target shadow-2xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAdding ? "กำลังบันทึก..." : "เพิ่มผู้ดูแลระบบ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sub-modal: Edit Name ────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.25)] p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e6e2ea]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#582c83] border border-[#582c83]/20 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#1e1e24]">แก้ไขข้อมูลและสิทธิ์ผู้ดูแลระบบ</h3>
                  <p className="text-xs text-[#595963] font-mono">@{editTarget.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1e1e24] mb-1">
                  ชื่อ-นามสกุล (Display Name)
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="กรอกชื่อ-นามสกุล..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6e2ea] focus:border-[#582c83] focus:ring-2 focus:ring-[#582c83]/15 text-xs outline-none transition-colors"
                  autoFocus
                />
              </div>

              {editTarget.username !== "chookait" && (
                <div>
                  <label className="block text-xs font-bold text-[#1e1e24] mb-1.5">
                    สิทธิ์การใช้งาน (Role)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRole("admin")}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-colors touch-target ${
                        editRole === "admin"
                          ? "bg-purple-50 text-[#582c83] border-[#582c83] shadow-2xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-purple-700 shrink-0" />
                      <div>
                        <div className="font-extrabold">Admin</div>
                        <div className="text-[10px] text-gray-500 font-normal">อนุมัติ/ยกเลิกคำขอได้</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole("staff")}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-colors touch-target ${
                        editRole === "staff"
                          ? "bg-sky-50 text-sky-900 border-sky-400 shadow-2xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4 text-sky-600 shrink-0" />
                      <div>
                        <div className="font-extrabold">Staff (ฝ่ายอาหาร)</div>
                        <div className="text-[10px] text-gray-500 font-normal">ดูข้อมูลอย่างเดียว</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}



              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e6e2ea]">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#e6e2ea] text-xs font-bold text-gray-700 hover:bg-gray-50 touch-target"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingName || !editDisplayName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#582c83] hover:bg-[#48236b] text-white text-xs font-bold touch-target shadow-2xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  {isSavingName && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingName ? "กำลังบันทึก..." : "บันทึกชื่อ"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sub-modal: Confirm Delete ────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-white/80 shadow-[0_25px_60px_rgba(88,44,131,0.25)] p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-[#1e1e24]">ยืนยันการลบบัญชีผู้ดูแลระบบ</h3>
              <p className="text-xs text-[#595963]">
                คุณต้องการลบบัญชี <strong className="text-rose-700">{deleteTarget.displayName}</strong> (@{deleteTarget.username}) ออกจากระบบใช่หรือไม่?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#e6e2ea] text-xs font-bold text-gray-700 hover:bg-gray-50 touch-target"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold touch-target shadow-2xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "กำลังลบ..." : "ยืนยันลบบัญชี"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
