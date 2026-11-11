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
  equipment_needed?: string | null;
  starts_at: number;
  ends_at: number;
  status: string;
  total_price_thb: number;
  items?: { item_code: string; item_name: string; quantity: number; subtotal: number }[];
}

export const ROOM_NAMES: Record<string, string> = {
  floor2: "หอประชุมชั้น 2 (อาคารศูนย์วิทยาศาสตร์ฯ)",
  floor7: "ห้องประชุมชั้น 7 (อาคารเฉลิมพระเกียรติฯ)",
};

export const TABLE_LAYOUT_NAMES: Record<string, string> = {
  theater: "แบบเธียเตอร์ (Theater)",
  classroom: "แบบชั้นเรียน (Classroom)",
  cluster: "แบบกลุ่ม/จัดเลี้ยง (Cluster/Banquet)",
  ushape: "แบบตัวยู (U-Shape)",
  boardroom: "แบบห้องประชุมผู้บริหาร (Boardroom)",
};

export const MEETING_TYPE_NAMES: Record<string, string> = {
  seminar: "การอบรม/สัมมนาวิชาการ",
  small_group: "การประชุมกลุ่มย่อย",
  wedding: "งานพิธีการ/มงคลสมรส",
  internal: "ประชุมภายในองค์กร",
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

// ponytail: single fee formatter for both LINE Flex & Telegram messages
export function formatFeeDisplay(totalPrice: number, meetingType: string): string {
  if (meetingType === "internal") {
    return totalPrice === 0
      ? "฿0 (สิทธิ์ภายในองค์กร — ยกเว้นค่าห้อง/ประกัน)"
      : `฿${totalPrice.toLocaleString("th-TH")} (เฉพาะค่าอาหาร — ฟรีค่าห้อง)`;
  }
  return `฿${totalPrice.toLocaleString("th-TH")} (รวม VAT)`;
}

/**
 * Checks if LINE notifications are enabled in system_settings table.
 */
export async function isLineNotifyEnabled(db: D1Database): Promise<boolean> {
  try {
    const row = await db
      .prepare("SELECT value FROM system_settings WHERE key = 'line_notify_enabled'")
      .first<{ value: string }>();
    if (!row) return true; // Default enabled
    return row.value === "1";
  } catch {
    return true; // Fallback if table doesn't exist
  }
}

/**
 * Updates LINE notification toggle in system_settings table.
 */
export async function setLineNotifyEnabled(db: D1Database, enabled: boolean): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('line_notify_enabled', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .bind(enabled ? "1" : "0", now)
    .run();
}

/**
 * Retrieves LINE credentials from environment secrets, falling back to Cloudflare Context.
 */
export async function getLineCredentials(): Promise<{ token?: string; groupId?: string }> {
  let token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  let groupId = process.env.LINE_GROUP_ID;

  if (!token || !groupId) {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { env } = await getCloudflareContext();
      token = token || (env as any)?.LINE_CHANNEL_ACCESS_TOKEN;
      groupId = groupId || (env as any)?.LINE_GROUP_ID;
    } catch {
      // Local development or unit test environment
    }
  }

  // Clean any accidental quotes or whitespace
  token = token?.replace(/^["']|["']$/g, "").trim();
  groupId = groupId?.replace(/^["']|["']$/g, "").trim();

  return { token, groupId };
}

/**
 * Builds a valid LINE Flex Message for a newly created booking (Pending approval).
 */
export function buildLinePendingFlexMessage(booking: BookingWithDetails): object {
  const roomName = ROOM_NAMES[booking.room_id] || booking.room_id;
  const layoutName = TABLE_LAYOUT_NAMES[booking.table_layout] || booking.table_layout;
  const typeName = MEETING_TYPE_NAMES[booking.meeting_type] || booking.meeting_type;
  const { dateStr, timeStr } = formatThaiDateTimeRange(booking.starts_at, booking.ends_at);
  const formattedPhone = booking.coordinator_phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");

  let equipmentText = "ไม่ได้ระบุ";
  let equipmentNotesText = "";
  if (booking.equipment_needed) {
    try {
      const parsed = typeof booking.equipment_needed === "string" ? JSON.parse(booking.equipment_needed) : booking.equipment_needed;
      const items = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items.join(", ") : "";
      const other = parsed.other ? `อื่นๆ: ${parsed.other}` : "";
      const combined = [items, other].filter(Boolean).join(" | ");
      if (combined) equipmentText = combined;
      if (parsed.notes) equipmentNotesText = parsed.notes;
    } catch {
      equipmentText = String(booking.equipment_needed);
    }
  }

  return {
    type: "flex",
    altText: `[คำขอใหม่] การจองห้องประชุม: ${booking.activity_name} (${booking.booking_code})`,
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#b45309", // Warm Amber
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "มีคำขอจองห้องประชุมใหม่",
                color: "#fef3c7",
                weight: "bold",
                size: "sm",
                flex: 1,
              },
              {
                type: "text",
                text: "PENDING",
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
            color: "#fef3c7",
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
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "สถานที่ / ห้องประชุม", size: "xs", color: "#8e8e99", weight: "bold" },
              { type: "text", text: roomName, size: "sm", color: "#1e1e24", weight: "bold", wrap: true, margin: "xs" },
            ],
          },
          { type: "separator", color: "#f0edf3" },
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "วันและเวลาที่ขอใช้งาน", size: "xs", color: "#8e8e99", weight: "bold" },
              { type: "text", text: dateStr, size: "sm", color: "#b45309", weight: "bold", margin: "xs" },
              { type: "text", text: timeStr, size: "sm", color: "#1e1e24", margin: "xs" },
            ],
          },
          { type: "separator", color: "#f0edf3" },
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
                  { type: "text", text: `${booking.attendees_count} คน (เจ้าหน้าที่ ${booking.staff_count} คน)`, size: "xs", color: "#1e1e24", flex: 5, weight: "bold" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "ผู้ประสานงาน:", size: "xs", color: "#8e8e99", flex: 3 },
                  { type: "text", text: `${booking.coordinator_name} (โทร. ${formattedPhone})`, size: "xs", color: "#1e1e24", flex: 5, weight: "bold" },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "อุปกรณ์ที่ขอ:", size: "xs", color: "#8e8e99", flex: 3 },
                  { type: "text", text: equipmentText, size: "xs", color: "#1e1e24", flex: 5, wrap: true },
                ],
              },
              ...(equipmentNotesText ? [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    { type: "text", text: "หมายเหตุ:", size: "xs", color: "#8e8e99", flex: 3 },
                    { type: "text", text: equipmentNotesText, size: "xs", color: "#b45309", flex: 5, wrap: true },
                  ],
                }
              ] : []),
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#fffbeb",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "กรุณาเข้าสู่ระบบผู้ดูแลเพื่อตรวจสอบและอนุมัติการจอง",
            size: "xs",
            color: "#92400e",
            align: "center",
            weight: "bold",
          },
        ],
      },
    },
  };
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
                    text: formatFeeDisplay(booking.total_price_thb, booking.meeting_type),
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

// Self-evidencing notifications: the exact JSON body sent to the LINE push API
// is stored in the queue row (payload_json) so rendering bugs (e.g. ?????) can
// be diagnosed from stored data without redeploying instrumentation.
const PAYLOAD_CAPTURE_MAX_CHARS = 8000;
const PAYLOAD_RETENTION_SECONDS = 30 * 86400;

type LinePushResult = { ok: boolean; errorText: string | null; bodyJson: string };

/**
 * Single chokepoint for all LINE push API calls: builds the JSON body once,
 * sends it, and reports the outcome together with the exact body that left.
 */
async function pushLineMessage(
  token: string,
  groupId: string,
  message: unknown,
  retryKey?: string
): Promise<LinePushResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (retryKey) {
    headers["X-Line-Retry-Key"] = retryKey;
  }
  const bodyJson = JSON.stringify({ to: groupId, messages: [message] });
  const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers,
    body: bodyJson,
  });
  const errorText = lineResponse.ok ? null : await lineResponse.text();
  return { ok: lineResponse.ok, errorText, bodyJson };
}

/**
 * Clears payload_json from queue rows past the retention window (PII housekeeping).
 */
async function trimExpiredPayloads(db: D1Database, now: number): Promise<void> {
  await db
    .prepare(
      "UPDATE line_notifications SET payload_json = NULL WHERE sent_at IS NOT NULL AND sent_at < ? AND payload_json IS NOT NULL"
    )
    .bind(now - PAYLOAD_RETENTION_SECONDS)
    .run();
}

/**
 * Sends a push message via LINE Messaging API for an approved booking.
 */
export async function sendLineApprovedNotification(
  db: D1Database,
  bookingId: string
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    // Check if LINE notification is enabled
    const enabled = await isLineNotifyEnabled(db);
    if (!enabled) {
      return { success: true, skipped: true, error: "LINE notifications are disabled in system settings" };
    }

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

    if (booking.status !== "approved") {
      return {
        success: false,
        error: `Booking status is '${booking.status}', must be 'approved' to send LINE notification`,
      };
    }

    const items = await db
      .prepare("SELECT item_code, item_name, quantity, subtotal FROM booking_items WHERE booking_id = ?")
      .bind(bookingId)
      .all<{ item_code: string; item_name: string; quantity: number; subtotal: number }>();

    booking.items = items.results || [];

    // 3. Get secrets
    const { token, groupId } = await getLineCredentials();

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

    // 5. Send via the shared chokepoint (captures the exact payload)
    const now = Math.floor(Date.now() / 1000);
    const push = await pushLineMessage(token, groupId, flexMessage, queueRecord.retry_key);
    await trimExpiredPayloads(db, now);

    if (push.ok) {
      await db
        .prepare(
          "UPDATE line_notifications SET status = 'sent', sent_at = ?, attempts = attempts + 1, last_attempt_at = ?, payload_json = ? WHERE id = ?"
        )
        .bind(now, now, push.bodyJson.slice(0, PAYLOAD_CAPTURE_MAX_CHARS), queueRecord.id)
        .run();
      return { success: true };
    } else {
      await db
        .prepare(
          "UPDATE line_notifications SET status = 'failed', error_message = ?, attempts = attempts + 1, last_attempt_at = ?, payload_json = ? WHERE id = ?"
        )
        .bind(push.errorText ?? "", now, now, push.bodyJson.slice(0, PAYLOAD_CAPTURE_MAX_CHARS), queueRecord.id)
        .run();
      return { success: false, error: push.errorText ?? "" };
    }
  } catch (err: any) {
    console.error("sendLineApprovedNotification error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a push message via LINE Messaging API when a new booking request is created (Pending).
 */
export async function sendLinePendingNotification(
  db: D1Database,
  bookingId: string
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    const enabled = await isLineNotifyEnabled(db);
    if (!enabled) {
      return { success: true, skipped: true, error: "LINE notifications are disabled in system settings" };
    }

    const booking = await db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .bind(bookingId)
      .first<BookingWithDetails>();

    if (!booking) {
      return { success: false, error: `Booking not found: ${bookingId}` };
    }

    // Lazily reuse (or create) the queue row for this pending push — the OLDEST
    // row per booking (approval inserts its own later, read newest-first).
    // Row is created only when a send is actually attempted, so bookings made
    // while LINE is disabled (or without credentials) keep no queue rows.
    let queueRecord = await db
      .prepare(
        "SELECT id, retry_key, status FROM line_notifications WHERE booking_id = ? ORDER BY created_at ASC LIMIT 1"
      )
      .bind(bookingId)
      .first<{ id: string; retry_key: string; status: string }>();

    if (queueRecord?.status === "sent") {
      return { success: true, skipped: true };
    }

    const { token, groupId } = await getLineCredentials();
    if (!token || !groupId) {
      return { success: false, error: "LINE credentials missing in server environment" };
    }

    if (!queueRecord) {
      const history = await db
        .prepare("SELECT id FROM booking_status_history WHERE booking_id = ? ORDER BY changed_at ASC LIMIT 1")
        .bind(bookingId)
        .first<{ id: string }>();
      if (history) {
        const lineNotifId = crypto.randomUUID();
        const retryKey = crypto.randomUUID();
        await db
          .prepare(
            "INSERT INTO line_notifications (id, booking_id, history_id, retry_key, status, attempts, created_at) VALUES (?, ?, ?, ?, 'pending', 0, ?) ON CONFLICT(booking_id, history_id) DO NOTHING"
          )
          .bind(lineNotifId, bookingId, history.id, retryKey, Math.floor(Date.now() / 1000))
          .run();
        queueRecord = { id: lineNotifId, retry_key: retryKey, status: "pending" };
      }
    }

    const flexMessage = buildLinePendingFlexMessage(booking);
    const now = Math.floor(Date.now() / 1000);
    const push = await pushLineMessage(token, groupId, flexMessage, queueRecord?.retry_key);

    if (queueRecord) {
      if (push.ok) {
        await db
          .prepare(
            "UPDATE line_notifications SET status = 'sent', sent_at = ?, attempts = attempts + 1, last_attempt_at = ?, payload_json = ? WHERE id = ?"
          )
          .bind(now, now, push.bodyJson.slice(0, PAYLOAD_CAPTURE_MAX_CHARS), queueRecord.id)
          .run();
        await trimExpiredPayloads(db, now);
        return { success: true };
      }
      await db
        .prepare(
          "UPDATE line_notifications SET status = 'failed', error_message = ?, attempts = attempts + 1, last_attempt_at = ?, payload_json = ? WHERE id = ?"
        )
        .bind(push.errorText ?? "", now, now, push.bodyJson.slice(0, PAYLOAD_CAPTURE_MAX_CHARS), queueRecord.id)
        .run();
      return { success: false, error: push.errorText ?? "" };
    }

    return push.ok ? { success: true } : { success: false, error: push.errorText ?? "" };
  } catch (err: any) {
    console.error("sendLinePendingNotification error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a test ping message into the configured LINE group to verify connectivity.
 */
export async function sendLineTestPing(
  testByAdmin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { token, groupId } = await getLineCredentials();
    if (!token || !groupId) {
      return { success: false, error: "ไม่พบการตั้งค่า LINE Token หรือ Group ID ในระบบ" };
    }

    const now = new Date();
    const bkkNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const timeStr = `${String(bkkNow.getUTCHours()).padStart(2, "0")}:${String(bkkNow.getUTCMinutes()).padStart(2, "0")}:${String(bkkNow.getUTCSeconds()).padStart(2, "0")} น.`;

    const testPayload = {
      type: "flex",
      altText: "[ทดสอบระบบ] ทดสอบการเชื่อมต่อ LINE Messaging API สำเร็จ",
      contents: {
        type: "bubble",
        size: "kilo",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#059669", // Emerald
          paddingAll: "16px",
          contents: [
            {
              type: "text",
              text: "ทดสอบการเชื่อมต่อ LINE สำเร็จ ✅",
              weight: "bold",
              color: "#ffffff",
              size: "md",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          paddingAll: "16px",
          contents: [
            {
              type: "text",
              text: "ระบบจองห้องประชุม ม.สวนดุสิต ลำปาง",
              weight: "bold",
              size: "sm",
              color: "#1e1e24",
            },
            {
              type: "text",
              text: `เวลาที่ทดสอบ: ${timeStr}`,
              size: "xs",
              color: "#52525b",
            },
            {
              type: "text",
              text: `ทดสอบโดย: ${testByAdmin}`,
              size: "xs",
              color: "#52525b",
            },
            {
              type: "text",
              text: "บอทสามารถส่งข้อความเข้ากลุ่มและพร้อมรับการแจ้งเตือนจริงแล้ว",
              size: "xs",
              color: "#059669",
              margin: "sm",
              wrap: true,
            },
          ],
        },
      },
    };

    const push = await pushLineMessage(token, groupId, testPayload);
    return push.ok ? { success: true } : { success: false, error: push.errorText ?? "" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
