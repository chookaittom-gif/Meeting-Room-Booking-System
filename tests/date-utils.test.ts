import { describe, it, expect } from "vitest";
import { formatThaiDateString, formatThaiEpochDate, formatThaiEpochTime } from "../lib/date-utils";

describe("Date Utilities - Thai Buddhist Era", () => {
  it("should format YYYY-MM-DD string to Thai Buddhist date (31 ตุลาคม 2569)", () => {
    expect(formatThaiDateString("2026-10-31")).toBe("31 ตุลาคม 2569");
    expect(formatThaiDateString("2026-11-16")).toBe("16 พฤศจิกายน 2569");
    expect(formatThaiDateString("2026-01-01")).toBe("1 มกราคม 2569");
    expect(formatThaiDateString("2026-12-31")).toBe("31 ธันวาคม 2569");
  });

  it("should handle empty or invalid date strings gracefully", () => {
    expect(formatThaiDateString("")).toBe("");
    expect(formatThaiDateString("invalid")).toBe("invalid");
  });

  it("should format epoch seconds to Thai Buddhist date and time", () => {
    // 2026-10-31 09:00:00 Bangkok time (UTC+7)
    // 2026-10-31 02:00:00 UTC
    const epochSec = Math.floor(Date.UTC(2026, 9, 31, 2, 0, 0) / 1000);
    expect(formatThaiEpochDate(epochSec)).toBe("31 ตุลาคม 2569");
    expect(formatThaiEpochTime(epochSec)).toBe("09:00 น.");
  });

  it("should support short month when requested", () => {
    const epochSec = Math.floor(Date.UTC(2026, 9, 31, 2, 0, 0) / 1000);
    expect(formatThaiEpochDate(epochSec, false)).toBe("31 ต.ค. 2569");
  });
});
