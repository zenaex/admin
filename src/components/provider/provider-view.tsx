"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { WalletMoney, CardReceive, CardSend } from "iconsax-react";
import { CalendarDays } from "lucide-react";

import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { ProviderHeader } from "@/components/provider/provider-header";
import { ProviderRow, ProviderTable } from "@/components/provider/provider-table";
import {
  TableFilterApplyClear,
  TableFilterDatePanel,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  formatDateRangeLabel,
} from "@/components/ui/table-filter-bar";
import { matchesDateRangeFilter } from "@/lib/filters/date-range";
import { useDateRangeFilter, useFilterBar } from "@/lib/filters/use-filter-bar";
import { AdminApiError } from "@/lib/admin-api/client";
import { getAdminProvidersList } from "@/lib/admin-api/providers-api";
import type { AdminProviderListRow } from "@/lib/admin-api/types";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { StatCard } from "@/components/ui/stat-card";

const STATUS_FILTER_OPTIONS = ["All statuses", "Active", "Inactive"] as const;

function formatCount(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

export function ProviderView() {
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const {
    filterMode,
    openFilter,
    setOpenFilter,
    toggleFilter,
    openFilterBar,
    closeFilterBar,
    filterBarRef,
    filterScrollRef,
    dropdownLeft,
    registerPillRef,
    syncDropdownLeft,
  } = useFilterBar<"category" | "status" | "date">();

  const [draftCategory, setDraftCategory] = useState("All categories");
  const [draftStatus, setDraftStatus] = useState<string>("All statuses");
  const dateFilter = useDateRangeFilter();
  const { draft: draftDate, setDraft: setDraftDate, applied: appliedDate, applyDraft: applyDateDraft, clear: clearDateFilter, syncDraftFromApplied: syncDateDraft } = dateFilter;
  const [appliedCategory, setAppliedCategory] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [listRows, setListRows] = useState<AdminProviderListRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [summaryTotal, setSummaryTotal] = useState<number | undefined>();
  const [summaryActive, setSummaryActive] = useState<number | undefined>();
  const [summaryInactive, setSummaryInactive] = useState<number | undefined>();
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["All categories"]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(tableSearch.trim()), 320);
    return () => window.clearTimeout(t);
  }, [tableSearch]);

  const syncAllFilters = useCallback(() => {
    setDraftCategory(appliedCategory ?? "All categories");
    setDraftStatus(appliedStatus ?? "All statuses");
    syncDateDraft();
  }, [appliedCategory, appliedStatus, syncDateDraft]);

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const needsClientDateFilter = Boolean(appliedDate?.from);
      const res = await getAdminProvidersList({
        search: debouncedSearch || undefined,
        status: appliedStatus ?? undefined,
        category: appliedCategory ?? undefined,
        page: needsClientDateFilter ? 1 : page,
        pageSize: needsClientDateFilter ? 100 : pageSize,
      });
      setListRows(res.items);
      setListTotal(res.total);
      setSummaryTotal(res.summary.totalProviders);
      setSummaryActive(res.summary.activeProviders);
      setSummaryInactive(res.summary.inactiveProviders);

      const categories = Array.from(
        new Set(res.items.map((r) => r.category).filter((c) => c && c !== "—")),
      ).sort();
      if (categories.length > 0) {
        setCategoryOptions((prev) => {
          const merged = new Set([...prev.filter((p) => p !== "All categories"), ...categories]);
          return ["All categories", ...Array.from(merged).sort()];
        });
      }
    } catch (e) {
      setListRows([]);
      setListTotal(0);
      setSummaryTotal(undefined);
      setSummaryActive(undefined);
      setSummaryInactive(undefined);
      setListError(
        e instanceof AdminApiError
          ? e.status === 0
            ? "API URL is not configured. Set NEXT_PUBLIC_ADMIN_API_URL in .env.local and restart the dev server."
            : e.message
          : "Could not load providers.",
      );
    } finally {
      setListLoading(false);
    }
  }, [appliedCategory, appliedDate, appliedStatus, debouncedSearch, page, pageSize]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const filteredRows = useMemo(() => {
    return listRows.filter((row) => matchesDateRangeFilter(appliedDate, row.dateAdded));
  }, [appliedDate, listRows]);

  const paginationTotal = filteredRows.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(Math.max(paginationTotal, 1) / pageSize)));
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, pageSize, safePage]);

  const totalDisplay = summaryTotal ?? paginationTotal;
  const activeDisplay = summaryActive;
  const inactiveDisplay = summaryInactive;

  return (
    <div>
      <ProviderHeader />

      <div className="mt-6 flex gap-3">
        <StatCard
          label="Total Providers"
          loading={listLoading}
          value={formatCount(totalDisplay)}
          accentColor="var(--color-primary-green)"
          icon={<WalletMoney size="20" color="currentColor" variant="Outline" />}
        />
        <StatCard
          label="Active Providers"
          loading={listLoading}
          value={formatCount(activeDisplay)}
          accentColor="var(--color-vivid-azure)"
          icon={<CardReceive size="20" color="currentColor" variant="Outline" />}
        />
        <StatCard
          label="Inactive Providers"
          loading={listLoading}
          value={formatCount(inactiveDisplay)}
          accentColor="var(--color-failed)"
          icon={<CardSend size="20" color="currentColor" variant="Outline" />}
        />
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
                summary={formatDateRangeLabel(draftDate, "All time")}
                pillRef={registerPillRef("date")}
                onClick={() => toggleFilter("date")}
              />
            </>
          }
          pillsTrailing={
            <TableFilterTrailingIconButton ariaLabel="Calendar" onClick={() => toggleFilter("date")}>
              <CalendarDays size={14} />
            </TableFilterTrailingIconButton>
          }
          dropdownLayer={
            <>
              {openFilter === "category" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[220px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={categoryOptions}
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
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-auto">
                  <TableFilterDatePanel value={draftDate} onChange={setDraftDate} />
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedCategory(draftCategory === "All categories" ? null : draftCategory);
                setAppliedStatus(draftStatus === "All statuses" ? null : draftStatus);
                applyDateDraft();
                setOpenFilter(null);
                closeFilterBar();
                setPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedCategory(null);
                setAppliedStatus(null);
                clearDateFilter();
                setDraftCategory("All categories");
                setDraftStatus("All statuses");
                setOpenFilter(null);
                closeFilterBar();
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <AuditTrailToolbar
          tableSearch={tableSearch}
          onTableSearchChange={setTableSearch}
          onFilterClick={() => openFilterBar(syncAllFilters)}
        />
      )}

      {listError ? (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {listError}
        </p>
      ) : null}

      {listLoading ? (
        <TableSkeleton
          columns={7}
          rows={8}
          headers={[
            "Providers Name",
            "Category",
            "Date Added",
            "Last Updated",
            "No of Products",
            "Status",
            "Action",
          ]}
          headerRowClassName="bg-outline text-zinc-500"
          cellVariants={["text-wide", "text", "text", "text", "text-narrow", "badge", "icon"]}
        />
      ) : (
        <ProviderTable rows={paginatedRows} />
      )}

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={paginationTotal}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
