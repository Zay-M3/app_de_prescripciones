"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-sm transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiChevronLeft size={16} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => {
          // Show first, last, and pages around current
          if (p === 1 || p === totalPages) return true;
          if (Math.abs(p - page) <= 1) return true;
          return false;
        })
        .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
          if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
            acc.push("ellipsis");
          }
          acc.push(p);
          return acc;
        }, [])
        .map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`e-${idx}`} className="px-1 text-muted-foreground">
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item as number)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                page === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent"
              }`}
            >
              {item}
            </button>
          )
        )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-sm transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiChevronRight size={16} />
      </button>
    </div>
  );
}
