"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore, toEpochSeconds } from "@/lib/booking-store";
import { formatThaiDateString } from "@/lib/date-utils";
import { findConflicts, suggestSlots, formatRange, statusLabel, toBangkokTime, BusyRange, FreeSlot } from "@/lib/availability";
import { ThaiDatePicker } from "@/app/components/ThaiDatePicker";
import { FOOD_CATALOG, FoodItemCatalog, TableLayout, MeetingType, getRoomFee } from "@/lib/types";
import { Calendar, Users, Utensils, Coffee, CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Loader2, Sparkles, Clock, ShieldCheck } from "lucide-react";

const STEPS = [
  { id: 1, label: "ข้อมูลกิจกรรม", icon: Calendar },
  { id: 2, label: "สถานที่และผัง", icon: Users },
  { id: 3, label: "อาหารกลางวัน", icon: Utensils },
  { id: 4, label: "อาหารว่างและเครื่องดื่ม", icon: Coffee },
  { id: 5, label: "สรุปและยืนยัน", icon: CheckCircle },
];

export default function BookingWizardPage() {
  const router = useRouter();
  const { formData, updateFormData, resetFormData, isLoaded } = useBookingStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [clash, setClash] = useState<{ conflicts: BusyRange[]; slots: FreeSlot[]; otherRoomId: string | null } | null>(null);

  // Prefill room from ?room= query (e.g. /book?room=floor7 from homepage CTA)
  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get("room");
    if (room === "floor2" || room === "floor7") updateFormData({ room_id: room });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
      </div>
    );
  }

  // Room capacities: floor2 = 250, floor7 = 450
  const maxCapacity = formData.room_id === "floor7" ? 450 : 250;
  const roomName = formData.room_id === "floor7" ? "ห้องประชุมชั้น 7" : "หอประชุมชั้น 2";
  const roomFeeInfo = getRoomFee(formData.room_id, formData.meeting_type);
  const roomDailyFee = roomFeeInfo?.dailyRate ?? 0;
  const roomDeposit = roomFeeInfo?.deposit ?? 0;

  // Validate current step before advancing
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);

    if (step === 1) {
      if (!formData.activity_name.trim()) {
        setErrorMsg("กรุณาระบุชื่อกิจกรรม");
        return false;
      }
      if (!formData.project_name.trim()) {
        setErrorMsg("กรุณาระบุชื่อโครงการ/กิจกรรมหลัก");
        return false;
      }
      if (!formData.coordinator_name.trim()) {
        setErrorMsg("กรุณาระบุชื่อผู้ประสานงาน");
        return false;
      }
      const phoneClean = formData.coordinator_phone.replace(/[-\s]/g, "");
      if (!/^0\d{9}$/.test(phoneClean)) {
        setErrorMsg("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักและขึ้นต้นด้วย 0 (เช่น 0812345678)");
        return false;
      }
      if (formData.attendees_count <= 0) {
        setErrorMsg("จำนวนผู้เข้าร่วมต้องมากกว่า 0 คน");
        return false;
      }
      if (formData.attendees_count > maxCapacity) {
        setErrorMsg(`จำนวนผู้เข้าร่วม (${formData.attendees_count} คน) เกินความจุของ${roomName} (${maxCapacity} คน)`);
        return false;
      }
      if (!formData.booking_date) {
        setErrorMsg("กรุณาเลือกวันที่ต้องการจอง");
        return false;
      }

      // Check time range
      const [startH, startM] = formData.start_time.split(":").map(Number);
      const [endH, endM] = formData.end_time.split(":").map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      if (endMins <= startMins) {
        setErrorMsg("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
        return false;
      }
      if (endMins - startMins < 120) {
        setErrorMsg("ระยะเวลาการจองขั้นต่ำต้องไม่น้อยกว่า 2 ชั่วโมง");
        return false;
      }
      if (startMins < 8 * 60 + 30 || endMins > 16 * 60 + 30) {
        setErrorMsg("ช่วงเวลาเปิดให้บริการคือ 08:30 – 16:30 น.");
        return false;
      }
    }

    if (step === 2) {
      if (formData.attendees_count > maxCapacity) {
        setErrorMsg(`จำนวนผู้เข้าร่วม (${formData.attendees_count} คน) เกินความจุของ${roomName} (${maxCapacity} คน)`);
        return false;
      }
    }

    if (step === 3 && formData.wants_lunch) {
      // If wants lunch, at least one lunch item with quantity > 0 must be selected
      const selected = Object.entries(formData.lunch_items).filter(([_, qty]) => qty > 0);
      if (selected.length === 0) {
        setErrorMsg("ท่านเลือกประสงค์อาหารกลางวัน กรุณาเลือกรายการและระบุจำนวนอย่างน้อย 1 รายการ หรือเลือก 'ไม่ประสงค์'");
        return false;
      }
    }

    if (step === 4 && formData.wants_snacks) {
      const selected = Object.entries(formData.snack_items).filter(([_, qty]) => qty > 0);
      if (selected.length === 0) {
        setErrorMsg("ท่านเลือกประสงค์อาหารว่าง กรุณาเลือกรายการและระบุจำนวนอย่างน้อย 1 รายการ หรือเลือก 'ไม่ประสงค์'");
        return false;
      }
    }

    return true;
  };

  const fetchBusy = async (room: string, date: string): Promise<BusyRange[] | null> => {
    try {
      const res = await fetch(`/api/availability?room=${room}&date=${date}`);
      if (!res.ok) return null;
      return ((await res.json()) as any).busy ?? null;
    } catch {
      return null;
    }
  };

  // Shows the clash panel and returns true when the chosen slot is taken.
  // `known` = conflicts already reported by the server (409). Without it the
  // availability API decides; if that API fails we stay open and let the server decide on submit.
  const explainClash = async (known?: BusyRange[]): Promise<boolean> => {
    const start = toEpochSeconds(formData.booking_date, formData.start_time);
    const end = toEpochSeconds(formData.booking_date, formData.end_time);
    const otherId = formData.room_id === "floor7" ? "floor2" : "floor7";
    const [busy, otherBusy] = await Promise.all([
      fetchBusy(formData.room_id, formData.booking_date),
      fetchBusy(otherId, formData.booking_date),
    ]);
    const conflicts = known ?? (busy ? findConflicts(busy, start, end) : []);
    if (conflicts.length === 0) return false;
    const otherCapacity = otherId === "floor7" ? 450 : 250;
    const otherFree = !!otherBusy && findConflicts(otherBusy, start, end).length === 0 && formData.attendees_count <= otherCapacity;
    setClash({
      conflicts,
      slots: busy ? suggestSlots(busy, start, end, formData.booking_date) : [],
      otherRoomId: otherFree ? otherId : null,
    });
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === 1) {
      setIsChecking(true);
      const clashed = await explainClash();
      setIsChecking(false);
      if (clashed) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setClash(null);
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate price summary
  const getSelectedItems = () => {
    const items: { item: FoodItemCatalog; qty: number; subtotal: number }[] = [];
    if (formData.wants_lunch) {
      for (const [code, qty] of Object.entries(formData.lunch_items)) {
        if (qty > 0 && FOOD_CATALOG[code]) {
          const item = FOOD_CATALOG[code];
          items.push({ item, qty, subtotal: item.unitPrice * qty });
        }
      }
    }
    if (formData.wants_snacks) {
      for (const [code, qty] of Object.entries(formData.snack_items)) {
        if (qty > 0 && FOOD_CATALOG[code]) {
          const item = FOOD_CATALOG[code];
          items.push({ item, qty, subtotal: item.unitPrice * qty });
        }
      }
    }
    return items;
  };

  const selectedItemsList = getSelectedItems();
  const totalPrice = selectedItemsList.reduce((sum, i) => sum + i.subtotal, 0);
  const grandTotalPrice = roomDailyFee + totalPrice;

  // Submit to Server
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const startsAt = toEpochSeconds(formData.booking_date, formData.start_time);
    const endsAt = toEpochSeconds(formData.booking_date, formData.end_time);

    const itemsPayload = selectedItemsList.map((i) => ({
      item_code: i.item.code,
      quantity: i.qty,
    }));

    const payload = {
      request_key: formData.request_key,
      room_id: formData.room_id,
      activity_name: formData.activity_name,
      project_name: formData.project_name,
      coordinator_name: formData.coordinator_name,
      coordinator_phone: formData.coordinator_phone,
      coordinator_line_id: formData.coordinator_line_id || undefined,
      meeting_type: formData.meeting_type,
      attendees_count: Number(formData.attendees_count),
      staff_count: Number(formData.staff_count || 0),
      table_layout: formData.table_layout,
      vvip_seats: Number(formData.vvip_seats || 0),
      vip_seats: Number(formData.vip_seats || 0),
      equipment_needed: JSON.stringify({
        items: formData.equipment_items || [],
        other: (formData.equipment_other || "").trim(),
        notes: (formData.equipment_notes || "").trim(),
      }),
      starts_at: startsAt,
      ends_at: endsAt,
      items: itemsPayload,
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        if (res.status === 409) {
          const known = Array.isArray(data.conflicts) && data.conflicts.length > 0 ? data.conflicts : undefined;
          if (await explainClash(known)) {
            setCurrentStep(1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            setErrorMsg(data.error || "ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกเวลาอื่นหรือติดต่อผู้ดูแล");
          }
        } else {
          setErrorMsg(data.error || "เกิดข้อผิดพลาดในการส่งคำขอ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง");
        }
        setIsSubmitting(false);
        return;
      }

      // Success! Clear draft and redirect to success screen
      sessionStorage.setItem("last_booking_success", JSON.stringify(data.booking));
      resetFormData();
      router.push("/book/success");
    } catch (err) {
      console.error(err);
      setErrorMsg("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Wizard Step Bar */}
      <div className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-4 sm:p-6 shadow-[0_16px_48px_rgba(88,44,131,0.06)]">
        <div className="flex items-center justify-between overflow-x-auto pb-2 sm:pb-0 gap-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isDone = currentStep > s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 shrink-0 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] text-white shadow-xs border border-white/20"
                    : isDone
                    ? "text-[#582c83] bg-[#f5f0fa] border border-[#582c83]/15"
                    : "text-[#595963] bg-transparent"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isActive
                      ? "bg-white text-[#582c83] shadow-xs"
                      : isDone
                      ? "bg-[#582c83] text-white"
                      : "bg-[#e6e2ea] text-[#595963]"
                  }`}
                >
                  {s.id}
                </div>
                <span className="hidden md:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-sm animate-in fade-in shadow-2xs"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Booking clash: which slots are taken + free alternatives (times only, no personal data) */}
      {clash && currentStep === 1 && (
        <div role="alert" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-900 text-sm space-y-3">
          <div className="flex items-start gap-3 font-bold">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกวันหรือเวลาอื่น</span>
          </div>
          <ul className="list-disc pl-12 space-y-1">
            {clash.conflicts.slice(0, 3).map((c, i) => (
              <li key={i}>
                {formatRange(c.starts_at, c.ends_at)} ({statusLabel(c.status)})
              </li>
            ))}
          </ul>
          {clash.conflicts.length > 3 && <p className="pl-8">และอีก {clash.conflicts.length - 3} ช่วง</p>}
          {clash.conflicts.some((c) => c.status === "pending") && (
            <p className="pl-8 text-xs">ช่วงที่รออนุมัติอาจว่างหากคำขอถูกปฏิเสธ</p>
          )}
          {(clash.slots.length > 0 || clash.otherRoomId) && (
            <div className="pl-8 space-y-2">
              <p className="font-bold">ตัวเลือกที่ว่าง (กดเพื่อเติมในฟอร์ม):</p>
              <div className="flex flex-wrap gap-2">
                {clash.slots.map((s) => (
                  <button
                    key={s.starts_at}
                    type="button"
                    onClick={() => {
                      updateFormData({ start_time: toBangkokTime(s.starts_at), end_time: toBangkokTime(s.ends_at) });
                      setClash(null);
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 font-bold text-xs touch-target transition-colors"
                  >
                    {toBangkokTime(s.starts_at)} – {toBangkokTime(s.ends_at)} น.
                  </button>
                ))}
                {clash.otherRoomId && (
                  <button
                    type="button"
                    onClick={() => {
                      updateFormData({ room_id: clash.otherRoomId! });
                      setClash(null);
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 font-bold text-xs touch-target transition-colors"
                  >
                    เวลาเดิมใน{clash.otherRoomId === "floor7" ? "ห้องประชุมชั้น 7" : "หอประชุมชั้น 2"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Step Body */}
      <div className="bg-white/88 backdrop-blur-2xl rounded-3xl border border-white/80 p-6 sm:p-9 shadow-[0_16px_48px_rgba(88,44,131,0.06)] space-y-6">
        {/* ============================================================ */}
        {/* STEP 1: ข้อมูลกิจกรรม */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1e1e24] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                หน้า 1: ข้อมูลกิจกรรมและวันเวลา
              </h2>
              <p className="text-xs sm:text-sm text-[#595963] mt-1 font-medium">
                กรุณาระบุรายละเอียดกิจกรรม ข้อมูลผู้ประสานงาน และช่วงเวลาที่ต้องการจอง
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  ชื่อกิจกรรม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น การสัมมนาเชิงปฏิบัติการการใช้เทคโนโลยี AI"
                  value={formData.activity_name}
                  onChange={(e) => updateFormData({ activity_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  ชื่อโครงการ/กิจกรรมหลัก <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น โครงการพัฒนาบุคลากรสายวิชาการ ประจำปีงบประมาณ 2569"
                  value={formData.project_name}
                  onChange={(e) => updateFormData({ project_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  ผู้ประสานงาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ชื่อ - นามสกุล"
                  value={formData.coordinator_name}
                  onChange={(e) => updateFormData({ coordinator_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  เบอร์โทรศัพท์ (10 หลัก) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="0812345678"
                  value={formData.coordinator_phone}
                  onChange={(e) => updateFormData({ coordinator_phone: e.target.value.replace(/\D/g, "") })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">LINE ID (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="LINE ID สำหรับการติดต่อ"
                  value={formData.coordinator_line_id}
                  onChange={(e) => updateFormData({ coordinator_line_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] focus:border-transparent text-sm touch-target shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  ลักษณะการประชุม <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.meeting_type === "small_group" ? "seminar" : formData.meeting_type}
                  onChange={(e) => updateFormData({ meeting_type: e.target.value as MeetingType })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target font-medium shadow-2xs"
                >
                  <option value="seminar">อบรมสัมมนาทั่วไป</option>
                  <option value="wedding">จัดเลี้ยงและงานแต่งงาน</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  ห้องประชุมที่ต้องการจอง <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.room_id}
                  onChange={(e) => updateFormData({ room_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target font-medium shadow-2xs"
                >
                  <option value="floor2">หอประชุมชั้น 2 (ความจุสูงสุด 250 คน)</option>
                  <option value="floor7">ห้องประชุมชั้น 7 (ความจุสูงสุด 450 คน)</option>
                </select>
              </div>

              {/* อัตราค่าบริการรายวันและเงินประกัน */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-[#faf7fd] via-[#f5f0fa] to-white border border-[#582c83]/20 shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6e2ea] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#582c83] text-white">
                      อัตราค่าบริการ
                    </span>
                    <span className="text-xs font-semibold text-[#582c83]">
                      {roomName} • {roomFeeInfo?.categoryLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#595963] font-medium">
                    คำนวณตามประเภทงานที่เลือก
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs text-[#595963] font-medium">ค่าห้องจ่ายรายวัน:</span>
                    <p className="text-lg font-black text-[#1e1e24]">
                      {roomDailyFee.toLocaleString()} <span className="text-xs font-bold text-[#595963]">บาท/วัน</span>
                    </p>
                  </div>
                  <div className="space-y-0.5 sm:text-right">
                    <span className="text-xs text-amber-900 font-medium">เงินประกันการจองห้อง (50%):</span>
                    <p className="text-lg font-black text-amber-700">
                      {roomDeposit.toLocaleString()} <span className="text-xs font-bold text-amber-800">บาท</span>
                    </p>
                    <p className="text-[11px] text-[#8c8c96] font-normal">*วางเงินประกันการจองห้องครึ่งนึงของค่าห้อง</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  จำนวนผู้เข้าร่วม (คน) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxCapacity}
                  value={formData.attendees_count}
                  onChange={(e) => updateFormData({ attendees_count: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                />
                <p className="text-xs text-[#595963]">ตรวจความจุสูงสุดเทียบกับจำนวนนี้ (ไม่เกิน {maxCapacity} คน)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">จำนวนเจ้าหน้าที่/ผู้จัดงาน (คน)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.staff_count}
                  onChange={(e) => updateFormData({ staff_count: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                />
                <p className="text-xs text-[#595963]">(ไม่นำมาคำนวณเปรียบเทียบกับความจุห้อง)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  วันที่ต้องการจอง <span className="text-red-500">*</span>
                </label>
                <ThaiDatePicker
                  value={formData.booking_date}
                  onChange={(dateStr) => updateFormData({ booking_date: dateStr })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                    เวลาเริ่มต้น <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    min="08:30"
                    max="16:30"
                    step="1800"
                    value={formData.start_time}
                    onChange={(e) => updateFormData({ start_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                    เวลาสิ้นสุด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    min="08:30"
                    max="16:30"
                    step="1800"
                    value={formData.end_time}
                    onChange={(e) => updateFormData({ end_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                  />
                </div>
                <p className="col-span-2 text-xs text-[#582c83] font-semibold">
                  เปิดให้บริการ 08:30 – 16:30 น. (จองล่วงหน้าได้ไม่เกิน 30 วัน) *วางเงินประกันการจองห้องครึ่งนึงของค่าห้อง
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: สถานที่และรูปแบบโต๊ะ */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1e1e24]">หน้า 2: รูปแบบการจัดโต๊ะและที่นั่งพิเศษ</h2>
              <p className="text-xs sm:text-sm text-[#595963] mt-1 font-medium">
                เลือกรูปแบบการจัดเก้าอี้และโต๊ะสำหรับ {roomName} (ความจุสูงสุด {maxCapacity} คน)
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                รูปแบบโต๊ะและเก้าอี้ <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "theater", name: "Theater (โรงละคร)", desc: "แถวเก้าอี้หันหน้าสู่เวที เหมาะกับผู้ฟังจำนวนมาก" },
                  { id: "classroom", name: "Classroom (ห้องเรียน)", desc: "โต๊ะพร้อมเก้าอี้ เหมาะกับการอบรมและจดบันทึก" },
                  { id: "cluster", name: "Cluster / Banquet (โต๊ะกลม)", desc: "โต๊ะกลุ่ม เหมาะกับการระดมสมองและรับประทานอาหาร" },
                  { id: "ushape", name: "U-Shape (ตัวยู)", desc: "จัดโต๊ะเป็นรูปตัวยู เหมาะกับการประชุมสัมมนาเชิงสนทนา" },
                  { id: "boardroom", name: "Boardroom (โต๊ะประชุมยาว)", desc: "โต๊ะกลางยาว เหมาะกับการประชุมผู้บริหาร" },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.table_layout === item.id
                        ? "border-[#582c83] bg-[#f5f0fa] ring-2 ring-[#582c83] shadow-xs"
                        : "border-[#e6e2ea] bg-white hover:bg-[#faf7fd]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1e1e24]">{item.name}</span>
                      <input
                        type="radio"
                        name="table_layout"
                        value={item.id}
                        checked={formData.table_layout === item.id}
                        onChange={() => updateFormData({ table_layout: item.id as TableLayout })}
                        className="text-[#582c83] focus:ring-[#582c83]"
                      />
                    </div>
                    <p className="text-xs text-[#595963] mt-2">{item.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#e6e2ea]">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">จำนวนที่นั่ง VVIP</label>
                <input
                  type="number"
                  min={0}
                  value={formData.vvip_seats}
                  onChange={(e) => updateFormData({ vvip_seats: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                />
                <p className="text-xs text-[#595963]">แถวหน้าสุดสำหรับแขกคนสำคัญระดับประธาน</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">จำนวนที่นั่ง VIP</label>
                <input
                  type="number"
                  min={0}
                  value={formData.vip_seats}
                  onChange={(e) => updateFormData({ vip_seats: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                />
                <p className="text-xs text-[#595963]">แถวถัดมาสำหรับผู้บริหารหรือวิทยากร</p>
              </div>
            </div>

            {/* Equipment and Extra Notes */}
            <div className="pt-5 border-t border-[#e6e2ea] space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24] block">
                  อุปกรณ์และสิ่งอำนวยความสะดวกที่ต้องการใช้งาน
                </label>
                <p className="text-xs text-[#595963] mt-0.5">
                  เลือกอุปกรณ์พื้นฐานที่ต้องการให้เจ้าหน้าที่จัดเตรียมไว้ล่วงหน้า (เลือกได้มากกว่า 1 รายการ)
                </p>
              </div>

              {/* Checkbox 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: "projector", label: "โปรเจ็คเตอร์ (Projector)" },
                  { id: "microphone", label: "ไมโครโฟน (Microphone)" },
                  { id: "sound_system", label: "เครื่องเสียง (Sound System)" },
                  { id: "computer", label: "คอมพิวเตอร์ (Computer)" },
                  { id: "wifi", label: "Wi-Fi อินเทอร์เน็ต" },
                ].map((item) => {
                  const checked = (formData.equipment_items || []).includes(item.label);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all touch-target ${
                        checked
                          ? "border-[#582c83] bg-[#f5f0fa] text-[#582c83] font-semibold"
                          : "border-[#e6e2ea] bg-white text-[#1e1e24] hover:bg-[#faf7fd]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = formData.equipment_items || [];
                          const updated = e.target.checked
                            ? [...current, item.label]
                            : current.filter((x) => x !== item.label);
                          updateFormData({ equipment_items: updated });
                        }}
                        className="w-4 h-4 rounded text-[#582c83] focus:ring-[#582c83] border-[#e6e2ea]"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Other Equipment */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  ระบุอุปกรณ์อื่นๆ เพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="เช่น สายต่อ HDMI, พอยเตอร์เลเซอร์, ขาตั้งไมค์เพิ่มเติม"
                  value={formData.equipment_other || ""}
                  onChange={(e) => updateFormData({ equipment_other: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-[#1e1e24]">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุข้อความหรือคำขอพิเศษเพิ่มเติมสำหรับการจัดเตรียมสถานที่"
                  value={formData.equipment_notes || ""}
                  onChange={(e) => updateFormData({ equipment_notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: อาหารกลางวัน */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1e1e24]">หน้า 3: อาหารกลางวัน</h2>
              <p className="text-xs sm:text-sm text-[#595963] mt-1 font-medium">
                เลือก &ldquo;ไม่ประสงค์&rdquo; หรือ &ldquo;ประสงค์&rdquo; (ราคาทั้งหมดรวม VAT แล้ว สามารถเลือกได้หลายรายการพร้อมกัน)
              </p>
            </div>

            {/* Toggle */}
            <div className="flex gap-4">
              <label className={`flex-1 p-4 rounded-2xl border cursor-pointer text-center font-bold text-sm touch-target flex items-center justify-center gap-2 transition-all ${
                !formData.wants_lunch
                  ? "bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] text-white border-transparent shadow-xs"
                  : "bg-white text-[#1e1e24] border-[#e6e2ea] hover:bg-[#faf7fd]"
              }`}>
                <input
                  type="radio"
                  name="wants_lunch"
                  checked={!formData.wants_lunch}
                  onChange={() => updateFormData({ wants_lunch: false })}
                  className="sr-only"
                />
                ไม่ประสงค์อาหารกลางวัน
              </label>

              <label className={`flex-1 p-4 rounded-2xl border cursor-pointer text-center font-bold text-sm touch-target flex items-center justify-center gap-2 transition-all ${
                formData.wants_lunch
                  ? "bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] text-white border-transparent shadow-xs"
                  : "bg-white text-[#1e1e24] border-[#e6e2ea] hover:bg-[#faf7fd]"
              }`}>
                <input
                  type="radio"
                  name="wants_lunch"
                  checked={formData.wants_lunch}
                  onChange={() => updateFormData({ wants_lunch: true })}
                  className="sr-only"
                />
                ประสงค์อาหารกลางวัน
              </label>
            </div>

            {formData.wants_lunch && (
              <div className="space-y-4 pt-4 border-t border-[#e6e2ea]">
                <p className="text-xs font-bold text-[#582c83]">
                  เลือกรายการอาหารกลางวันที่ต้องการและระบุจำนวน:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    "lunch_set",
                    "buffet150",
                    "buffet200",
                    "boxed",
                    "chinese_table",
                    "food_booth",
                  ].map((code) => {
                    const item = FOOD_CATALOG[code];
                    const currentQty = formData.lunch_items[code] || 0;

                    return (
                      <div
                        key={code}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          currentQty > 0
                            ? "border-[#582c83] bg-[#f5f0fa]/60 shadow-2xs"
                            : "border-[#e6e2ea] bg-white hover:bg-[#faf7fd]"
                        }`}
                      >
                        <div className="flex-1">
                          <span className="font-bold text-sm text-[#1e1e24]">{item.name}</span>
                          <div className="text-xs text-[#595963] mt-1">
                            ราคา: <strong className="text-[#582c83] font-bold">{item.unitPrice.toLocaleString()} บาท</strong> / {item.unit}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <label className="text-xs text-[#595963]">จำนวน ({item.unit}):</label>
                          <input
                            type="number"
                            min={0}
                            value={currentQty}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              updateFormData({
                                lunch_items: {
                                  ...formData.lunch_items,
                                  [code]: val,
                                },
                              });
                            }}
                            className="w-24 px-3 py-1.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] text-sm text-center touch-target focus:outline-none focus:ring-2 focus:ring-[#582c83] font-bold shadow-2xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: อาหารว่างและเครื่องดื่ม */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1e1e24]">หน้า 4: อาหารว่างและเครื่องดื่ม</h2>
              <p className="text-xs sm:text-sm text-[#595963] mt-1 font-medium">
                เลือก &ldquo;ไม่ประสงค์&rdquo; หรือ &ldquo;ประสงค์&rdquo; (ราคารวม VAT แล้ว สามารถเลือกได้หลายรายการพร้อมกัน)
              </p>
            </div>

            {/* University policy disclaimer note */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed font-medium">
              ⚠️ หมายเหตุ: &ldquo;มหาวิทยาลัยไม่อนุญาตให้นำอาหารและเครื่องดื่มจากภายนอกเข้ามารับประทานในหอประชุมโดยไม่ได้รับอนุญาต ทั้งสำหรับมหาวิทยาลัยและหน่วยงานภายนอก&rdquo;
            </div>

            {/* Toggle */}
            <div className="flex gap-4">
              <label className={`flex-1 p-4 rounded-2xl border cursor-pointer text-center font-bold text-sm touch-target flex items-center justify-center gap-2 transition-all ${
                !formData.wants_snacks
                  ? "bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] text-white border-transparent shadow-xs"
                  : "bg-white text-[#1e1e24] border-[#e6e2ea] hover:bg-[#faf7fd]"
              }`}>
                <input
                  type="radio"
                  name="wants_snacks"
                  checked={!formData.wants_snacks}
                  onChange={() => updateFormData({ wants_snacks: false })}
                  className="sr-only"
                />
                ไม่ประสงค์อาหารว่าง
              </label>

              <label className={`flex-1 p-4 rounded-2xl border cursor-pointer text-center font-bold text-sm touch-target flex items-center justify-center gap-2 transition-all ${
                formData.wants_snacks
                  ? "bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] text-white border-transparent shadow-xs"
                  : "bg-white text-[#1e1e24] border-[#e6e2ea] hover:bg-[#faf7fd]"
              }`}>
                <input
                  type="radio"
                  name="wants_snacks"
                  checked={formData.wants_snacks}
                  onChange={() => updateFormData({ wants_snacks: true })}
                  className="sr-only"
                />
                ประสงค์อาหารว่างและเครื่องดื่ม
              </label>
            </div>

            {formData.wants_snacks && (
              <div className="space-y-4 pt-4 border-t border-[#e6e2ea]">
                <p className="text-xs font-bold text-[#582c83]">
                  เลือกรายการของว่างและเครื่องดื่มที่ต้องการ:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    "tea1",
                    "tea2",
                    "water350",
                    "water600",
                    "juice",
                    "afternoon_tea",
                  ].map((code) => {
                    const item = FOOD_CATALOG[code];
                    const currentQty = formData.snack_items[code] || 0;

                    return (
                      <div
                        key={code}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          currentQty > 0
                            ? "border-[#582c83] bg-[#f5f0fa]/60 shadow-2xs"
                            : "border-[#e6e2ea] bg-white hover:bg-[#faf7fd]"
                        }`}
                      >
                        <div className="flex-1">
                          <span className="font-bold text-sm text-[#1e1e24]">{item.name}</span>
                          <div className="text-xs text-[#595963] mt-1">
                            ราคา: <strong className="text-[#582c83] font-bold">{item.unitPrice.toLocaleString()} บาท</strong> / {item.unit}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <label className="text-xs text-[#595963]">จำนวน ({item.unit}):</label>
                          <input
                            type="number"
                            min={0}
                            value={currentQty}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              updateFormData({
                                snack_items: {
                                  ...formData.snack_items,
                                  [code]: val,
                                },
                              });
                            }}
                            className="w-24 px-3 py-1.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] text-sm text-center touch-target focus:outline-none focus:ring-2 focus:ring-[#582c83] font-bold shadow-2xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 5: สรุปและยืนยันการจอง */}
        {/* ============================================================ */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1e1e24]">หน้า 5: สรุปข้อมูลและยืนยันคำขอจอง</h2>
              <p className="text-xs sm:text-sm text-[#595963] mt-1 font-medium">
                กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนกดส่งคำขอ (ราคาทั้งหมดคำนวณและตรวจสอบที่เซิร์ฟเวอร์)
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#faf7fd] border border-[#e6e2ea] space-y-2">
                <span className="text-xs font-bold text-[#582c83]">ข้อมูลกิจกรรม</span>
                <p className="text-sm font-bold text-[#1e1e24]">{formData.activity_name}</p>
                <p className="text-xs text-[#595963]">โครงการ: {formData.project_name}</p>
                <p className="text-xs text-[#595963]">ลักษณะงาน: {formData.meeting_type === "wedding" ? "จัดเลี้ยงและงานแต่งงาน" : "อบรมสัมมนาทั่วไป"}</p>
                <p className="text-xs text-[#595963]">ผู้ประสานงาน: {formData.coordinator_name} (โทร {formData.coordinator_phone})</p>
                {formData.coordinator_line_id && (
                  <p className="text-xs text-[#595963]">LINE: {formData.coordinator_line_id}</p>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-[#faf7fd] border border-[#e6e2ea] space-y-2">
                <span className="text-xs font-bold text-[#582c83]">ห้องและช่วงเวลา</span>
                <p className="text-sm font-bold text-[#1e1e24]">{roomName}</p>
                <p className="text-xs text-[#595963]">วันที่: <span className="font-semibold text-[#1e1e24]">{formatThaiDateString(formData.booking_date)}</span></p>
                <p className="text-xs text-[#595963]">เวลา: {formData.start_time} – {formData.end_time} น.</p>
                <p className="text-xs text-[#595963]">ผู้เข้าร่วม: {formData.attendees_count} คน (เจ้าหน้าที่ {formData.staff_count} คน)</p>
                <p className="text-xs text-[#595963]">ผังโต๊ะ: {formData.table_layout} | VVIP: {formData.vvip_seats} | VIP: {formData.vip_seats}</p>
                {((formData.equipment_items && formData.equipment_items.length > 0) || formData.equipment_other || formData.equipment_notes) && (
                  <div className="pt-2 border-t border-[#e6e2ea]/60 space-y-1">
                    <span className="text-[11px] font-bold text-[#582c83]">อุปกรณ์และหมายเหตุ:</span>
                    {formData.equipment_items && formData.equipment_items.length > 0 && (
                      <p className="text-xs text-[#1e1e24]">• {formData.equipment_items.join(", ")}</p>
                    )}
                    {formData.equipment_other && (
                      <p className="text-xs text-[#595963]">อื่นๆ: {formData.equipment_other}</p>
                    )}
                    {formData.equipment_notes && (
                      <p className="text-xs text-[#595963]">หมายเหตุ: {formData.equipment_notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="space-y-3 pt-2">
              <span className="text-sm font-bold text-[#1e1e24]">สรุปประมาณการค่าใช้จ่าย</span>
              <div className="border border-[#e6e2ea] rounded-2xl overflow-hidden text-sm bg-white shadow-2xs">
                <div className="p-4 bg-[#faf7fd] border-b border-[#e6e2ea] space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                    <span className="text-[#1e1e24]">
                      ค่าบำรุงสถานที่/ค่าห้อง ({roomName} • {roomFeeInfo?.categoryLabel})
                    </span>
                    <span className="font-bold text-[#1e1e24]">{roomDailyFee.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                    <span className="text-[#595963]">
                      ค่าอาหารและเครื่องดื่ม ({selectedItemsList.length} รายการ)
                    </span>
                    <span className="font-bold text-[#1e1e24]">{totalPrice.toLocaleString()} บาท</span>
                  </div>
                  <div className="pt-2 border-t border-[#e6e2ea] flex items-center justify-between font-black text-base">
                    <span className="text-[#1e1e24]">ยอดรวมทั้งสิ้น (รวม VAT):</span>
                    <span className="text-[#582c83] text-lg">{grandTotalPrice.toLocaleString()} บาท</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      เงินประกันการจองห้อง (50% ของค่าห้อง):
                    </span>
                    <p className="text-[11px] text-amber-800/80">
                      *วางเงินประกันการจองห้องครึ่งนึงของค่าห้องเพื่อยืนยันสิทธิ์การใช้งาน
                    </p>
                  </div>
                  <span className="text-base font-black text-amber-900 sm:text-right">
                    {roomDeposit.toLocaleString()} บาท
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Food Breakdown */}
            {selectedItemsList.length > 0 ? (
              <div className="space-y-3 pt-2">
                <span className="text-sm font-bold text-[#1e1e24]">รายละเอียดอาหารและเครื่องดื่มที่เลือก</span>
                <div className="border border-[#e6e2ea] rounded-2xl overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-[#f5f0fa] text-[#582c83] text-xs font-bold border-b border-[#e6e2ea]">
                      <tr>
                        <th className="py-2.5 px-4">รายการ</th>
                        <th className="py-2.5 px-4 text-center">จำนวน</th>
                        <th className="py-2.5 px-4 text-right">ราคาต่อหน่วย</th>
                        <th className="py-2.5 px-4 text-right">รวม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e2ea]">
                      {selectedItemsList.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-medium text-[#1e1e24]">{i.item.name}</td>
                          <td className="py-2.5 px-4 text-center text-[#595963]">{i.qty} {i.item.unit}</td>
                          <td className="py-2.5 px-4 text-right text-[#595963]">{i.item.unitPrice.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-[#1e1e24]">{i.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#faf8fd] border-t border-[#e6e2ea] font-bold text-sm">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-right text-[#1e1e24]">รวมค่าอาหารและเครื่องดื่ม:</td>
                        <td className="py-3 px-4 text-right text-[#582c83] font-bold">{totalPrice.toLocaleString()} บาท</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#faf7fd] border border-[#e6e2ea] text-xs text-[#595963] text-center">
                ไม่ประสงค์อาหารและเครื่องดื่ม
              </div>
            )}
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#e6e2ea] mt-8 gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] hover:bg-gray-50 font-bold text-sm touch-target transition-all disabled:opacity-50 shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              ย้อนกลับ
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isChecking}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] hover:from-violet-700 hover:to-[#381a54] text-white font-bold text-sm touch-target shadow-xs border border-white/20 transition-all ml-auto active:scale-95 disabled:opacity-50"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  ถัดไป
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] hover:from-violet-700 hover:to-[#381a54] text-white font-black text-base touch-target shadow-md border border-white/20 transition-all ml-auto active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังส่งคำขอจอง...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  ยืนยันและส่งคำขอจอง
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
