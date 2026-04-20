"use client";

import React, { useMemo, useState } from "react";
import { WalletMoney, CardReceive, CardSend, DocumentText, Document } from "iconsax-react";
import { Download, ListFilter } from "lucide-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { ProviderHeader } from "@/components/provider/provider-header";
import { ProviderRow, ProviderTable } from "@/components/provider/provider-table";


const BASE_ROWS: Omit<ProviderRow, "id">[] = [
  { name: "Monnify",    category: "Withdrawal",    dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 5,  status: "Active"   },
  { name: "Quidax",    category: "Crypto",         dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 10, status: "Active"   },
  { name: "MTN",       category: "Airtime & Data", dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 40, status: "Inactive" },
  { name: "Baxi",      category: "Bills Payment",  dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 1,  status: "Active"   },
  { name: "Spectranet", category: "Internet",      dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 2,  status: "Active"   },
  { name: "IKEDC",     category: "Electricity",    dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 40, status: "Active"   },
  { name: "Flutterwave", category: "Payments",     dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 8,  status: "Active"   },
  { name: "Paystack",  category: "Payments",       dateAdded: "Jan 6, 2026 | 9:32AM", lastUpdated: "Jan 6, 2026 | 9:32AM", noOfProducts: 6,  status: "Active"   },
];

const ALL_ROWS: ProviderRow[] = Array.from({ length: 180 }, (_, i) => {
  const base = BASE_ROWS[i % BASE_ROWS.length];
  return {
    ...base,
    id: `provider-${i}`,
    name: i < BASE_ROWS.length ? base.name : `${base.name} (${i + 1})`,
  };
});

const TOTAL = 100000;
const ACTIVE = 100000;
const INACTIVE = 50000;

type StatCardProps = {
  label: string;
  value: string;
  accentColor: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, accentColor, icon }: StatCardProps) {
  return (
    <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border gap-[13px] border-outline bg-white px-5 py-4">
      <div
        className="absolute left-0 h-full top-0 bottom-0 w-[4px] rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-start justify-between">
        <span className="text-[13px] text-zinc-400">{label}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-outline text-zinc-400">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold text-primary-text">{value}</p>
    </div>
  );
}

export function ProviderView() {
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [exportOpen, setExportOpen] = useState(false);

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return ALL_ROWS;
    return ALL_ROWS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
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
      <ProviderHeader />

      {/* Stat cards */}
      <div className="mt-6 flex gap-3">
        <StatCard label="Total Providers" value={TOTAL.toLocaleString()} accentColor="var(--color-primary-green)" icon={<WalletMoney size="20" color="currentColor" variant="Outline" />} />
        <StatCard label="Active Providers" value={ACTIVE.toLocaleString()} accentColor="var(--color-vivid-azure)" icon={<CardReceive size="20" color="currentColor" variant="Outline" />} />
        <StatCard label="Inactive Providers" value={INACTIVE.toLocaleString()} accentColor="var(--color-failed)" icon={<CardSend size="20" color="currentColor" variant="Outline" />} />
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <div className="w-[325px] shrink-0">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by name or ID"
            aria-label="Search by name or ID"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
            aria-label="Filter"
          >
            <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
            >
              <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
              Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <DocumentText size={18} variant="Outline" color="currentColor" />
                      CSV
                    </button>
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <Document size={18} variant="Outline" color="currentColor" />
                      PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ProviderTable rows={paginatedRows} />

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
