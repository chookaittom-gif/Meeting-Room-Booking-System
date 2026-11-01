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

## 🆕 งานล่าสุด (วันที่ 1 พฤศจิกายน 2569)

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
   - **Interactive Tab Switcher**: สลับดูข้อมูลระหว่าง *ห้องประชุมชั้น 7 (300 คน)* และ *หอประชุมชั้น 2 (100 คน)* ได้ทันที
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
- **Latest Deployed Version**: `73ae92ee-fefd-4c53-b5b3-b5ea79229911` (Commit: `801b1ce`)

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
