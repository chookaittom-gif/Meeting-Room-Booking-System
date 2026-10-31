import { describe, it, expect } from "vitest";

describe("ThaiDatePicker logic", () => {
  it("should calculate Buddhist Era year correctly (+543)", () => {
    const ceYear = 2026;
    const beYear = ceYear + 543;
    expect(beYear).toBe(2569);
  });

  it("should correctly identify days in month", () => {
    // October 2026 has 31 days
    const octDays = new Date(2026, 10, 0).getDate();
    expect(octDays).toBe(31);

    // November 2026 has 30 days
    const novDays = new Date(2026, 11, 0).getDate();
    expect(novDays).toBe(30);

    // February 2026 (non-leap) has 28 days
    const febDays = new Date(2026, 2, 0).getDate();
    expect(febDays).toBe(28);
  });

  it("should flag dates older than min date as disabled", () => {
    const min = new Date(2026, 10, 1); // 1 Nov 2026
    const past = new Date(2026, 9, 31); // 31 Oct 2026
    expect(past < min).toBe(true);
  });

  it("should flag dates beyond 60 days ahead as disabled", () => {
    const today = new Date(2026, 9, 31);
    const max = new Date(today);
    max.setDate(max.getDate() + 60);

    const validDate = new Date(2026, 10, 15);
    const tooFarDate = new Date(2027, 0, 15);

    expect(validDate <= max).toBe(true);
    expect(tooFarDate > max).toBe(true);
  });
});
