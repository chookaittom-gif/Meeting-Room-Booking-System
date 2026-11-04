"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 border-t border-[#e6e2ea] ${className}`}
      aria-label="การแบ่งหน้า"
    >
      <div className="text-xs text-[#595963] font-medium text-center sm:text-left">
        แสดง <span className="font-bold text-[#18181b]">{startItem}</span> –{" "}
        <span className="font-bold text-[#18181b]">{endItem}</span> จากทั้งหมด{" "}
        <span className="font-bold text-[#582c83]">{totalItems}</span> รายการ
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1.5 flex-wrap justify-center" aria-label="Pagination Navigation">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="หน้าก่อนหน้า"
            className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl border border-[#e4e2ea] bg-white text-xs font-semibold text-[#18181b] hover:bg-[#faf8fd] hover:border-[#582c83]/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#e4e2ea] transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">ก่อนหน้า</span>
          </button>

          {getPageNumbers().map((item, idx) => {
            if (typeof item === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 text-center text-xs text-[#71717a] font-bold select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isCurrent = item === currentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`หน้า ${item}`}
                className={`min-w-[44px] min-h-[44px] px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center ${
                  isCurrent
                    ? "bg-[#582c83] text-white shadow-xs"
                    : "border border-[#e4e2ea] bg-white text-[#18181b] hover:bg-[#faf8fd] hover:border-[#582c83]/30"
                }`}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="หน้าถัดไป"
            className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl border border-[#e4e2ea] bg-white text-xs font-semibold text-[#18181b] hover:bg-[#faf8fd] hover:border-[#582c83]/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-[#e4e2ea] transition-colors flex items-center justify-center gap-1"
          >
            <span className="hidden sm:inline">ถัดไป</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
