"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WalletMoney, CardReceive, CardSend } from "iconsax-react";
import { CalendarDays } from "lucide-react";

import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { ProviderHeader } from "@/components/provider/provider-header";
import { ProviderRow, ProviderTable } from "@/components/provider/provider-table";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";

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

const CATEGORY_FILTER_OPTIONS = ["All categories", ...Array.from(new Set(BASE_ROWS.map((b) => b.category))).sort()];
const STATUS_FILTER_OPTIONS = ["All statuses", "Active", "Inactive"] as const;

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
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "category" | "status" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"category" | "status" | "date">(openFilter, filterMode);

  const [draftCategory, setDraftCategory] = useState("All categories");
  const [draftStatus, setDraftStatus] = useState<string>("All statuses");
  const [draftDateLabel, setDraftDateLabel] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedCategory, setAppliedCategory] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);
  const [appliedDateLabel, setAppliedDateLabel] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  useEffect(() => {
    if (!filterMode) setOpenFilter(null);
  }, [filterMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return ALL_ROWS.filter((r) => {
      if (appliedCategory && appliedCategory !== "All categories" && r.category !== appliedCategory)
        return false;
      if (appliedStatus && appliedStatus !== "All statuses" && r.status !== appliedStatus) return false;
      if (appliedDateLabel && !r.dateAdded.includes("Jan 6, 2026")) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [tableSearch, appliedCategory, appliedStatus, appliedDateLabel]);

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

      {filterMode ? (
        <TableFilterModeBar
          filterBarRef={filterBarRef}
          filterScrollRef={filterScrollRef}
          showBackdrop={Boolean(openFilter)}
          onBackdropClick={() => setOpenFilter(null)}
          onPillsScroll={() => {
            if (openFilter) syncDropdownLeft(openFilter);
          }}
          pills={
            <>
              <TableFilterPill
                label="Category"
                summary={draftCategory}
                pillRef={registerPillRef("category")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "category" ? null : "category";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Status"
                summary={draftStatus}
                pillRef={registerPillRef("status")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "status" ? null : "status";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Date added"
                summary={draftDateLabel}
                pillRef={registerPillRef("date")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "date" ? null : "date";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
            </>
          }
          pillsTrailing={
            <TableFilterTrailingIconButton
              ariaLabel="Calendar"
              onClick={() =>
                setOpenFilter((v) => {
                  const next = v === "date" ? null : "date";
                  syncDropdownLeft(next);
                  return next;
                })
              }
            >
              <CalendarDays size={14} />
            </TableFilterTrailingIconButton>
          }
          dropdownLayer={
            <>
              {openFilter === "category" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[220px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={CATEGORY_FILTER_OPTIONS}
                    onSelect={(opt) => {
                      setDraftCategory(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "status" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[180px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={[...STATUS_FILTER_OPTIONS]}
                    onSelect={(opt) => {
                      setDraftStatus(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "date" ? (
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-[13px] text-primary-text hover:bg-zinc-50"
                    onClick={() => {
                      setDraftDateLabel("From Jan 6, 2026 - To Jan 6, 2026");
                      setOpenFilter(null);
                    }}
                  >
                    Jan 6, 2026 - Jan 6, 2026
                    <CalendarDays size={16} />
                  </button>
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedCategory(draftCategory === "All categories" ? null : draftCategory);
                setAppliedStatus(draftStatus === "All statuses" ? null : draftStatus);
                setAppliedDateLabel(draftDateLabel);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedCategory(null);
                setAppliedStatus(null);
                setAppliedDateLabel(null);
                setDraftCategory("All categories");
                setDraftStatus("All statuses");
                setDraftDateLabel("From Jan 6, 2026 - To Jan 6, 2026");
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <AuditTrailToolbar
          tableSearch={tableSearch}
          onTableSearchChange={setTableSearch}
          onFilterClick={() => {
            setTableSearch("");
            setFilterMode(true);
          }}
        />
      )}

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
