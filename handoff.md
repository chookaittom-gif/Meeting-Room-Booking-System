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

## 🆕 งานล่าสุด (วันที่ 3 พฤศจิกายน 2569)

### 0.00011 เพิ่มกล่อง 3 ขั้นตอนการจองออนไลน์ เติมเต็มการ์ดสถานะหน้าแรกให้สมดุลสวยงาม (`5da3f6c`)

- `app/page.tsx`:
  - เพิ่มกล่องข้อมูล "3 ขั้นตอนการจองห้องออนไลน์" ใต้กล่องไฮไลต์ 2 ห้องประชุมเดิม (1. เช็กวันว่างในปฏิทิน > 2. ระบุรายละเอียดกิจกรรม ผังที่นั่ง อาหาร > 3. รอผู้ดูแลอนุมัติ)
  - ขจัดปัญหา Dead Space / ช่องว่างสีขาวขนาดใหญ่บนจอคอมพิวเตอร์ ช่วยให้ความสูงการ์ดคอลัมน์ขวาบาลานซ์พอดีกับรูปภาพและรายละเอียดการ์ดห้องประชุมฝั่งซ้ายอย่างเป็นธรรมชาติ
  - ผู้ใช้งานได้รับข้อมูลที่ช่วยในการตัดสินใจและเข้าใจขั้นตอนได้ทันทีก่อนกดปุ่ม CTA
- Deployed Version: `798edaed-d1b2-4858-bb76-3b6d5d4614fb` (commit `5da3f6c`)

### 0.00010 แก้กล่องโล่งในการ์ดสถานะหน้าแรกบนจอคอม (`7e1d6dd`)

- `app/page.tsx`: เอา `flex-1`/`justify-center` ออกจากกล่อง "2 ห้องประชุมมาตรฐาน" (ถูกยืดตามความสูงการ์ดห้องฝั่งซ้ายจนโล่ง) และใส่ `mt-auto` ให้ปุ่ม "เริ่มจองห้องประชุมนี้" ชิดล่างการ์ด
- Deployed Version: `4a0d98da-a9cb-4b4f-b341-4aa3fb7f82ec` (commit `7e1d6dd`)

### 0.00009 ปรับปรุง UI เว้นระยะห่างและความกระชับรองรับทั้งคอมและมือถือ (Desktop & Mobile Responsive) (`e1665de`)

- `app/layout.tsx` & `app/components/Footer.tsx`:
  - ขยายความกว้างโครงสร้างหลัก Header, Main Content, และ Footer จาก `max-w-5xl` (1024px) เป็น `max-w-7xl` (1280px) ขอบซ้าย-ขวาตรงกันทุกองค์ประกอบ ลดพื้นที่ว่างโล่งด้านข้างบนจอคอมพิวเตอร์แบบ Widescreen
  - ปรับ Padding แนวตั้งของ Main Container ให้กระชับขึ้นเป็น `py-5 sm:py-6`
- `app/admin/page.tsx`:
  - **Header Card แดชบอร์ด**: ปรับลดขนาดและ Padding จาก `rounded-3xl p-5 sm:p-7` เป็น `rounded-2xl p-4 sm:p-6` กระชับสมส่วน สวยงามทันสมัย
  - **Stats Filter HUD (5 สถานะ)**: บนจอมือถือจัดแบบสมดุล ให้ปุ่ม "ทั้งหมด" กว้างเต็ม 2 คอลัมน์ (`col-span-2`) และอีก 4 สถานะแบ่งเป็น 2x2 (`col-span-1`) ขจัดปัญหาเศษติ่ง 1 ช่องบนมือถือ ส่วนบนจอคอมแสดง 5 คอลัมน์เต็มตา
  - **Search & Filter Bar**: ปรับมุมโค้งเป็น `rounded-2xl` พร้อมปรับ dropdown เลือกห้องให้ยืดเต็มจออย่างเป็นระเบียบเมื่อแสดงผลบนมือถือ
  - **Bookings Cards & Actions**: ลดขนาดความเทอะทะเป็น `rounded-2xl p-4 sm:p-5` พร้อมจัดแถวปุ่ม Action ท้ายการ์ดให้ Wrap อย่างสวยงามบนมือถือโดยไม่ล้นจอ และคง Touch Target $\ge$ 44px
- Deployed Version: `40436bd6-2252-4ebf-954f-d6050c30cf7f` (commit `e1665de`)

### 0.00008 ปรับปรุงรูปแบบข้อความแจ้งเตือน Telegram ใส่ไอคอนและเส้นคั่นให้อ่านง่าย (`ba2a114`)

- `lib/telegram-service.ts`:
  - เพิ่มไอคอนนำหน้าทุกหัวข้อ (`🔖 รหัสการจอง`, `📌 กิจกรรม`, `📁 โครงการ`, `🏢 ห้อง`, `📅 วันที่`, `⏰ เวลา`, `👥 ผู้เข้าร่วม`, `🏷️ ประเภท`, `🪑 ผังห้อง`, `👤 ผู้ประสานงาน`, `🎤 อุปกรณ์`, `🍽️ อาหาร/เครื่องดื่ม`)
  - แยกบรรทัดวันที่และเวลาชัดเจน พร้อมใส่เส้นคั่น `━━━━━━━━━━━━━━━━━━━━`
  - ครอบคลุมทั้งข้อความคำขอจองใหม่ (รออนุมัติ), ข้อความอนุมัติการจอง และข้อความทดสอบการเชื่อมต่อ
- `tests/phase11-staff-role.test.ts`: ปรับเวลาสร้างการจองทดสอบให้อยู่ในช่วง 08:30–16:30 ICT เสมอ
- Deployed Version: `a697b955-06bf-4a13-970e-abde84d9dbff` (commit `ba2a114`)

### 0.00007 ย้ายช่องเลือกสิทธิ์ Admin/Staff ไปไว้ในฟอร์มเพิ่มผู้ดูแลระบบใหม่ (`a569dd7`)

- `app/components/AdminUserManagementModal.tsx`: ย้ายบล็อกเลือกสิทธิ์ (Admin / Staff ฝ่ายอาหาร) ออกจากหน้ารีเซ็ตรหัสผ่านมาไว้ในฟอร์มเพิ่มผู้ดูแลระบบใหม่ ตั้งค่าเริ่มต้นเป็น `admin` และรีเซ็ตกลับเป็น `admin` ทุกครั้งที่เปิดฟอร์มหรือเพิ่มสำเร็จ
- Deployed Version: `85f9ab1a-8375-4cf3-b00f-b10310027cea`

### 0.00006 เพิ่มบทบาท Staff (ฝ่ายอาหาร / ดูข้อมูลอย่างเดียว) + ตัวกรองอาหารบน Dashboard (`8288d3a`)

- **สิทธิ์ Staff (เจ้าหน้าที่ฝ่ายโภชนาการ/ฝ่ายอาหาร - Read-Only)**:
  - รองรับการล็อกอินเข้าสู่ระบบ `/admin` เพื่อดูข้อมูลการจองทั้งหมด เบอร์ผู้ประสานงาน รายการอาหาร/เครื่องดื่ม และค่าใช้จ่าย
  - บล็อกสิทธิ์การอนุมัติ/ไม่อนุมัติ/ยกเลิกการจอง และการตั้งค่า LINE/Telegram (Server คืนค่า 403 Forbidden, ซ่อนปุ่มบน UI)
  - รองรับการสร้างและสลับสิทธิ์ Admin / Staff โดย Superadmin ในหน้าจัดการผู้ดูแลระบบ
- **UI & Dashboard Enhancements**:
  - แสดงกล่องสรุปรายการอาหารและจำนวนชุดบนการ์ดรายการจองโดยตรง (ไม่ต้องกดเปิด Modal ดูทีละใบ)
  - เพิ่มปุ่มตัวกรองด่วน "มีอาหาร" ในแถบค้นหาหน้าหลังบ้าน
- **Database & Verification**:
  - D1 Migration `0007_add_staff_role.sql` อัปเดต CHECK constraint รองรับ `'staff'`
  - Vitest Unit/Integration Tests 92/92 PASS (เพิ่มชุดทดสอบ `tests/phase11-staff-role.test.ts`)
  - Deployed Version: `91fc759b-10db-48e8-b413-f4e59f4ffdbf`

### 0.00005 แก้ปุ่มหัว admin ตัดบรรทัด, ตารางรายงานล้นกรอบบนมือถือ (`8f0a6a4`)

- `app/admin/page.tsx`: ปุ่ม "จัดการผู้ดูแลระบบ"/"ออกจากระบบ" และป้ายสถานะ LINE ใส่ `whitespace-nowrap` และให้แถวห่อบรรทัดได้ (`flex-wrap`)
- `app/components/MonthlyReportSheet.tsx`: ห่อตารางด้วย `overflow-x-auto`
- `app/book/success/page.tsx`: หัวข้อใส่ `text-balance`
- ผล audit ที่ตรวจแล้วไม่ใช่ปัญหา: สวิตช์ LINE/Telegram มีพื้นที่กดขยาย 48px อยู่แล้ว (`before:-inset-2.5`)

### 0.00004 แก้ stepper หน้าจองล้นจอและตัวอักษรเล็กกว่า 12px ตามผล Hallmark Audit (`ef4e1b1`)

- `app/book/page.tsx`: stepper ลด padding/gap บนมือถือ และแสดง label ตั้งแต่ `lg` (เดิม `md` ทำให้ล้นที่ 768px) — ตรวจบนเว็บจริงที่ 320px/768px ไม่มีการเลื่อนในตัวแล้ว
- เปลี่ยน `text-[11px]`/`text-[10px]` ทั้ง 41 จุดใน 12 ไฟล์ของ `app/` เป็น `text-xs` (12px)

### 0.00003 ปรับปรุง UI & Accessibility ตามผลตรวจ Hallmark Audit (`1808378`)

- **ขจัด `transition-all` ทั้ง 55 จุดทั่วทั้งระบบ (Hallmark Floor Rule 10a)**:
  - แทนที่ด้วย CSS transitions ที่ระบุ property ชัดเจน เช่น `transition-colors`, `transition-[transform,background-color]`, `transition-[border-color,box-shadow]` เพื่อแก้ปัญหา mobile layout reflow และอาการกระตุกขณะเลื่อนหน้าจอ
  - ปรับปรุง 10 ไฟล์หลัก: `app/admin/login/page.tsx`, `app/admin/page.tsx`, `app/book/page.tsx`, `app/book/success/page.tsx`, `app/components/AdminNotificationBell.tsx`, `app/components/AdminUserManagementModal.tsx`, `app/components/StatsCharts.tsx`, `app/components/ThaiDatePicker.tsx`, `app/page.tsx`, `app/stats/page.tsx`
- **ยกระดับ Accessibility (a11y) และความคมชัดของสี (WCAG AA)**:
  - ปรับค่าตัวแปร `--brand-ink-faint` ใน `app/globals.css` จาก `#a1a1aa` เป็น `#71717a` ทำให้ Contrast Ratio เพิ่มขึ้นจาก 3.5:1 เป็น 4.6:1 ผ่านเกณฑ์ WCAG 2.2 Level AA
  - กำหนด `font-size: 1rem` เป็น base บน `body` ใน `app/globals.css`
  - เพิ่ม `aria-required="true"` บนฟิลด์ที่จำเป็นในฟอร์มจอง (`app/book/page.tsx`)
  - ผูก `aria-describedby` กับข้อความคำแนะนำความจุห้องและเจ้าหน้าที่ (`#attendees-hint`, `#staff-hint`)
- **การตรวจรับ**: tests 88/88 PASS, typecheck PASS, build:worker PASS, deploy version `0b5eff29-7e6b-42cb-86ae-2205d0e06cd8`

### 0.00002 ลบข้อความ "ขั้นต่ำ 2 ชั่วโมง" ใต้ช่องระบุเวลา (`ea96c10`)

- **ลบข้อความ "ขั้นต่ำ 2 ชั่วโมง" ออกจากคำแนะนำเวลาใน Step 1 (`app/book/page.tsx`)**:
  - เปลี่ยนจาก: *"เปิดให้บริการ 08:30 – 16:30 น. (ขั้นต่ำ 2 ชั่วโมง จองล่วงหน้าได้ไม่เกิน 30 วัน)"*
  - เปลี่ยนเป็น: *"เปิดให้บริการ 08:30 – 16:30 น. (จองล่วงหน้าได้ไม่เกิน 30 วัน)"*
  - ปรับตามคำสั่ง `/ponytail` กระชับข้อความและไม่แสดงเงื่อนไขขั้นต่ำชั่วโมงบน UI หน้าฟอร์ม

### 0.00001 ปรับข้อความคำบรรยายหน้าสรุปข้อมูลการจอง (`abc5592`)

- **ปรับสำนวนคำบรรยายใต้หัวข้อหน้า 5 (Step 5) ให้เข้าใจง่ายและตรงกับการกระทำ (`abc5592`)**:
  - เปลี่ยนจาก: *"กรุณาตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนกดส่งคำขอ (ราคาทั้งหมดคำนวณและตรวจสอบที่เซิร์ฟเวอร์)"*
  - เปลี่ยนเป็น: *"กรุณาตรวจสอบข้อมูลให้ถูกต้องครบถ้วน ก่อนกดยืนยันและส่งคำขอจอง"*
  - ตัดศัพท์เทคนิคของระบบ ("ตรวจสอบที่เซิร์ฟเวอร์") ซึ่งไม่จำเป็นสำหรับผู้ใช้ทั่วไป และปรับคำกริยาให้สอดคล้องกับปุ่ม "ยืนยันและส่งคำขอจอง" ด้านล่าง

### 0.00000 ค่าห้องจ่ายรายวัน + เงินประกัน 50% + กำหนดจองล่วงหน้าไม่เกิน 30 วัน (`07c55bb`, `3e71aca`, `20c9bc3`, `745b126`)

- **ลดความซ้ำซ้อนข้อความเงินประกันตามหลัก UI/UX (`745b126`)**:
  - ตัดข้อความเรื่องเงินประกันใต้ช่องระบุเวลาออก ให้เหลือเฉพาะเงื่อนไขเวลา: "เปิดให้บริการ 08:30 – 16:30 น. (ขั้นต่ำ 2 ชั่วโมง จองล่วงหน้าได้ไม่เกิน 30 วัน)"
  - คงข้อความหมายเหตุเรื่องเงินประกันไว้ภายในการ์ดอัตราค่าบริการจุดเดียว เพื่อลด Cognitive Load และจัดกลุ่มข้อมูลตรงบริบท (Proximity Principle)
- **ตัดตัวเลือก "ประชุมกลุ่มย่อย" ออกจากหน้าฟอร์ม (`20c9bc3`)**:

- **ตัดตัวเลือก "ประชุมกลุ่มย่อย" ออกจากหน้าฟอร์ม (`20c9bc3`)**:
  - ตัดตัวเลือก "ประชุมกลุ่มย่อย" ออกจาก Dropdown ใน `app/book/page.tsx` เหลือ 2 ตัวเลือก: "อบรมสัมมนาทั่วไป" และ "จัดเลี้ยงและงานแต่งงาน" ตรงตามภาพและความต้องการของผู้ใช้ (Ponytail)
  - ยังคง Type และเรทราคาเดิมใน Backend ไว้อย่างปลอดภัยเพื่อไม่ให้กระทบข้อมูลย้อนหลังใน D1
- **การปรับปรุงเพิ่มเติมตามผล Code Review (`3e71aca`)**:
  - เพิ่มการ์ดแสดงอัตราค่าห้องและเงินประกันแบบ Real-time ใต้ตัวเลือกห้องใน Step 1 ของแบบฟอร์ม (`app/book/page.tsx`)
  - ปรับการคำนวณจำกัดวันจองล่วงหน้าไม่เกิน 30 วันใน Server (`lib/booking-service.ts`) ให้นับเทียบสิ้นสุดวันปฏิทินที่ 30 เวลา 23:59:59 น. (เวลา กทม.) สอดคล้องกับ UI ปฏิทิน 100% ไม่ปฏิเสธรอบบ่ายของวันที่ 30
- **การตัดสินใจผ่าน /plan และ /grill-me**:

- **การปรับปรุงเพิ่มเติมตามผล Code Review (`3e71aca`)**:
  - เพิ่มการ์ดแสดงอัตราค่าห้องและเงินประกันแบบ Real-time ใต้ตัวเลือกห้องใน Step 1 ของแบบฟอร์ม (`app/book/page.tsx`)
  - ปรับการคำนวณจำกัดวันจองล่วงหน้าไม่เกิน 30 วันใน Server (`lib/booking-service.ts`) ให้นับเทียบสิ้นสุดวันปฏิทินที่ 30 เวลา 23:59:59 น. (เวลา กทม.) สอดคล้องกับ UI ปฏิทิน 100% ไม่ปฏิเสธรอบบ่ายของวันที่ 30
- **การตัดสินใจผ่าน /plan และ /grill-me**:

- **การตัดสินใจผ่าน /plan และ /grill-me**:
  1. **โครงสร้างราคาค่าห้องจ่ายรายวัน**:
     - หอประชุมชั้น 2 (`floor2`): 15,000 บาท (อบรมสัมมนาทั่วไป), 20,000 บาท (จัดเลี้ยงและงานแต่งงาน)
     - ห้องประชุมชั้น 7 (`floor7`): 30,000 บาท (อบรมสัมมนาทั่วไป), 35,000 บาท (จัดเลี้ยงและงานแต่งงาน)
     - กำหนดให้ประเภทงาน `seminar` และ `small_group` ใช้เรทอบรมสัมมนาทั่วไป และ `wedding` ใช้เรทจัดเลี้ยงและงานแต่งงาน
  2. **เงินประกันการจองห้อง**: คิด 50% ของค่าห้อง (7,500 / 10,000 / 15,000 / 17,500 บาท) เพื่อวางเงินประกันล่วงหน้า
  3. **การปรับข้อความเวลาให้บริการและจำกัดวันจอง**:
     - ปรับข้อความ: "เปิดให้บริการ 08:30 – 16:30 น. (จองล่วงหน้าได้ไม่เกิน 30 วัน) *วางเงินประกันการจองห้องครึ่งนึงของค่าห้อง"
     - ปรับ Server Validation (`validateBookingPayload`): จาก 60 วัน เหลือไม่เกิน 30 วัน
     - ปรับ `ThaiDatePicker`: จำกัด `maxDaysAhead = 30` ปิดการเลือกวันเกิน 30 วัน
  4. **ฐานข้อมูลและการคำนวณ**:
     - Migration `0006_add_room_fee_deposit.sql` เพิ่ม `room_fee_thb` และ `deposit_thb` ในตาราง `bookings`
     - Server คำนวณราคาค่าห้องและเงินประกันอัตโนมัติ ไม่เชื่อค่าจาก Client
  5. **UI/UX**:
     - เพิ่มการ์ดแสดงอัตราค่าห้องและเงินประกันในหน้าแบบฟอร์ม Step 1
     - แสดงสรุปค่าใช้จ่ายแยก (ค่าห้อง, เงินประกัน, ค่าอาหาร, รวมทั้งสิ้น) ใน Step 5, หน้าส่งคำขอสำเร็จ (`/book/success`) และหน้าจัดการผู้ดูแล (`/admin`)
- **การตรวจรับ**: tests 88/88 PASS, typecheck PASS, build:worker PASS, D1 migration 0006 applied remote, deploy version `b533f9e2-6803-42a7-9f14-8447abd38396`


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
- **Latest Deployed Version**: `85f9ab1a-8375-4cf3-b00f-b10310027cea` (Commit: `a569dd7`)

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
