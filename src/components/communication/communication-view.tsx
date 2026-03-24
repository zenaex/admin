"use client";

import { useMemo, useState } from "react";

import { CommunicationHeader } from "@/components/communication/communication-header";
import { CommunicationPagination } from "@/components/communication/communication-pagination";
import { CommunicationRow, CommunicationTable } from "@/components/communication/communication-table";
import { CommunicationToolbar } from "@/components/communication/communication-toolbar";

const BASE_ROWS: Omit<CommunicationRow, "id">[] = [
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Publish",
  },
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Publish",
  },
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Unpublished",
  },
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Pending",
  },
];

function buildRows(count: number): CommunicationRow[] {
  return Array.from({ length: count }, (_, i) => {
    const base = BASE_ROWS[i % BASE_ROWS.length];
    return {
      ...base,
      id: `communication-row-${i}`,
      campaign: i < BASE_ROWS.length ? base.campaign : `${base.campaign} ${i + 1}`,
    };
  });
}

const ALL_ROWS = buildRows(180);

export function CommunicationView() {
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return ALL_ROWS;
    return ALL_ROWS.filter(
      (r) =>
        r.campaign.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [tableSearch]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  return (
    <div>
      <CommunicationHeader />
      <CommunicationToolbar tableSearch={tableSearch} onTableSearchChange={setTableSearch} />
      <CommunicationTable rows={paginatedRows} />
      <CommunicationPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
