"use client";

import { useEffect, useState } from "react";
import { ArrowDown2 } from "iconsax-react";

type AuditTrailPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

function getPageNumbers(totalPages: number, current: number): (number | "ellipsis")[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (i > 0 && p - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(p);
  }
  return out;
}

export function AuditTrailPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: AuditTrailPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageNumbers = getPageNumbers(totalPages, safePage);

  const [goTo, setGoTo] = useState(String(safePage));

  useEffect(() => {
    setGoTo(String(safePage));
  }, [safePage]);

  const goToSubmit = () => {
    const n = parseInt(goTo, 10);
    if (!Number.isFinite(n)) return;
    const next = Math.min(Math.max(1, n), totalPages);
    onPageChange(next);
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className="text-sm font-medium">Show</span>
        <div className="relative">
          <select
            className="h-8 appearance-none rounded-full border border-zinc-500 bg-white px-2.5 pr-8 text-sm text-zinc-500 outline-none"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {[10, 18, 24, 36].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
            <ArrowDown2 size={12} variant="Outline" color="currentColor" />
          </span>
        </div>
      </div>

      <nav
        className="flex flex-wrap items-center gap-1 rounded-full border border-[#E8EBEE] bg-white px-2 py-1 text-zinc-500"
        aria-label="Pagination"
      >
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-full px-2 py-1 text-sm font-medium transition-colors hover:bg-[#F9FAFB] disabled:opacity-40"
        >
          « Previous
        </button>
        {pageNumbers.map((item, i) =>
          item === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1.5 text-zinc-500">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={[
                "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-medium transition-colors",
                item === safePage ? "bg-primary-green text-primary-text" : "text-zinc-500 hover:bg-[#F9FAFB]",
              ].join(" ")}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-full px-2 py-1 text-sm font-medium transition-colors hover:bg-[#F9FAFB] disabled:opacity-40"
        >
          Next »
        </button>
      </nav>

      <div className="flex items-center gap-2 text-zinc-500">
        <span className="text-sm font-medium">Go to</span>
        <input
          type="text"
          inputMode="numeric"
          className="h-8 w-12 rounded-full border border-[#E8EBEE] bg-white px-2 text-center text-sm text-zinc-500 outline-none"
          value={goTo}
          onChange={(e) => setGoTo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToSubmit();
          }}
          aria-label="Go to page"
        />
      </div>
    </div>
  );
}
