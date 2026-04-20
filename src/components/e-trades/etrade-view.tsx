"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ListFilter } from "lucide-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { EtradeFilterBar } from "@/components/e-trades/etrade-filter-bar";
import {
  ALL_ETRADE_REQUESTS,
  ETRADE_TYPE_FILTER_OPTIONS,
} from "@/components/e-trades/etrade-mock-requests";
import { ALL_ETRADE_TRANSACTION_ROWS } from "@/components/e-trades/etrade-mock-transactions";
import { EtradeRequestList } from "@/components/e-trades/etrade-request-list";
import { EtradeTransactionList } from "@/components/e-trades/etrade-transaction-list";
import type { EtradeTabId } from "@/components/e-trades/etrade-types";
import { ProviderHeader } from "@/components/provider/provider-header";

const TABS: { id: EtradeTabId; label: string }[] = [
  { id: "requests", label: "Requests" },
  { id: "transaction-details", label: "Transaction Details" },
];

export function EtradeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<EtradeTabId>("requests");
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftEtradeType, setDraftEtradeType] = useState(ETRADE_TYPE_FILTER_OPTIONS[0] ?? "");
  const [appliedEtradeType, setAppliedEtradeType] = useState<string | null>(null);

  useEffect(() => {
    if (tabFromUrl === "transaction-details") {
      setActiveTab("transaction-details");
    } else {
      setActiveTab("requests");
    }
  }, [tabFromUrl]);

  const setTab = (id: EtradeTabId) => {
    setActiveTab(id);
    router.replace(`/dashboard/e-trades?tab=${id}`, { scroll: false });
  };

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return ALL_ETRADE_REQUESTS.filter((r) => {
      const matchType = !appliedEtradeType || r.etradeType === appliedEtradeType;
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.etradeType.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [tableSearch, appliedEtradeType]);

  const filteredTxnRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return ALL_ETRADE_TRANSACTION_ROWS.filter((r) => {
      const matchType = !appliedEtradeType || r.title === appliedEtradeType;
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.amount.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [tableSearch, appliedEtradeType]);

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

  const handleApplyFilter = () => {
    setAppliedEtradeType(draftEtradeType);
    setPage(1);
    setTxnPage(1);
  };

  const handleClearFilter = () => {
    setAppliedEtradeType(null);
    setDraftEtradeType(ETRADE_TYPE_FILTER_OPTIONS[0] ?? "");
    setPage(1);
    setTxnPage(1);
  };

  return (
    <div>
      <ProviderHeader title="Etrade" notificationCount={2} />

      <div className="mt-6">
        <UnderlineTabs tabs={TABS} active={activeTab} onChange={(id) => setTab(id as EtradeTabId)} />
      </div>

      {activeTab === "requests" ? (
        <>
          <div className="mt-6 flex h-14.5 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
            <div className="w-full min-w-0 sm:w-[325px]">
              <AuditTrailIconSearch
                variant="toolbar"
                placeholder="Search by Trade Name"
                aria-label="Search by trade name"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                  setTxnPage(1);
                }}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className={[
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white transition-colors",
                  filterOpen ? "bg-surface-subtle text-brand-navy" : "text-zinc-600 hover:bg-surface-subtle",
                ].join(" ")}
                aria-label="Filter"
                aria-expanded={filterOpen}
              >
                <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
              </button>
            </div>
          </div>

          {filterOpen ? (
            <EtradeFilterBar
              etradeType={draftEtradeType}
              etradeTypeOptions={ETRADE_TYPE_FILTER_OPTIONS}
              onEtradeTypeChange={setDraftEtradeType}
              onApply={handleApplyFilter}
              onClear={handleClearFilter}
            />
          ) : null}

          <EtradeRequestList rows={paginatedRequests} />

          <AuditTrailPagination
            page={safePage}
            pageSize={pageSize}
            totalItems={requestItems}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </>
      ) : (
        <>
          <div className="mt-6 flex h-14.5 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
            <div className="w-full min-w-0 sm:w-[325px]">
              <AuditTrailIconSearch
                variant="toolbar"
                placeholder="Search by Trade Name"
                aria-label="Search by trade name"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                  setTxnPage(1);
                }}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className={[
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white transition-colors",
                  filterOpen ? "bg-surface-subtle text-brand-navy" : "text-zinc-600 hover:bg-surface-subtle",
                ].join(" ")}
                aria-label="Filter"
                aria-expanded={filterOpen}
              >
                <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
              </button>
            </div>
          </div>

          {filterOpen ? (
            <EtradeFilterBar
              etradeType={draftEtradeType}
              etradeTypeOptions={ETRADE_TYPE_FILTER_OPTIONS}
              onEtradeTypeChange={setDraftEtradeType}
              onApply={handleApplyFilter}
              onClear={handleClearFilter}
            />
          ) : null}

          <EtradeTransactionList rows={paginatedTxn} />

          <AuditTrailPagination
            page={safePage}
            pageSize={pageSize}
            totalItems={txnItems}
            onPageChange={setTxnPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setTxnPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}
