"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore, toEpochSeconds } from "@/lib/booking-store";
import { FOOD_CATALOG, FoodItemCatalog, TableLayout, MeetingType } from "@/lib/types";
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#582c83]" />
      </div>
    );
  }

  // Room capacities: floor2 = 100, floor7 = 300
  const maxCapacity = formData.room_id === "floor7" ? 300 : 100;
  const roomName = formData.room_id === "floor7" ? "ห้องประชุมชั้น 7" : "หอประชุมชั้น 2";

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

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
          setErrorMsg(data.error || "ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกเวลาอื่นหรือติดต่อผู้ดูแล");
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
                  value={formData.meeting_type}
                  onChange={(e) => updateFormData({ meeting_type: e.target.value as MeetingType })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target font-medium shadow-2xs"
                >
                  <option value="seminar">ประชุมสัมมนา</option>
                  <option value="small_group">ประชุมกลุ่มย่อย</option>
                  <option value="wedding">งานแต่งงาน/งานฉลองยินดี</option>
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
                  <option value="floor2">หอประชุมชั้น 2 (ความจุสูงสุด 100 คน)</option>
                  <option value="floor7">ห้องประชุมชั้น 7 (ความจุสูงสุด 300 คน)</option>
                </select>
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
                <input
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => updateFormData({ booking_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#e6e2ea] bg-white text-[#1e1e24] placeholder:text-[#a1a1aa] focus:outline-none focus:ring-2 focus:ring-[#582c83] text-sm touch-target shadow-2xs"
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
                  เปิดให้บริการ 08:30 – 16:30 น. (ขั้นต่ำ 2 ชั่วโมง จองล่วงหน้าได้ไม่เกิน 60 วัน)
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
                <p className="text-xs text-[#595963]">ลักษณะงาน: {formData.meeting_type === "wedding" ? "งานแต่งงาน/ฉลองยินดี" : formData.meeting_type === "small_group" ? "ประชุมกลุ่มย่อย" : "ประชุมสัมมนา"}</p>
                <p className="text-xs text-[#595963]">ผู้ประสานงาน: {formData.coordinator_name} (โทร {formData.coordinator_phone})</p>
                {formData.coordinator_line_id && (
                  <p className="text-xs text-[#595963]">LINE: {formData.coordinator_line_id}</p>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-[#faf7fd] border border-[#e6e2ea] space-y-2">
                <span className="text-xs font-bold text-[#582c83]">ห้องและช่วงเวลา</span>
                <p className="text-sm font-bold text-[#1e1e24]">{roomName}</p>
                <p className="text-xs text-[#595963]">วันที่: {formData.booking_date}</p>
                <p className="text-xs text-[#595963]">เวลา: {formData.start_time} – {formData.end_time} น.</p>
                <p className="text-xs text-[#595963]">ผู้เข้าร่วม: {formData.attendees_count} คน (เจ้าหน้าที่ {formData.staff_count} คน)</p>
                <p className="text-xs text-[#595963]">ผังโต๊ะ: {formData.table_layout} | VVIP: {formData.vvip_seats} | VIP: {formData.vip_seats}</p>
              </div>
            </div>

            {/* Itemized Price Breakdown */}
            <div className="space-y-3 pt-2">
              <span className="text-sm font-bold text-[#1e1e24]">รายการอาหารและเครื่องดื่มที่เลือก</span>
              {selectedItemsList.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#faf7fd] border border-[#e6e2ea] text-xs text-[#595963] text-center">
                  ไม่ประสงค์อาหารและเครื่องดื่ม
                </div>
              ) : (
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
                    <tfoot className="bg-[#faf8fd] border-t border-[#e6e2ea] font-bold text-base">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-right text-[#1e1e24]">ยอดรวมทั้งสิ้น (รวม VAT):</td>
                        <td className="py-3 px-4 text-right text-[#582c83] font-black">{totalPrice.toLocaleString()} บาท</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
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
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-[#582c83] to-[#48236b] hover:from-violet-700 hover:to-[#381a54] text-white font-bold text-sm touch-target shadow-xs border border-white/20 transition-all ml-auto active:scale-95"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4" />
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
