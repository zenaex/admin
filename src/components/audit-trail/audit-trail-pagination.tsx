"use client";

import { useEffect, useState } from "react";

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
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-600">
      <div className="flex items-center gap-2">
        <span>Show</span>
        <select
          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 pr-8 text-primary-text"
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
      </div>

      <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-lg px-2 py-1.5 font-medium text-primary-text disabled:opacity-40"
        >
          « Previous
        </button>
        {pageNumbers.map((item, i) =>
          item === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={[
                "inline-flex h-8 min-w-8 items-center justify-center rounded-full text-sm font-medium",
                item === safePage ? "bg-primary-green text-primary-text" : "text-primary-text hover:bg-zinc-100",
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
          className="rounded-lg px-2 py-1.5 font-medium text-primary-text disabled:opacity-40"
        >
          Next »
        </button>
      </nav>

      <div className="flex items-center gap-2">
        <span>Go to</span>
        <input
          type="text"
          inputMode="numeric"
          className="h-9 w-14 rounded-lg border border-zinc-200 bg-white px-2 text-center text-primary-text"
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
