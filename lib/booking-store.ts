"use client";

import { useEffect, useState } from "react";
import { CreateBookingPayload, FoodItemCatalog, FOOD_CATALOG, TableLayout, MeetingType } from "./types";

export interface BookingFormData {
  request_key: string;
  // Step 1
  activity_name: string;
  project_name: string;
  coordinator_name: string;
  coordinator_phone: string;
  coordinator_line_id: string;
  meeting_type: MeetingType;
  attendees_count: number;
  staff_count: number;
  room_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:mm
  end_time: string;     // HH:mm

  // Step 2
  table_layout: TableLayout;
  vvip_seats: number;
  vip_seats: number;
  equipment_items: string[];
  equipment_quantities?: Record<string, number>;
  equipment_other: string;
  equipment_notes: string;

  // Step 3 (Lunch)
  wants_lunch: boolean;
  lunch_items: Record<string, number>;

  // Step 4 (Snacks)
  wants_snacks: boolean;
  snack_items: Record<string, number>;
}

const STORAGE_KEY = "suan_dusit_booking_draft_v1";

export function getDefaultFormData(): BookingFormData {
  // Generate random UUID for request_key
  const reqKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return {
    request_key: reqKey,
    activity_name: "",
    project_name: "",
    coordinator_name: "",
    coordinator_phone: "",
    coordinator_line_id: "",
    meeting_type: "seminar",
    attendees_count: 50,
    staff_count: 5,
    room_id: "floor2",
    booking_date: tomorrowStr,
    start_time: "09:00",
    end_time: "12:00",
    table_layout: "theater",
    vvip_seats: 0,
    vip_seats: 0,
    equipment_items: [],
    equipment_quantities: { projector: 1, microphone: 1, computer: 1 },
    equipment_other: "",
    equipment_notes: "",
    wants_lunch: false,
    lunch_items: {},
    wants_snacks: false,
    snack_items: {},
  };
}

export function useBookingStore() {
  const [formData, setFormData] = useState<BookingFormData>(getDefaultFormData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData({
          ...getDefaultFormData(),
          ...parsed,
          equipment_quantities: {
            ...getDefaultFormData().equipment_quantities,
            ...(parsed.equipment_quantities || {}),
          },
        });
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const updateFormData = (patch: Partial<BookingFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetFormData = () => {
    const fresh = getDefaultFormData();
    setFormData(fresh);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return {
    formData,
    updateFormData,
    resetFormData,
    isLoaded,
  };
}

// Convert form date and time to Bangkok UTC epoch seconds
export function toEpochSeconds(dateStr: string, timeStr: string): number {
  // Asia/Bangkok is UTC+7
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  // UTC time = Bangkok time - 7 hours
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0));
  return Math.floor(utcDate.getTime() / 1000);
}

export interface EquipmentOption {
  id: string;
  name: string;
  label: string;
  hasQty: boolean;
}

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { id: "projector", name: "โปรเจ็คเตอร์", label: "โปรเจ็คเตอร์ (Projector)", hasQty: true },
  { id: "microphone", name: "ไมโครโฟน", label: "ไมโครโฟน (Microphone)", hasQty: true },
  { id: "sound_system", name: "เครื่องเสียง", label: "เครื่องเสียง (Sound System)", hasQty: false },
  { id: "computer", name: "คอมพิวเตอร์", label: "คอมพิวเตอร์ (Computer)", hasQty: true },
  { id: "wifi", name: "Wi-Fi", label: "Wi-Fi อินเทอร์เน็ต", hasQty: false },
];

export function formatEquipmentItems(
  items: string[],
  quantities?: Record<string, number>
): string[] {
  return (items || []).map((val) => {
    const opt = EQUIPMENT_OPTIONS.find(
      (o) => o.id === val || o.label === val || o.name === val || val.startsWith(o.name)
    );
    if (!opt) return val;
    if (opt.hasQty) {
      const qty = Math.max(1, quantities?.[opt.id] ?? 1);
      return `${opt.name} (${qty})`;
    }
    return opt.name;
  });
}
