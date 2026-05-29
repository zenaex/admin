"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ListFilter, Plus } from "lucide-react";
import { WalletMoney, CardSend, CardReceive } from "iconsax-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { StatCard } from "@/components/ui/stat-card";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import {
  ALL_ETRADE_REQUESTS,
  ETRADE_TYPE_FILTER_OPTIONS,
} from "@/components/e-trades/etrade-mock-requests";
import { ALL_ETRADE_TRANSACTION_ROWS } from "@/components/e-trades/etrade-mock-transactions";
import { EtradeRequestList } from "@/components/e-trades/etrade-request-list";
import { EtradeTransactionList } from "@/components/e-trades/etrade-transaction-list";
import type { EtradeTabId, EtradeRequestRow } from "@/components/e-trades/etrade-types";
import { EtradeLogFlow } from "@/components/e-trades/etrade-log-flow";
import { ProviderHeader } from "@/components/provider/provider-header";
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

const TXN_TYPE_OPTIONS = ["All types", ...Array.from(new Set(ALL_ETRADE_TRANSACTION_ROWS.map((r) => r.title))).sort()];
const REQ_STATUS_OPTIONS = ["All statuses", "Pending", "Successful", "Failed"] as const;
const TXN_STATUS_OPTIONS = ["All statuses", "Successful", "Failed"] as const;

export function EtradeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<EtradeTabId>("requests");
  const [requests, setRequests] = useState<EtradeRequestRow[]>(ALL_ETRADE_REQUESTS);
  const [isLoggingTrade, setIsLoggingTrade] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "type" | "status" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"type" | "status" | "date">(openFilter, filterMode);

  const [draftType, setDraftType] = useState("All types");
  const [draftStatus, setDraftStatus] = useState("All statuses");
  const [draftDateLabel, setDraftDateLabel] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedType, setAppliedType] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);
  const [appliedDateLabel, setAppliedDateLabel] = useState<string | null>(null);

  useEffect(() => {
    if (tabFromUrl === "transaction-details") {
      setActiveTab("transaction-details");
    } else {
      setActiveTab("requests");
    }
  }, [tabFromUrl]);

  useEffect(() => {
    setFilterMode(false);
    setOpenFilter(null);
    setDraftType("All types");
    setDraftStatus("All statuses");
    setAppliedType(null);
    setAppliedStatus(null);
    setAppliedDateLabel(null);
  }, [activeTab]);

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

  const typeOptions = useMemo(
    () =>
      activeTab === "requests"
        ? (["All types", ...ETRADE_TYPE_FILTER_OPTIONS] as string[])
        : TXN_TYPE_OPTIONS,
    [activeTab],
  );

  const statusOptions = useMemo(
    () => (activeTab === "requests" ? [...REQ_STATUS_OPTIONS] : [...TXN_STATUS_OPTIONS]),
    [activeTab],
  );

  const setTab = (id: EtradeTabId) => {
    setActiveTab(id);
    router.replace(`/dashboard/e-trades?tab=${id}`, { scroll: false });
  };

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return requests.filter((r) => {
      if (appliedType && appliedType !== "All types" && r.etradeType !== appliedType) return false;
      if (appliedStatus && appliedStatus !== "All statuses" && r.status !== appliedStatus)
        return false;
      if (appliedDateLabel && !r.subtitle.includes("Jan")) return false;
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.etradeType.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [tableSearch, appliedType, appliedStatus, appliedDateLabel, requests]);

  const filteredTxnRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return ALL_ETRADE_TRANSACTION_ROWS.filter((r) => {
      if (appliedType && appliedType !== "All types" && r.title !== appliedType) return false;
      if (appliedStatus && appliedStatus !== "All statuses" && r.status !== appliedStatus)
        return false;
      if (appliedDateLabel && !r.subtitle.includes("Jan")) return false;
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.amount.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [tableSearch, appliedType, appliedStatus, appliedDateLabel]);

  const requestItems = filteredRows.length;
  const txnItems = filteredTxnRows.length;
  const activeTotal = activeTab === "requests" ? requestItems : txnItems;
  const activePage = activeTab === "requests" ? page : txnPage;

  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));
  const safePage = Math.min(activePage, totalPages);

  const paginatedRequests = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const paginatedTxn = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTxnRows.slice(start, start + pageSize);
  }, [filteredTxnRows, safePage, pageSize]);

  const tradeTypeLabel = activeTab === "requests" ? "Trade type" : "Trade name";

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
          onClick={() => {
            setTableSearch("");
            setFilterMode(true);
          }}
        >
          <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          Filter
        </button>

        <TableExportMenu
          disabled={activeTab === "requests" ? filteredRows.length === 0 : filteredTxnRows.length === 0}
          onExportCsv={() => {}}
          onExportPdf={() => {}}
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
        onSuccess={(newTrade) => {
          setRequests((prev) => [newTrade, ...prev]);
        }}
      />
    );
  }

  return (
    <div>
      <ProviderHeader title="Etrades" notificationCount={2} />

      {/* 3 Metric Cards */}
      <div className="mt-6 flex min-w-0 gap-3 flex-wrap sm:flex-nowrap">
        <StatCard
          label="Total Trade"
          value="100,000"
          accentColor="#C1FF00"
          icon={<WalletMoney size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Trade Volume"
          value="₦ 150,000,000.00"
          accentColor="#3B82F6"
          icon={<CardSend size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Awaiting Approval"
          value="50,000"
          accentColor="#EF4444"
          icon={<CardReceive size={20} variant="Outline" color="#0B294F" />}
        />
      </div>

      {/* Underline Tabs */}
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
                setAppliedType(draftType === "All types" ? null : draftType);
                setAppliedStatus(draftStatus === "All statuses" ? null : draftStatus);
                setAppliedDateLabel(draftDateLabel);
                setOpenFilter(null);
                setPage(1);
                setTxnPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedType(null);
                setAppliedStatus(null);
                setAppliedDateLabel(null);
                setDraftType("All types");
                setDraftStatus("All statuses");
                setDraftDateLabel("From Jan 6, 2026 - To Jan 6, 2026");
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
                setTxnPage(1);
              }}
            />
          }
        />
      ) : (
        toolbarSearch
      )}

      {activeTab === "requests" ? (
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
