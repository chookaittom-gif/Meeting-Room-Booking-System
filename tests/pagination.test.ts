import { describe, it, expect } from "vitest";

describe("Pagination Logic", () => {
  const PAGE_SIZE = 10;

  it("should calculate correct slice boundaries for first page", () => {
    const totalItems = 35;
    const currentPage = 1;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
    const startIdx = (safePage - 1) * PAGE_SIZE;
    const endIdx = safePage * PAGE_SIZE;

    expect(safePage).toBe(1);
    expect(totalPages).toBe(4);
    expect(startIdx).toBe(0);
    expect(endIdx).toBe(10);
  });

  it("should calculate correct slice boundaries for intermediate page", () => {
    const totalItems = 35;
    const currentPage = 2;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
    const startIdx = (safePage - 1) * PAGE_SIZE;
    const endIdx = safePage * PAGE_SIZE;

    expect(safePage).toBe(2);
    expect(startIdx).toBe(10);
    expect(endIdx).toBe(20);
  });

  it("should clamp page numbers safely when exceeding bounds", () => {
    const totalItems = 15;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE); // 2

    // Over upper bound
    const overPage = 10;
    const safeOverPage = Math.min(Math.max(overPage, 1), Math.max(totalPages, 1));
    expect(safeOverPage).toBe(2);

    // Below lower bound
    const underPage = -5;
    const safeUnderPage = Math.min(Math.max(underPage, 1), Math.max(totalPages, 1));
    expect(safeUnderPage).toBe(1);
  });

  it("should handle empty list (0 items) without crashing", () => {
    const totalItems = 0;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE); // 0
    const safePage = Math.min(Math.max(1, 1), Math.max(totalPages, 1)); // 1

    expect(totalPages).toBe(0);
    expect(safePage).toBe(1);
  });
});
