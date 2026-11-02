# Handoff Documentation: ระบบจองห้องประชุม

มหาวิทยาลัยสวนดุสิต ศูนย์การศึกษาลำปาง (Suan Dusit University, Lampang Center)

---

## 📌 ข้อมูลโปรเจกต์และลิงก์สำคัญ

- **GitHub Repository**: [https://github.com/chookaittom-gif/Meeting-Room-Booking-System](https://github.com/chookaittom-gif/Meeting-Room-Booking-System)
- **Live Production URL**: [https://meeting-room-booking-system.chookait-tom.workers.dev/](https://meeting-room-booking-system.chookait-tom.workers.dev/)
- **Cloudflare D1 Database**:
  - Dashboard: [https://dash.cloudflare.com/17abb4914aa1cbfcf03edddedbaea672/workers/d1/databases/62750b8e-5aef-4c94-af6f-e5d9a71f7d28/metrics](https://dash.cloudflare.com/17abb4914aa1cbfcf03edddedbaea672/workers/d1/databases/62750b8e-5aef-4c94-af6f-e5d9a71f7d28/metrics)
  - Database Name: `meeting_db`
  - Database ID: `62750b8e-5aef-4c94-af6f-e5d9a71f7d28`
  - Binding: `DB`

---

## 🆕 งานล่าสุด (วันที่ 2 พฤศจิกายน 2569)

### 0.0000 แยกภาพแบนเนอร์ห้องประชุมตามชั้น (38591d1)

- **การตัดสินใจผ่าน /grill-me**: สถาปัตยกรรมรูปภาพไม่ได้เก็บใน D1 (D1 เป็น SQL Database สำหรับบันทึกการจอง) และไม่ได้ใช้ Cloudflare R2 แต่ใช้ Cloudflare Workers Static Assets ผ่านโฟลเดอร์ public/images/ โดยตรง ซึ่งเป็น Best Practice ที่เหมาะสมที่สุดสำหรับระบบที่มีรูปไม่กี่ภาพ (รวดเร็วผ่าน Global CDN, ไม่มีค่าใช้จ่าย, ไม่ติดข้อจำกัด Rate Limit ของ Google Drive)
- **การปรับปรุงโค้ด UI**: เพิ่มฟิลด์ imageSrc และ imageAlt ใน ROOM_DATA ของ app/page.tsx พร้อมผูก <Image key={currentRoom.id}> เพื่อให้สลับภาพตามแท็บห้องประชุมชั้น 2 และชั้น 7 ได้ทันทีเมื่อผู้ใช้คลิกเลือก
- **ไฟล์ภาพเริ่มต้น**: สร้าง public/images/room-floor7.jpg และ public/images/room-floor2.jpg จากภาพเดิมเป็น baseline ป้องกันปัญหาภาพแตก โดยผู้ใช้สามารถนำรูปใหม่มาวางทับชื่อเดิมใน public/images/ ได้ทุกเมื่อ
- **การตรวจรับ**: tests 85/85 PASS, typecheck PASS, build:worker PASS; deploy version 9bf25edc-2ebf-42e5-bbc9-6c7724eca7ac

---

## 📅 ประวัติงานก่อนหน้า (วันที่ 1 พฤศจิกายน 2569)

### 0.000 แจ้งเตือน Telegram + หน้าตั้งค่า token/chat id (`f56128c`)

- **การตัดสินใจผ่าน `/grill-me`**: ใช้ควบคู่กับ LINE (สวิตช์แยก); กรอก token + chat id ในหน้าแอดมินเอง (การ์ด "การแจ้งเตือน Telegram Bot" ใต้การ์ด LINE); Superadmin เท่านั้นบันทึก/เปลี่ยน/ลบ, ผู้ดูแลอื่นกดสวิตช์และทดสอบส่งได้; ตรวจ token (`getMe`) + ส่งข้อความทดสอบก่อนบันทึก; ไม่มี rate limit/ประวัติแก้ไข
- **ความปลอดภัย**: token เข้ารหัส AES-GCM (กุญแจ = Cloudflare secret `TELEGRAM_ENCRYPTION_KEY`) เก็บใน `system_settings` (`telegram_token_enc`, `telegram_token_last4`, `telegram_chat_id`, `telegram_bot_username`, `telegram_notify_enabled`) ไม่มี migration; token เขียนอย่างเดียว ไม่ถูกส่งกลับหรือ log (ไม่ log `err.message` เพราะ URL ของ Telegram มี token); ไม่มีกุญแจ = ปิด (fail closed); mutation ต้องส่ง `Content-Type: application/json`
- **API ใหม่** `/api/admin/telegram`: `GET` สถานะ, `PUT` บันทึก (superadmin), `PATCH` สวิตช์, `POST` ทดสอบส่ง, `DELETE` ลบ (superadmin)
- **ข้อความ** (ตัวอักษรธรรมดา, `lib/telegram-service.ts`): pending มีอุปกรณ์/หมายเหตุ + ลิงก์ `/admin`; approved มีสรุปอาหาร/เครื่องดื่ม ไม่มีอุปกรณ์; ส่งต่อจาก LINE ใน `app/api/bookings/route.ts` และ `app/api/bookings/[id]/status/route.ts` ไม่บล็อกการจอง
- ไฟล์ใหม่: `lib/telegram-service.ts`, `app/api/admin/telegram/route.ts`, `app/components/TelegramSettingsCard.tsx`, `tests/phase10-telegram.test.ts`; `line-service.ts` export ชื่อห้อง/ผัง/ประเภทเพิ่ม
- ตรวจ: tests 85/85 (+9), typecheck, build:worker ผ่าน; prod: `/api/admin/telegram` ไม่มี session = 401, `/admin` = 200; deploy `c4439204-f132-486e-8b5d-fc0bcc5f86c7`; rollback = revert commit (ลบค่าที่เก็บ: `DELETE FROM system_settings WHERE key LIKE 'telegram_%'`)
- **ค้างให้ผู้ใช้ทำ**: (1) ตั้งกุญแจ `openssl rand -base64 32 | npx wrangler secret put TELEGRAM_ENCRYPTION_KEY` (2) เปิด /admin ล็อกอิน chookait กด "ตั้งค่า" กรอก token + chat id (3) ยังไม่ได้ตรวจภาพการ์ดบน prod (Chrome extension ไม่เชื่อมต่อ ณ ตอน deploy)

### 0.00 แจ้งเตือนจองซ้อน: แสดงวันเวลาที่ชน + ช่วงว่างให้เลือก (`d591d51`)

- **การตัดสินใจผ่าน `/grill-me`**: เช็กตั้งแต่ขั้น 1 ตอนกด "ถัดไป" (บล็อกถ้าชน) และเช็กซ้ำตอนส่ง; ข้อความระบุ "วันที่ + ช่วงเวลา + สถานะ" ไม่เปิดเผยชื่อกิจกรรม/ผู้ประสานงาน (PDPA); pending ยังบล็อก (บอกว่าอาจว่างหากถูกปฏิเสธ); ไม่เพิ่มช่วงเว้น (จองต่อกันพอดีได้); ถ้า API เช็กความว่างล่ม ปล่อยผ่านให้ server ตัดสิน (fail-open)
- **API ใหม่**: `GET /api/availability?room=&date=YYYY-MM-DD` (อ่านอย่างเดียว) คืน `{ success, busy: [{starts_at, ends_at, status}] }` เฉพาะ pending/approved ใน 08:30–16:30 ตรวจพารามิเตอร์ที่ server (400 `VALIDATION_ERROR`)
- **เปลี่ยน contract (เพิ่มฟิลด์เท่านั้น)**: 409 ของ `POST /api/bookings` มี `conflicts: [{starts_at, ends_at, status}]` เพิ่ม (`BookingConflictError.conflicts` อ่านหลัง insert ล้มเหลว; เงื่อนไขตัดสินว่าชนใน `createBookingAtomic` ไม่เปลี่ยน)
- **UI** (`app/book/page.tsx`): แผงเหลืองค้างในหน้า (`role="alert"`) แสดงสูงสุด 3 ช่วงที่ชน + "และอีก N ช่วง", ปุ่มช่วงว่างใกล้เคียงยาวเท่าเดิม ≤ 3 ช่วง และปุ่ม "เวลาเดิมในอีกห้อง" ถ้าว่างและความจุพอ; 409 หลังกดส่งพากลับขั้น 1 เก็บข้อมูลเดิม; ปุ่ม "ถัดไป" disabled ขณะเช็ก
- ไฟล์ใหม่: `lib/availability.ts` (ฟังก์ชันบริสุทธิ์ใช้ทั้งสองฝั่ง), `app/api/availability/route.ts`, `tests/phase9-availability.test.ts`
- ตรวจ: tests 76/76 (+6), typecheck, build:worker ผ่าน; prod: `/api/availability` = 200, พารามิเตอร์ผิด = 400, `/book` = 200; deploy `7f601428-88af-4915-8a9d-4ca371f17681`; ไม่มี migration (rollback = revert commit)
- **ยังไม่ได้ตรวจบน prod**: ภาพแผงแจ้งเตือนจริง เพราะ production ไม่มีรายการจองให้ชน และไม่ส่งใบจองจริงเพื่อทดสอบ ควรลองจองซ้อนเวลาเดียวกันด้วยตัวเอง 1 ครั้ง (แล้วยกเลิกใบทดสอบ)

### 0.0 ปรับ UI ตามผลตรวจ responsive บน production (`037cea1`, `1746781`)

- ตรวจ production ด้วย playwright-cli ที่ 375/768/1280px (หน้า `/`, `/book`, `/stats`) และ `/admin` ผ่าน Chrome ที่ผู้ใช้ล็อกอิน: ไม่มี horizontal overflow
- **แก้**: ปุ่มสลับห้องบนภาพหน้าแรก (`app/page.tsx`) และลิงก์โลโก้ header (`app/layout.tsx`) เติม `touch-target` ให้สูง ≥ 44px; ชื่อระบบบนมือถือลดเป็น `text-xs` ต่ำกว่า 400px จึงไม่ถูกตัดที่ 375px; กล่อง "2 ห้องประชุมมาตรฐาน" ในการ์ดสถานะ (คอม) ขยายเต็มพื้นที่แทนช่องว่างเหนือปุ่ม CTA
- ตรวจ prod หลัง deploy: ที่ 375 และ 1280px ไม่มี element ต่ำกว่า 44px, ชื่อระบบไม่ถูกตัด; tests 70/70 + typecheck + build:worker ผ่าน; deploy `88e286df-f072-4ade-8db7-d5fc7a56fffd`
- ยังตรวจไม่ได้: Modal รายละเอียดใบจอง (production ยังไม่มีรายการจอง)

### 0. ปรับความจุห้องประชุม + ระบบเลือกอุปกรณ์และหมายเหตุเพิ่มเติม (`801b1ce`)

- **การตัดสินใจผ่าน `/grill-me`**:
  1. **ความจุห้องประชุม**: หอประชุมชั้น 2 ปรับเป็น **250 คน** (เดิม 100 คน), ห้องประชุมชั้น 7 ปรับเป็น **450 คน** (เดิม 300 คน) อัปเดตทั้งหน้าแรก (`app/page.tsx`), ชิปผัง Theater 250/450, แบบฟอร์มจอง (`app/book/page.tsx`), validation การคำนวณ, และ schema ฐานข้อมูล D1 (`rooms.capacity_max`)
  2. **ตัวเลือกอุปกรณ์ (Step 2)**: Checkbox กริด 2 คอลัมน์ 5 รายการ (โปรเจ็คเตอร์, ไมโครโฟน, เครื่องเสียง, คอมพิวเตอร์, Wifi) + ช่องกรอก "ระบุอื่นๆ" + ช่องกรอก "หมายเหตุเพิ่มเติม"
  3. **โครงสร้างฐานข้อมูล**: Migration `0005_add_equipment_and_update_capacities.sql` เพิ่มคอลัมน์ `equipment_needed TEXT` ในตาราง `bookings` (เก็บ JSON) และอัปเดต `capacity_max` ของห้อง
  4. **การแจ้งเตือน LINE**: แสดงรายการอุปกรณ์และหมายเหตุใน LINE Flex Message เมื่อมีคำขอใหม่ (**Pending**) แต่**ไม่แสดง**เมื่ออนุมัติแล้ว (**Approved**) เพื่อความกระชับ
  5. **หน้าผู้ดูแล (/admin)**: แสดงรายการอุปกรณ์และหมายเหตุใน Modal รายละเอียดใบจอง
  6. **รายงานประจำเดือน (/report)**: คงไว้ตามเดิม ไม่ต้องปรับเพิ่ม เพื่อคงมาตรฐาน 1 หน้า A4
- ตรวจสอบ: tests 70/70, typecheck, build:worker ผ่าน; D1 remote migration applied; deploy `73ae92ee-fefd-4c53-b5b3-b5ea79229911`

### 0.1 ปฏิทินหน้าแรกแสดงสูงสุด 2 รายการ + ปุ่มเปิด Modal รวมวัน (`4c1ba9b`)

- **การตัดสินใจผ่าน `/grill-me`**:
  1. **ปฏิทินรายเดือนหน้าแรก (`app/components/PublicCalendar.tsx`)**: เดิมแสดงทุกรายการและมี scrollbar ในช่องวัน ปรับเป็นแสดง 2 รายการแรก และหากมีรายการที่ 3 ขึ้นไปจะแสดงปุ่ม `+อีก N รายการ` เมื่อคลิกจะเปิด Day Events Modal รวมรายการของวันนั้น พร้อมกดดูรายละเอียดรายใบได้
  2. **สถานที่อนุมัติ**: สรุปคงไว้เฉพาะในหน้าผู้ดูแล (`/admin`) เท่านั้น ไม่เปิดให้อนุมัติจากหน้าแรก เพื่อความปลอดภัย (Auth Guard & PDPA)
- ตรวจสอบ: tests 69/69, typecheck, build:worker ผ่าน; deploy `08f66546-8a9c-4a94-b7ec-2cb70daf6f28`

### 0.1 ปุ่มจองห้อง × 2 บนหน้าแรก: คงไว้ทั้งคู่ + room prefill (`4f7d4aa`)

- **ตัดสินใจ (ผู้ใช้เลือกทาง 1)**: ปุ่ม header "จองห้องประชุม" (ทุกหน้า, `app/layout.tsx:69`) และ sidebar CTA "เริ่มจองห้องประชุมนี้" (หน้าแรก, `app/page.tsx:248`) **คงไว้ทั้งสอง** — แต่เดิมทั้งคู่ชี้ `/book` เฉยๆ ไม่ส่ง context ห้อง ทำให้คำว่า "ห้องนี้" เป็นเท็จ
- **แก้แล้ว**: CTA หน้าแรกส่งห้องที่เลือก (แท็บชั้น 7/ชั้น 2) ไปเป็น `/book?room=floor7|floor2`; `/book` อ่าน `?room=` ตอน mount แล้ว prefill `room_id` (รับเฉพาะค่าที่ valid) (`app/book/page.tsx:26`)
- ปุ่ม header ยังชี้ `/book` ธรรมดา (global entry — ไม่มี context ห้องให้ส่ง)
- ตรวจ prod แล้ว: `/book?room=floor2` เลือก "หอประชุมชั้น 2" ✓, `/book?room=floor7` เลือก "ห้องประชุมชั้น 7" ✓, ลิงก์ CTA บน `/` = `/book?room=floor7` ✓; tests 69/69 + typecheck + build:worker ผ่าน; deploy `d980343f-9aa7-4054-b5a0-1ca03d5042e8`
- หมายเหตุ: ห้อง "พระเกี้ยวกลางแจ้ง" บนหน้าแรกไม่อยู่ใน `/book` (ฟอร์มรับเฉพาะ floor2/floor7) — prefill จึงครอบคลุมเฉพาะ 2 ห้องนั้น

### 0.1 รายงานประจำเดือน: จุดเข้าเดียวที่ /stats (`7fca84c`)

- **ตัดสินใจสุดท้ายของผู้ใช้**: ปุ่ม "รายงานประจำเดือน" มีจุดเดียวพอ — อยู่บนหน้า /stats (public) — และ**ลบปุ่มในแดชบอร์ดผู้ดูแลออก**
- **ลบ `/admin/report` route ทิ้ง** (orphaned หลังลบปุ่ม) — เหลือเพียง `/report` (public, no login) เป็น single source of truth; `ReportToolbar` มี props `basePath`/`backHref` ไว้ reuse
- **PDF: ไม่สร้าง** — ปุ่มพิมพ์ print dialog save เป็น PDF ได้อยู่แล้ว (A4 + TH Sarabun ตรงเทมเพลต); การสร้าง PDF ฝั่ง server บน Workers ต้องพึ่ง service ใหม่ ไม่คุ้ม
- **LINE ปฏิเสธ/ยกเลิก ไม่แจ้ง = ถูกต้องตาม design** (push immutable, โควตา LINE, staff ดูสถานะใน dashboard) — ถ้าอนาคตต้องการ แนะนำ text สั้น ไม่ใช่ flex card
- ตรวจ prod แล้ว: `/report` = 200, `/admin/report` = 404 (ลบแล้ว), ปุ่มบน /stats แสดง; tests 69/69 + typecheck + build:worker ผ่าน; deploy `c768c653-99bf-473e-aa80-90d96bd898dd`
- ประวัติการตัดสินใจ: `eea4ba7` เปิด `/report` public + ปุ่มทั้ง /stats และแดชบอร์ด → ผู้ใช้สั่ง "จุดเดียวพอ ลบในผู้ดูแลออก" → `7fca84c`

### 0.1 แก้ชื่อรายงานประจำเดือน (`e613183`)

- ลบคำว่า "และสิ่งอำนวยความสะดวก" ออกจากหัวรายงาน — เหลือ "รายงานสรุปการใช้บริการห้องประชุม" (`app/admin/report/page.tsx:89`)
- ตรวจแล้วว่า build output ไม่มีชื่อเก่าค้าง; tests 69/69 + typecheck + build:worker ผ่าน; deploy `813dc22c-2191-416b-8af6-b4b5cc41ec71`
- `03d2b69` — แก้ชื่อหน่วยงานผู้รับผิดชอบข้อมูลเป็น "งานอาคารสถานที่ ศูนย์การศึกษาลำปาง" (ตัด "และกายภาพ" ออก); deploy `e7a3d194-3cad-4383-aa05-937c535755f5`

### 1. ตรวจ Responsive ครบทุกหน้า (Desktop + Mobile) และแก้จุดที่พัง

- ตรวจด้วย Chrome DevTools (device emulation) ครบทุกหน้า: `/`, `/book` (ขั้นตอน 1–5), `/book/success`, `/stats`, `/admin/login`, `/admin` — ที่ viewport 320/360/375/1280px
- ผลตรวจ: ไม่มี horizontal overflow ทุกหน้า, touch targets ≥ 44px, console error = 0
- **Fix ที่ทำ**:
  - `bcbe9c2` / `694347b` — nav ล้นขอบขวาบนจอแคบ: ลด gap โลโก้ + เพิ่ม tier ปุ่ม "จอง" (เต็ม ≥420px / "จองห้อง" ≥375px / "จอง" ต่ำกว่านั้น) + brand truncate (`app/layout.tsx`)
  - `554300d` — toggle แจ้งเตือน LINE ขยาย hit area เป็น 64×44px ด้วย pseudo-element `before:-inset-2.5` (ภาพเดิม) (`app/admin/page.tsx`)
  - `31a1453` — หลัง login nav เคยค้าง "เข้าสู่ระบบ" จนกว่า reload: เปลี่ยน `router.push` เป็น `window.location.assign("/admin")` ให้ server layout อ่าน session สด (`app/admin/login/page.tsx`)

### 2. หน้ารายงานสรุปการใช้ห้องประชุมประจำเดือน (`acdfeb9`)

- **เส้นทางใหม่**: `/admin/report` (เฉพาะผู้ดูแล — ตรวจ `admin_session` cookie ฝั่ง server) + ปุ่ม "รายงานประจำเดือน" บน dashboard
- **ฟอร์มตามเทมเพลตราชการ**: พิมพ์ A4 แนวตั้ง 1 หน้าพอดี (`@page A4 15mm`) ฟอนต์ TH Sarabun New 16pt (มี webfont Sarabun สำรอง) — พิมพ์/บันทึก PDF ผ่าน print dialog ของเบราว์เซอร์ ไม่ใช้ PDF library
- **โครงสร้างรายงาน** (ตามเทมเพลต RTF ของผู้ใช้): ① สรุปภาพรวม ② ตารางรายห้อง (ครั้ง/ชม./%/โครงการหลัก) ③ จำแนกตามประเภทการใช้งาน ④ การยกเลิก ⑤ ยืนยันจากระบบ
- **การตัดสินใจออกแบบ (จากข้อจำกัดข้อมูล)**: หน่วยงานหลักใช้ `project_name`, วัตถุประสงค์ map จาก `meeting_type` (seminar→อบรม/สัมมนา, small_group→ประชุม, wedding→พิธีมงคล), **ตัดหัวข้อ No-Show ออก** (ระบบไม่เก็บข้อมูล), utilization = ชม.ใช้ ÷ (วันทำการ × 8 ชม. × จำนวนห้อง)
- **ไฟล์ใหม่**: `lib/monthly-report.ts` (aggregate, reuse ICT helper จาก lib/stats.ts), `app/admin/report/page.tsx`, `app/components/ReportToolbar.tsx` (เลือกย้อนหลัง 12 เดือน + ปุ่มพิมพ์)
- **ตรวจข้อมูลจริงแล้ว (1 พ.ย. 2569)**: seed demo ลง local D1 (เดือน ต.ค. 2026 = 11 approved/1 cancelled/2 pending) แล้วเปิด `/admin/report?month=2026-10` ผ่าน wrangler dev — ตัวเลขทุกช่องตรง expected 100% (รวม 11 ครั้ง/34 ชม./9.7%, ชั้น 2: 6/18/10.2%, ชั้น 7: 5/16/9.1%, top project, จำแนก 100% seminar, ยกเลิก 1) — ยังค้าง: การพิมพ์ PDF จริงจากเบราว์เซอร์ (Ctrl+P) ควรลอง 1 ครั้ง

---

## 🎨 สรุปการปรับปรุง UI/UX (Modern Tech Bento Grid Redesign)

1. **แก้ปัญหาภาพโดนตัด (Aspect Ratio Fix)**:
   - ปรับอัตราส่วนภาพเป็น `aspectRatio: "16 / 7"` เต็มความกว้าง ป้องกัน `object-cover` ตัดด้านข้างบนหน้าจอทุกขนาด
2. **เปลี่ยนจาก Dark Theme สู่ Light Tech Theme**:
   - ปลด Ambient Aurora Blobs มืดทึบ และ Gradient พื้นหลังออก
   - ใช้โทนสีหลักพื้นหลังสะอาด `#f8f8fc` ตัดกับสีม่วงอัตลักษณ์ของมหาวิทยาลัย `#582c83` และสีทองอำพัน `#b8860b`
3. **Bento Grid Hero Section & Tech Showcase**:
   - **Interactive Tab Switcher**: สลับดูข้อมูลระหว่าง *ห้องประชุมชั้น 7 (450 คน)* และ *หอประชุมชั้น 2 (250 คน)* ได้ทันที
   - **Live Availability Console**: แสดงเวลาทำการ 08:30 – 16:30 น. วันที่ไทย พ.ศ. และสถานะระบบเปิดรับจองปกติ พร้อมปุ่มเริ่มจองทันที
   - **Feature & Amenity Cards**: แสดงไอคอน Wi-Fi ความเร็วสูง, จอแสดงผล LED & โสตทัศนูปกรณ์, บริการจัดเลี้ยงอาหาร และปฏิทินตรวจสอบคิวว่างโปร่งใส
4. **LINE Messaging API Console & Notification Control**:
   - เพิ่ม UI ควบคุมการแจ้งเตือน LINE ในหน้าผู้ดูแลระบบ (`/admin`)
   - สวิตช์ Toggle เปิด/ปิดการแจ้งเตือนสด บันทึกลง D1 `system_settings`
   - ปุ่มกด "ทดสอบส่ง (Ping)" ส่งข้อความทดสอบจริงเข้ากลุ่ม LINE ทันที
   - แจ้งเตือนเข้ากลุ่ม 2 จังหวะ: เมื่อมีคำขอจองใหม่ (Pending) และเมื่ออนุมัติ (Approved)
5. **ระบบจัดการผู้ดูแลระบบและกำหนดรหัสผ่าน (Superadmin RBAC & User Management)**:
   - บัญชี `chookait` ได้รับสิทธิ์เป็น **Superadmin** มีป้ายสัญลักษณ์ `★ Superadmin`
   - ปุ่ม "👥 จัดการผู้ดูแลระบบ" บน Header เปิดหน้าต่าง User Management Modal (แสดงเฉพาะ Superadmin)
   - ฟังก์ชันกำหนด/รีเซ็ตรหัสผ่านใหม่ (Set/Reset Password) ให้กับ Admin ท่านอื่นในระบบ
   - ฟังก์ชันเพิ่มผู้ดูแลระบบใหม่ (Add Admin) และลบผู้ดูแลระบบ (Delete Admin)
   - ระบบป้องกันความปลอดภัย (Guardrails): บล็อกไม่ให้ลบบัญชีตนเอง และบล็อกไม่ให้ลบบัญชี Superadmin หลัก
6. **Accessibility & Code Quality**:
   - Touch Target $\ge$ 44px
   - กำหนด `overflow-x: clip` บน `html` และ `body`
   - ปรับแต่งการเคลื่อนไหวรองรับ `prefers-reduced-motion`

---

## 🛠️ Stack & Infrastructure

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Runtime & Deployment**: Cloudflare Workers via `@opennextjs/cloudflare`
- **Styling**: Tailwind CSS v4 + Lucide-React
- **Database**: Cloudflare D1 (SQLite-based serverless DB)
- **Workflow Automation**: Auto-commit & auto-deploy pipeline triggered upon test passing (persisted in `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`)
- **Admin Display Names & Roles**:
  - `chookait`: ชูเกียรติ กุศลสถิตย์ (Role: `superadmin`)
  - `pathaithep`: ไผทเทพ ตุทานนท์ (Role: `admin`)
  - `nathlada`: นาถลดา ศรียะพันธ์ (Role: `admin`)
- **Session Duration**: 8 ชั่วโมง (ตรวจจับอัตโนมัติในเบื้องหลัง พร้อมกล่องแจ้งเตือนและส่งกลับหน้า Login)
- **Latest Deployed Version**: `c4439204-f132-486e-8b5d-fc0bcc5f86c7` (Commit: `f56128c`)

---

## 🚀 คำสั่งการพัฒนาและ Deploy

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันโหมด Development ในเครื่อง
npm run dev

# 3. ตรวจสอบ Type
npm run typecheck

# 4. ทดสอบระบบ
npm test

# 5. Build Cloudflare Worker
npm run build:worker

# 6. Deploy ขึ้น Cloudflare Workers Production
npm run deploy

# 7. Apply D1 Migrations (กรณีมีการอัปเดตสคีมาฐานข้อมูล)
npm run d1:migrate:remote
```
