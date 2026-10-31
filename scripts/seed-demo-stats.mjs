// Generate seed.sql for temporary demo stats data (id prefix "demo-")
// Usage: node scripts/seed-demo-stats.mjs > /tmp/demo-seed.sql
const months = [
  // [YYYY, M, approved, pending, rejected, cancelled] per ICT month (2025-12 .. 2026-10)
  [2025, 12, 3, 0, 1, 0],
  [2026, 1, 5, 1, 1, 0],
  [2026, 2, 4, 0, 0, 1],
  [2026, 3, 7, 1, 0, 1],
  [2026, 4, 8, 0, 1, 0],
  [2026, 5, 6, 1, 0, 0],
  [2026, 6, 9, 1, 1, 1],
  [2026, 7, 12, 0, 0, 1],
  [2026, 8, 10, 1, 0, 0],
  [2026, 9, 13, 1, 1, 1],
  [2026, 10, 11, 2, 0, 1],
];
const rooms = ["floor2", "floor7"];
const items = [
  ["coffee_set1", "ชา/กาแฟ/เครื่องดื่มร้อน + อาหารว่าง 1 อย่าง", 50],
  ["coffee_set2", "ชา/กาแฟ/เครื่องดื่มร้อน + อาหารว่าง 2 อย่าง", 60],
  ["water350", "น้ำเปล่า 350 mL", 5],
  ["juice", "น้ำผลไม้", 40],
  ["afternoon_tea", "Afternoon Tea", 600],
];
let n = 0;
const stmts = [];
for (const [y, m, approved, pending, rejected, cancelled] of months) {
  const plan = [];
  for (let i = 0; i < approved; i++) plan.push("approved");
  for (let i = 0; i < pending; i++) plan.push("pending");
  for (let i = 0; i < rejected; i++) plan.push("rejected");
  for (let i = 0; i < cancelled; i++) plan.push("cancelled");
  plan.forEach((status, idx) => {
    n++;
    const id = `demo-${String(n).padStart(3, "0")}`;
    const room = rooms[n % 2];
    // morning (02:00 UTC = 09:00 ICT) vs afternoon (06:00 UTC = 13:00 ICT)
    const hourUtc = n % 3 === 0 ? 6 : 2;
    const hours = 2 + (n % 3); // 2-4 h
    const day = 2 + (idx * 2) % 25;
    const starts = Math.floor(Date.UTC(y, m - 1, day, hourUtc, 0, 0) / 1000);
    const ends = starts + hours * 3600;
    const attendees = 20 + (n * 7) % 200;
    const stmt = `INSERT INTO bookings (id, request_key, booking_code, room_id, activity_name, project_name, coordinator_name, coordinator_phone, meeting_type, attendees_count, staff_count, table_layout, vvip_seats, vip_seats, starts_at, ends_at, status, total_price_thb, created_at, updated_at) VALUES ('${id}', '${id}_rk', 'BK-DEMO-${String(n).padStart(3, "0")}', '${room}', 'กิจกรรมตัวอย่างสำหรับสถิติ (Demo)', 'โครงการตัวอย่าง (Demo)', 'DEMO-STATS', '0000000000', 'seminar', ${attendees}, 2, 'theater', 0, 0, ${starts}, ${ends}, '${status}', 0, ${starts - 5 * 86400}, ${starts - 5 * 86400});`;
    stmts.push(stmt);
    // attach catering items to most approved bookings
    if (status === "approved" && n % 2 === 0) {
      const it = items[n % items.length];
      const qty = 10 + (n % 5) * 10;
      const subtotal = qty * it[2];
      stmts.push(`INSERT INTO booking_items (id, booking_id, item_code, item_name, quantity, unit_price, subtotal) VALUES ('${id}_i1', '${id}', '${it[0]}', '${it[1]}', ${qty}, ${it[2]}, ${subtotal});`);
      if (n % 4 === 0) {
        const it2 = items[(n + 2) % items.length];
        const qty2 = 5 + (n % 3) * 5;
        stmts.push(`INSERT INTO booking_items (id, booking_id, item_code, item_name, quantity, unit_price, subtotal) VALUES ('${id}_i2', '${id}', '${it2[0]}', '${it2[1]}', ${qty2}, ${it2[2]}, ${qty2 * it2[2]});`);
      }
    }
  });
}
console.log(stmts.join("\n"));
console.error(`Generated ${stmts.length} statements (${n} bookings)`);
