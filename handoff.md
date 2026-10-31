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

## 🎨 สรุปการปรับปรุง UI/UX ล่าสุด (Modern Tech Bento Grid Redesign)

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
