export interface BookingWithDetails {
  id: string;
  booking_code: string;
  room_id: string;
  activity_name: string;
  project_name: string;
  coordinator_name: string;
  coordinator_phone: string;
  coordinator_line_id?: string | null;
  meeting_type: string;
  attendees_count: number;
  staff_count: number;
  table_layout: string;
  vvip_seats: number;
  vip_seats: number;
  starts_at: number;
  ends_at: number;
  status: string;
  total_price_thb: number;
  items?: { item_code: string; item_name: string; quantity: number; subtotal: number }[];
}

const ROOM_NAMES: Record<string, string> = {
  floor2: "หอประชุมชั้น 2 (อาคารศูนย์วิทยาศาสตร์ฯ)",
  floor7: "ห้องประชุมชั้น 7 (อาคารเฉลิมพระเกียรติฯ)",
};

const TABLE_LAYOUT_NAMES: Record<string, string> = {
  theater: "แบบเธียเตอร์ (Theater)",
  classroom: "แบบชั้นเรียน (Classroom)",
  cluster: "แบบกลุ่ม/จัดเลี้ยง (Cluster/Banquet)",
  ushape: "แบบตัวยู (U-Shape)",
  boardroom: "แบบห้องประชุมผู้บริหาร (Boardroom)",
};

const MEETING_TYPE_NAMES: Record<string, string> = {
  seminar: "การอบรม/สัมมนาวิชาการ",
  small_group: "การประชุมกลุ่มย่อย",
  wedding: "งานพิธีการ/มงคลสมรส",
};

export function formatThaiDateTimeRange(startsAtEpoch: number, endsAtEpoch: number): { dateStr: string; timeStr: string } {
  const startDate = new Date(startsAtEpoch * 1000);
  const endDate = new Date(endsAtEpoch * 1000);

  // Bangkok time (+7)
  const bkkStart = new Date(startDate.getTime() + 7 * 3600 * 1000);
  const bkkEnd = new Date(endDate.getTime() + 7 * 3600 * 1000);

  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];

  const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const dayName = thaiDays[bkkStart.getUTCDay()];

  const dateStr = `วัน${dayName}ที่ ${bkkStart.getUTCDate()} ${thaiMonths[bkkStart.getUTCMonth()]} ${bkkStart.getUTCFullYear() + 543}`;
  
  const startH = String(bkkStart.getUTCHours()).padStart(2, "0");
  const startM = String(bkkStart.getUTCMinutes()).padStart(2, "0");
  const endH = String(bkkEnd.getUTCHours()).padStart(2, "0");
  const endM = String(bkkEnd.getUTCMinutes()).padStart(2, "0");

  const durationHours = Math.round((endsAtEpoch - startsAtEpoch) / 3600 * 10) / 10;
  const timeStr = `${startH}:${startM} - ${endH}:${endM} น. (${durationHours} ชม.)`;

  return { dateStr, timeStr };
}

/**
 * Builds a valid LINE Flex Message (Bubble) for an approved booking.
 * Official Suan Dusit University Lampang purple (#582c83) and gold (#cba052) theme.
 */
export function buildLineFlexMessage(booking: BookingWithDetails): object {
  const roomName = ROOM_NAMES[booking.room_id] || booking.room_id;
  const layoutName = TABLE_LAYOUT_NAMES[booking.table_layout] || booking.table_layout;
  const typeName = MEETING_TYPE_NAMES[booking.meeting_type] || booking.meeting_type;
  const { dateStr, timeStr } = formatThaiDateTimeRange(booking.starts_at, booking.ends_at);

  const formattedPhone = booking.coordinator_phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  // Summary of items (catering) if any
  const cateringSummary = booking.items && booking.items.length > 0
    ? booking.items.map((i) => `${i.item_name} (${i.quantity} ชุด)`).join(", ")
    : "ไม่ระบุอาหาร/เครื่องดื่ม";

  return {
    type: "flex",
    altText: `[อนุมัติแล้ว] การจองห้องประชุม: ${booking.activity_name} (${booking.booking_code})`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#582c83",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "อนุมัติการจองห้องประชุมเรียบร้อยแล้ว",
                color: "#cba052",
                weight: "bold",
                size: "sm",
                flex: 1,
              },
              {
                type: "text",
                text: "APPROVED",
                color: "#ffffff",
                size: "xxs",
                align: "end",
                weight: "bold",
              },
            ],
          },
          {
            type: "text",
            text: booking.activity_name,
            weight: "bold",
            color: "#ffffff",
            size: "xl",
            margin: "md",
            wrap: true,
          },
          {
            type: "text",
            text: `รหัสการจอง: ${booking.booking_code}`,
            color: "#e6e2ea",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          // Room Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "สถานที่ / ห้องประชุม",
                size: "xs",
                color: "#8e8e99",
                weight: "bold",
              },
              {
                type: "text",
                text: roomName,
                size: "sm",
                color: "#1e1e24",
                weight: "bold",
                wrap: true,
                margin: "xs",
              },
            ],
          },
          {
            type: "separator",
            color: "#f0edf3",
          },
          // Date & Time Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "วันและเวลาใช้งาน",
                size: "xs",
                color: "#8e8e99",
                weight: "bold",
              },
              {
                type: "text",
                text: dateStr,
                size: "sm",
                color: "#582c83",
                weight: "bold",
                margin: "xs",
              },
              {
                type: "text",
                text: timeStr,
                size: "sm",
                color: "#1e1e24",
                margin: "xs",
              },
            ],
          },
          {
            type: "separator",
            color: "#f0edf3",
          },
          // Meeting Details
          {
            type: "box",
            layout: "vertical",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ประเภทงาน:", size: "xs", color: "#8e8e99", flex: 3 },
                  { type: "text", text: typeName, size: "xs", color: "#1e1e24", flex: 5, weight: "bold" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "รูปแบบโต๊ะ:", size: "xs", color: "#8e8e99", flex: 3 },
                  { type: "text", text: layoutName, size: "xs", color: "#1e1e24", flex: 5 },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "จำนวนผู้เข้าร่วม:", size: "xs", color: "#8e8e99", flex: 3 },
                  {
                    type: "text",
                    text: `${booking.attendees_count} คน (เจ้าหน้าที่ ${booking.staff_count} คน)`,
                    size: "xs",
                    color: "#1e1e24",
                    flex: 5,
                    weight: "bold",
                  },
                ],
              },
              ...(booking.vvip_seats > 0 || booking.vip_seats > 0
                ? [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        { type: "text", text: "ที่นั่งพิเศษ:", size: "xs", color: "#8e8e99", flex: 3 },
                        {
                          type: "text",
                          text: `VVIP: ${booking.vvip_seats} ที่นั่ง | VIP: ${booking.vip_seats} ที่นั่ง`,
                          size: "xs",
                          color: "#1e1e24",
                          flex: 5,
                        },
                      ],
                    },
                  ]
                : []),
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "อาหาร/เครื่องดื่ม:", size: "xs", color: "#8e8e99", flex: 3 },
                  {
                    type: "text",
                    text: cateringSummary,
                    size: "xs",
                    color: "#1e1e24",
                    flex: 5,
                    wrap: true,
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ค่าบริการรวม:", size: "xs", color: "#8e8e99", flex: 3 },
                  {
                    type: "text",
                    text: `฿${booking.total_price_thb.toLocaleString("th-TH")} (รวม VAT)`,
                    size: "xs",
                    color: "#582c83",
                    flex: 5,
                    weight: "bold",
                  },
                ],
              },
            ],
          },
          {
            type: "separator",
            color: "#f0edf3",
          },
          // Coordinator Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ผู้ประสานงาน",
                size: "xs",
                color: "#8e8e99",
                weight: "bold",
              },
              {
                type: "text",
                text: `${booking.coordinator_name} (โทร. ${formattedPhone})`,
                size: "xs",
                color: "#1e1e24",
                weight: "bold",
                margin: "xs",
              },
              ...(booking.coordinator_line_id
                ? [
                    {
                      type: "text",
                      text: `LINE ID: ${booking.coordinator_line_id}`,
                      size: "xs",
                      color: "#595963",
                      margin: "xs",
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#faf8fd",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "ระบบจองห้องประชุม มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง",
            size: "xxs",
            color: "#8e8e99",
            align: "center",
          },
        ],
      },
    },
  };
}

/**
 * Sends a push message via LINE Messaging API for an approved booking.
 * Reads credentials strictly from server environment secrets.
 * Ensures idempotency and updates line_notifications queue.
 */
export async function sendLineApprovedNotification(
  db: D1Database,
  bookingId: string
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    // 1. Check queue record
    const queueRecord = await db
      .prepare(
        "SELECT id, retry_key, status, attempts FROM line_notifications WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1"
      )
      .bind(bookingId)
      .first<{ id: string; retry_key: string; status: string; attempts: number }>();

    if (!queueRecord) {
      return { success: false, error: "No line_notification record found for this booking" };
    }

    if (queueRecord.status === "sent") {
      // Already sent - idempotent noop
      return { success: true, skipped: true };
    }

    // 2. Fetch full booking details
    const booking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .bind(bookingId)
      .first<BookingWithDetails>();

    if (!booking) {
      return { success: false, error: `Booking not found: ${bookingId}` };
    }

    // Double check status is 'approved'
    if (booking.status !== "approved") {
      return {
        success: false,
        error: `Booking status is '${booking.status}', must be 'approved' to send LINE notification`,
      };
    }

    // Fetch items
    const items = await db
      .prepare("SELECT item_code, item_name, quantity, subtotal FROM booking_items WHERE booking_id = ?")
      .bind(bookingId)
      .all<{ item_code: string; item_name: string; quantity: number; subtotal: number }>();

    booking.items = items.results || [];

    // 3. Get secrets
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const groupId = process.env.LINE_GROUP_ID;

    if (!token || !groupId) {
      const now = Math.floor(Date.now() / 1000);
      await db
        .prepare(
          "UPDATE line_notifications SET status = 'failed', error_message = ?, attempts = attempts + 1, last_attempt_at = ? WHERE id = ?"
        )
        .bind("LINE credentials (token or groupId) missing in server environment", now, queueRecord.id)
        .run();
      return { success: false, error: "LINE credentials missing in server environment" };
    }

    // 4. Build Flex payload
    const flexMessage = buildLineFlexMessage(booking);

    // 5. Send POST with X-Line-Retry-Key
    const now = Math.floor(Date.now() / 1000);
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Line-Retry-Key": queueRecord.retry_key,
      },
      body: JSON.stringify({
        to: groupId,
        messages: [flexMessage],
      }),
    });

    if (lineResponse.ok) {
      await db
        .prepare(
          "UPDATE line_notifications SET status = 'sent', sent_at = ?, attempts = attempts + 1, last_attempt_at = ? WHERE id = ?"
        )
        .bind(now, now, queueRecord.id)
        .run();
      return { success: true };
    } else {
      const errorText = await lineResponse.text();
      await db
        .prepare(
          "UPDATE line_notifications SET status = 'failed', error_message = ?, attempts = attempts + 1, last_attempt_at = ? WHERE id = ?"
        )
        .bind(errorText.slice(0, 500), now, queueRecord.id)
        .run();
      return { success: false, error: errorText };
    }
  } catch (err: any) {
    console.error("sendLineApprovedNotification error:", err);
    return { success: false, error: err.message };
  }
}
