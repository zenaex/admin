"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ListFilter } from "lucide-react";
import { WalletMoney, CardSend, CardReceive } from "iconsax-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { StatCard } from "@/components/ui/stat-card";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EtradeRequestList } from "@/components/e-trades/etrade-request-list";
import { EtradeTransactionList } from "@/components/e-trades/etrade-transaction-list";
import type { EtradeTabId } from "@/components/e-trades/etrade-types";
import { EtradeLogFlow } from "@/components/e-trades/etrade-log-flow";
import { ProviderHeader } from "@/components/provider/provider-header";
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
import { toApiDateFrom, toApiDateTo } from "@/lib/filters/date-range";
import { useDateRangeFilter, useFilterBar } from "@/lib/filters/use-filter-bar";
import { formatAdminApiError } from "@/lib/admin-api/client";
import {
  downloadExportPayload,
  extractExportRecords,
} from "@/lib/admin-api/export-api";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  getAdminEtradesExport,
  getAdminEtradesList,
  getAdminEtradesSummary,
  toEtradeRequestRow,
  toEtradeTransactionListRow,
  uiStatusToApiStatus,
  uiTradeTypeToApi,
  type AdminEtradeNormalized,
  type AdminEtradeSummaryCards,
} from "@/lib/admin-api/etrades-api";

const TRADE_TYPE_OPTIONS = ["All types", "Exchange Rate", "Percentage"] as const;
const REQ_STATUS_OPTIONS = ["All statuses", "Awaiting Approval"] as const;
const TXN_STATUS_OPTIONS = ["All statuses", "Completed", "Rejected"] as const;

const EMPTY_SUMMARY: AdminEtradeSummaryCards = {
  totalTrades: "—",
  totalTradeVolume: "—",
  awaitingApproval: "—",
};

export function EtradeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<EtradeTabId>("requests");
  const [isLoggingTrade, setIsLoggingTrade] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [summary, setSummary] = useState<AdminEtradeSummaryCards>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [requestRows, setRequestRows] = useState<AdminEtradeNormalized[]>([]);
  const [completedRows, setCompletedRows] = useState<AdminEtradeNormalized[]>([]);
  const [requestTotal, setRequestTotal] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

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
  } = useFilterBar<"type" | "status" | "date">();

  const [draftType, setDraftType] = useState("All types");
  const [draftStatus, setDraftStatus] = useState("All statuses");
  const dateFilter = useDateRangeFilter();
  const { draft: draftDate, setDraft: setDraftDate, applied: appliedDate, applyDraft: applyDateDraft, clear: clearDateFilter, syncDraftFromApplied: syncDateDraft } = dateFilter;
  const [appliedType, setAppliedType] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (tabFromUrl === "transaction-details") {
      setActiveTab("transaction-details");
    } else {
      setActiveTab("requests");
    }
  }, [tabFromUrl]);

  useEffect(() => {
    closeFilterBar();
    setDraftType("All types");
    setDraftStatus("All statuses");
    setAppliedType(null);
    setAppliedStatus(null);
    clearDateFilter();
  }, [activeTab, clearDateFilter, closeFilterBar]);

  const syncAllFilters = useCallback(() => {
    setDraftType(appliedType ?? "All types");
    setDraftStatus(appliedStatus ?? "All statuses");
    syncDateDraft();
  }, [appliedStatus, appliedType, syncDateDraft]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await getAdminEtradesSummary();
      setSummary(data);
    } catch (e) {
      setSummaryError(formatAdminApiError(e, "Could not load e-trade summary."));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadLists = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const search = tableSearch.trim() || undefined;
      const tradeType = appliedType ? uiTradeTypeToApi(appliedType) : undefined;
      const apiStatus = appliedStatus
        ? uiStatusToApiStatus(appliedStatus, activeTab)
        : uiStatusToApiStatus("All statuses", activeTab);
      const activePageNum = activeTab === "requests" ? page : txnPage;

      const res = await getAdminEtradesList({
        tab: activeTab,
        page: activePageNum,
        limit: pageSize,
        search,
        status: apiStatus,
        tradeType,
        fromDate: toApiDateFrom(appliedDate),
        toDate: toApiDateTo(appliedDate),
      });

      if (activeTab === "requests") {
        setRequestRows(res.items);
        setRequestTotal(res.total);
      } else {
        setCompletedRows(res.items);
        setCompletedTotal(res.total);
      }
    } catch (e) {
      setListError(formatAdminApiError(e, "Could not load e-trades."));
    } finally {
      setListLoading(false);
    }
  }, [activeTab, appliedDate, appliedStatus, appliedType, page, pageSize, tableSearch, txnPage]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const typeOptions = useMemo(() => [...TRADE_TYPE_OPTIONS], []);

  const statusOptions = useMemo(
    () => (activeTab === "requests" ? [...REQ_STATUS_OPTIONS] : [...TXN_STATUS_OPTIONS]),
    [activeTab],
  );

  const setTab = (id: EtradeTabId) => {
    setActiveTab(id);
    router.replace(`/dashboard/e-trades?tab=${id}`, { scroll: false });
  };

  const activeTotal = activeTab === "requests" ? requestTotal : completedTotal;
  const activePage = activeTab === "requests" ? page : txnPage;
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));
  const safePage = Math.min(activePage, totalPages);

  const paginatedRequests = useMemo(
    () => requestRows.map(toEtradeRequestRow),
    [requestRows],
  );
  const paginatedTxn = useMemo(
    () => completedRows.map(toEtradeTransactionListRow),
    [completedRows],
  );

  const tradeTypeLabel = activeTab === "requests" ? "Trade type" : "Trade name";

  const handleExport = async (format: "csv" | "pdf") => {
    const payload = await getAdminEtradesExport();
    const filenameBase = `etrades-${activeTab}`;
    if (format === "pdf") {
      const records = extractExportRecords(payload);
      downloadExportPayload(filenameBase, records.length ? records : payload, "pdf");
      return;
    }
    downloadExportPayload(filenameBase, payload, "csv");
  };

  const toolbarSearch = (
    <div className="mt-6 flex h-14.5 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
      <div className="w-full min-w-0 sm:w-[325px]">
        <AuditTrailIconSearch
          variant="toolbar"
          placeholder="Search by name or ID"
          aria-label="Search by name or ID"
          value={tableSearch}
          onChange={(e) => {
            setTableSearch(e.target.value);
            setPage(1);
            setTxnPage(1);
          }}
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
          aria-label="Filter"
          onClick={() => openFilterBar(syncAllFilters)}
        >
          <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          Filter
        </button>

        <TableExportMenu
          disabled={listLoading || (activeTab === "requests" ? paginatedRequests.length === 0 : paginatedTxn.length === 0)}
          onExportCsv={() => void handleExport("csv")}
          onExportPdf={() => void handleExport("pdf")}
        />

        <button
          type="button"
          onClick={() => setIsLoggingTrade(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#C1FF00] px-4 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90 shadow-sm"
        >
          <span className="text-[16px] font-extrabold mr-0.5">+</span>
          Log a Trade
        </button>
      </div>
    </div>
  );

  if (isLoggingTrade) {
    return (
      <EtradeLogFlow
        onBack={() => setIsLoggingTrade(false)}
        onSuccess={() => {
          void loadLists();
          void loadSummary();
        }}
      />
    );
  }

  return (
    <div>
      <ProviderHeader title="Etrades" notificationCount={2} />

      {summaryError ? (
        <div className="mt-4">
          <ErrorAlert error={summaryError} onRetry={() => void loadSummary()} />
        </div>
      ) : null}

      <div className="mt-6 flex min-w-0 gap-3 flex-wrap sm:flex-nowrap">
        <StatCard
          label="Total Trade"
          value={summaryLoading ? "…" : summary.totalTrades}
          accentColor="#C1FF00"
          icon={<WalletMoney size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Trade Volume"
          value={summaryLoading ? "…" : summary.totalTradeVolume}
          accentColor="#3B82F6"
          icon={<CardSend size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Awaiting Approval"
          value={summaryLoading ? "…" : summary.awaitingApproval}
          accentColor="#EF4444"
          icon={<CardReceive size={20} variant="Outline" color="#0B294F" />}
        />
      </div>

      <div className="mt-6 flex items-baseline gap-8 border-b border-zinc-200">
        <div className="relative inline-flex w-fit flex-col">
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`text-sm font-semibold transition-colors pb-3 pt-2.5 px-1 ${
              activeTab === "requests" ? "text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Active Trades
          </button>
          {activeTab === "requests" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary-green rounded-t-full" />
          )}
        </div>
        <div className="relative inline-flex w-fit flex-col">
          <button
            type="button"
            onClick={() => setTab("transaction-details")}
            className={`text-sm font-semibold transition-colors pb-3 pt-2.5 px-1 ${
              activeTab === "transaction-details" ? "text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Completed
          </button>
          {activeTab === "transaction-details" && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary-green rounded-t-full" />
          )}
        </div>
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
                label={tradeTypeLabel}
                summary={draftType}
                pillRef={registerPillRef("type")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "type" ? null : "type";
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
                label="Date"
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
              {openFilter === "type" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="min-w-[220px] max-w-[min(92vw,340px)]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={typeOptions}
                    onSelect={(opt) => {
                      setDraftType(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "status" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={statusOptions}
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
                setAppliedType(draftType === "All types" ? null : draftType);
                setAppliedStatus(draftStatus === "All statuses" ? null : draftStatus);
                applyDateDraft();
                setOpenFilter(null);
                setPage(1);
                setTxnPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedType(null);
                setAppliedStatus(null);
                clearDateFilter();
                setDraftType("All types");
                setDraftStatus("All statuses");
                setOpenFilter(null);
                closeFilterBar();
                setPage(1);
                setTxnPage(1);
              }}
            />
          }
        />
      ) : (
        toolbarSearch
      )}

      {listError ? (
        <div className="mt-4">
          <ErrorAlert error={listError} onRetry={() => void loadLists()} />
        </div>
      ) : null}

      {listLoading ? (
        <TableSkeleton
          columns={activeTab === "requests" ? 7 : 8}
          rows={8}
          headers={
            activeTab === "requests"
              ? ["Trade ID", "Customer", "Request", "Date Created", "Trade Value", "Status", "Action"]
              : [
                  "Trade ID",
                  "Customer",
                  "Request",
                  "Date Created",
                  "Trade Value",
                  "Ops-in-charge",
                  "Status",
                  "Action",
                ]
          }
          className="mt-4 overflow-x-auto rounded-[8px] bg-white border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
          headerRowClassName="bg-[#F9F9F9] text-zinc-400 border-b border-zinc-100"
          headerCellClassName="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle"
          cellVariants={
            activeTab === "requests"
              ? ["text-narrow", "text", "text-wide", "text", "text-narrow", "badge", "icon"]
              : ["text-narrow", "text", "text-wide", "text", "text-narrow", "text", "badge", "icon"]
          }
        />
      ) : activeTab === "requests" ? (
        <EtradeRequestList rows={paginatedRequests} />
      ) : (
        <EtradeTransactionList rows={paginatedTxn} />
      )}

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={activeTotal}
        onPageChange={activeTab === "requests" ? setPage : setTxnPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
          setTxnPage(1);
        }}
      />
    </div>
  );
}
