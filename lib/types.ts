export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type MeetingType = 'seminar' | 'small_group' | 'wedding';

export type TableLayout = 'theater' | 'classroom' | 'cluster' | 'ushape' | 'boardroom';

export interface Room {
  id: string;
  name: string;
  capacity_max: number;
  created_at: number;
}

export interface FoodItemCatalog {
  code: string;
  name: string;
  category: 'lunch' | 'snack';
  unit: string;
  unitPrice: number;
  description?: string;
}

export const FOOD_CATALOG: Record<string, FoodItemCatalog> = {
  lunch_set: {
    code: 'lunch_set',
    name: 'ชุดสำหรับ 1 ท่าน (ข้าว + อาหาร 3 อย่าง + ผลไม้/ของหวาน)',
    category: 'lunch',
    unit: 'ท่าน',
    unitPrice: 150,
  },
  buffet150: {
    code: 'buffet150',
    name: 'บุฟเฟ่ต์ 150 (ข้าว + อาหาร 3 อย่าง + ผลไม้ + ของหวาน)',
    category: 'lunch',
    unit: 'ท่าน',
    unitPrice: 150,
  },
  buffet200: {
    code: 'buffet200',
    name: 'บุฟเฟ่ต์ 200 (รายการบุฟเฟ่ต์ 150 + น้ำพริก + เครื่องเคียง)',
    category: 'lunch',
    unit: 'ท่าน',
    unitPrice: 200,
  },
  boxed: {
    code: 'boxed',
    name: 'อาหารกล่อง (ข้าว + อาหาร 2 อย่าง + ผลไม้/ขนม)',
    category: 'lunch',
    unit: 'ชุด',
    unitPrice: 80,
  },
  chinese_table: {
    code: 'chinese_table',
    name: 'โต๊ะจีน (8 ที่นั่ง/โต๊ะ)',
    category: 'lunch',
    unit: 'โต๊ะ',
    unitPrice: 1800,
  },
  food_booth: {
    code: 'food_booth',
    name: 'บูธอาหารจานเดียว (50 ชุด/บูธ)',
    category: 'lunch',
    unit: 'บูธ',
    unitPrice: 4000,
  },
  tea1: {
    code: 'tea1',
    name: 'ชา/กาแฟ/เครื่องดื่มร้อน + อาหารว่าง 1 อย่าง',
    category: 'snack',
    unit: 'ชุด',
    unitPrice: 50,
  },
  tea2: {
    code: 'tea2',
    name: 'ชา/กาแฟ/เครื่องดื่มร้อน + อาหารว่าง 2 อย่าง',
    category: 'snack',
    unit: 'ชุด',
    unitPrice: 60,
  },
  water350: {
    code: 'water350',
    name: 'น้ำเปล่า 350 mL',
    category: 'snack',
    unit: 'ขวด',
    unitPrice: 5,
  },
  water600: {
    code: 'water600',
    name: 'น้ำเปล่า 600 mL',
    category: 'snack',
    unit: 'ขวด',
    unitPrice: 5,
  },
  juice: {
    code: 'juice',
    name: 'น้ำผลไม้',
    category: 'snack',
    unit: 'ชุด',
    unitPrice: 40,
  },
  afternoon_tea: {
    code: 'afternoon_tea',
    name: 'Afternoon Tea',
    category: 'snack',
    unit: 'ชุด',
    unitPrice: 600,
  },
};

export interface RoomFeeInfo {
  dailyRate: number;
  deposit: number;
  categoryLabel: string;
}

export const ROOM_FEE_CATALOG: Record<string, Record<MeetingType, RoomFeeInfo>> = {
  floor2: {
    seminar: { dailyRate: 15000, deposit: 7500, categoryLabel: 'อบรมสัมมนาทั่วไป' },
    small_group: { dailyRate: 15000, deposit: 7500, categoryLabel: 'อบรมสัมมนาทั่วไป' },
    wedding: { dailyRate: 20000, deposit: 10000, categoryLabel: 'จัดเลี้ยงและงานแต่งงาน' },
  },
  floor7: {
    seminar: { dailyRate: 30000, deposit: 15000, categoryLabel: 'อบรมสัมมนาทั่วไป' },
    small_group: { dailyRate: 30000, deposit: 15000, categoryLabel: 'อบรมสัมมนาทั่วไป' },
    wedding: { dailyRate: 35000, deposit: 17500, categoryLabel: 'จัดเลี้ยงและงานแต่งงาน' },
  },
};

export function getRoomFee(roomId: string, meetingType: MeetingType): RoomFeeInfo | undefined {
  return ROOM_FEE_CATALOG[roomId]?.[meetingType];
}

export interface EquipmentSelection {
  items: string[];
  other?: string;
  notes?: string;
}

export interface BookingInputItem {
  item_code: string;
  quantity: number;
}

export interface CreateBookingPayload {
  request_key: string;
  room_id: string;
  activity_name: string;
  project_name: string;
  coordinator_name: string;
  coordinator_phone: string;
  coordinator_line_id?: string;
  meeting_type: MeetingType;
  attendees_count: number;
  staff_count: number;
  table_layout: TableLayout;
  vvip_seats: number;
  vip_seats: number;
  equipment_needed?: string;
  starts_at: number; // UTC epoch seconds
  ends_at: number;   // UTC epoch seconds
  items: BookingInputItem[];
}

export interface BookingRecord {
  id: string;
  request_key: string;
  booking_code: string;
  room_id: string;
  activity_name: string;
  project_name: string;
  coordinator_name: string;
  coordinator_phone: string;
  coordinator_line_id: string | null;
  meeting_type: MeetingType;
  attendees_count: number;
  staff_count: number;
  table_layout: TableLayout;
  vvip_seats: number;
  vip_seats: number;
  equipment_needed?: string | null;
  starts_at: number;
  ends_at: number;
  status: BookingStatus;
  total_price_thb: number;
  room_fee_thb?: number;
  deposit_thb?: number;
  created_at: number;
  updated_at: number;
}

export interface PublicCalendarEvent {
  id: string;
  booking_code: string;
  room_id: string;
  room_name: string;
  activity_name: string;
  starts_at: number;
  ends_at: number;
  status: BookingStatus;
}

export type AdminRole = 'superadmin' | 'admin' | 'staff';

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  createdAt?: number;
}
