"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CardReceive, CardSend, ChartSquare, ProfileTick } from "iconsax-react";
import { CalendarDays } from "lucide-react";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { ProviderHeader } from "@/components/provider/provider-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  useTableFilterBarAnchor,
  TableFilterCalendar,
  formatDateRangeLabel,
} from "@/components/ui/table-filter-bar";
import type { DateRange } from "react-day-picker";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  getAdminTransactionsList,
  getAdminTransactionsSummary,
  tabToApiTab,
  uiStatusToApiStatus,
  filterRowsByChannelTab,
} from "@/lib/admin-api/transactions-api";
import type { AdminTransactionListRow, AdminTransactionsSummary } from "@/lib/admin-api/types";
import type { ExportColumn } from "@/lib/export/table-export";
import {
  exportTableWithApiFallback,
  exportViaTransactionsApi,
} from "@/lib/export/export-handlers";
import { ErrorAlert } from "@/components/ui/error-alert";

const TX_EXPORT_COLUMNS: ExportColumn<AdminTransactionListRow>[] = [
  { header: "Reference", value: (r) => r.refNo },
  { header: "Customer", value: (r) => r.customerName },
  { header: "Channel", value: (r) => r.channel },
  { header: "Product", value: (r) => r.product },
  { header: "Amount", value: (r) => r.amount },
  { header: "Provider", value: (r) => r.provider },
  { header: "Status", value: (r) => r.status },
  { header: "Date", value: (r) => r.date },
];

type AmountFilter = "Less than ₦20,000" | "Less than ₦100,000" | "Greater than ₦100,000";
type TxStatusFilter = "Successful" | "Pending" | "Failed";

const TX_TABS = [
  { id: "All", label: "All" },
  { id: "Deposit", label: "Deposit" },
  { id: "Crypto", label: "Crypto" },
  { id: "Giftcard", label: "Giftcard" },
  { id: "Utility", label: "Utility" },
  { id: "E-sim", label: "E-sim" },
  { id: "Withdrawal", label: "Withdrawal" },
];

type TxTab = (typeof TX_TABS)[number]["id"];

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-600";
  if (key.includes("success")) cls = "bg-green-50 text-green-600";
  else if (key.includes("pending")) cls = "bg-orange-50 text-orange-500";
  else if (key.includes("fail")) cls = "bg-red-50 text-red-500";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function parseAmount(amount: string): number {
  const numeric = amount.replace(/[^\d]/g, "");
  const n = Number(numeric);
  return Number.isFinite(n) ? n : 0;
}

function matchesAmountFilter(row: AdminTransactionListRow, applied: AmountFilter | null): boolean {
  if (!applied) return true;
  const amt = parseAmount(row.amount);
  if (applied === "Less than ₦20,000") return amt < 20000;
  if (applied === "Less than ₦100,000") return amt < 100000;
  return amt > 100000;
}

function formatCount(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

function formatMetricAmount(v: number | string | undefined): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number" && Number.isFinite(v)) {
    return `₦${v.toLocaleString()}`;
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return "—";
    const n = Number(t.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n) && t.replace(/[^\d.-]/g, "") !== "") {
      return `₦${n.toLocaleString()}`;
    }
    return t;
  }
  return "—";
}

function matchesStatusFilter(row: AdminTransactionListRow, applied: TxStatusFilter | null): boolean {
  if (!applied) return true;
  const key = row.status.toLowerCase();
  if (applied === "Successful") return key.includes("success");
  if (applied === "Pending") return key.includes("pending");
  if (applied === "Failed") return key.includes("fail");
  return row.status === applied;
}

export function TransactionsView() {
  const [activeTab, setActiveTab] = useState<TxTab>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [openFilter, setOpenFilter] = useState<null | "date" | "amount" | "status">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"date" | "amount" | "status">(openFilter, filterMode);

  const [draftAmount, setDraftAmount] = useState<AmountFilter>("Less than ₦20,000");
  const [draftStatus, setDraftStatus] = useState<TxStatusFilter>("Successful");
  const [draftDate, setDraftDate] = useState<DateRange | undefined>(undefined);

  const [appliedAmount, setAppliedAmount] = useState<AmountFilter | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<TxStatusFilter | null>(null);
  const [appliedDate, setAppliedDate] = useState<DateRange | undefined>(undefined);

  const [listRows, setListRows] = useState<AdminTransactionListRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [summary, setSummary] = useState<AdminTransactionsSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => window.clearTimeout(t);
  }, [search]);

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

  const loadSummary = useCallback(async () => {
    setSummaryError(null);
    try {
      const s = await getAdminTransactionsSummary({
        fromDate: appliedDate?.from ? appliedDate.from.toISOString() : undefined,
        toDate: appliedDate?.to ? appliedDate.to.toISOString() : undefined,
      });
      setSummary(s);
    } catch (e) {
      setSummary(null);
      setSummaryError(e instanceof AdminApiError ? e.message : "Could not load transaction metrics.");
    }
  }, [appliedDate]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const statusParam = appliedStatus ? uiStatusToApiStatus(appliedStatus) : undefined;
      const searchParam = debouncedSearch || undefined;

      const tab = tabToApiTab(activeTab);
      const res = await getAdminTransactionsList({
        search: searchParam,
        status: statusParam,
        tab,
        page,
        pageSize,
        dateFrom: appliedDate?.from ? appliedDate.from.toISOString() : undefined,
        dateTo: appliedDate?.to ? appliedDate.to.toISOString() : undefined,
      });
      setListRows(res.items);
      setListTotal(res.total);
    } catch (e) {
      setListRows([]);
      setListTotal(0);
      setListError(
        e instanceof AdminApiError
          ? e.status === 0
            ? "API URL is not configured. Set NEXT_PUBLIC_ADMIN_API_URL in .env.local and restart the dev server."
            : e.message
          : "Could not load transactions.",
      );
    } finally {
      setListLoading(false);
    }
  }, [activeTab, appliedStatus, debouncedSearch, page, pageSize, appliedDate]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const clientFiltered = useMemo(() => {
    let rows = listRows;
    // Bug #59: Deposit tab shows all channels — apply client-side tab filtering
    // as a safety net in case the backend doesn't filter correctly.
    if (activeTab !== "All") {
      rows = filterRowsByChannelTab(rows, activeTab);
    }
    return rows.filter((row) => {
      const matchAmount = matchesAmountFilter(row, appliedAmount);
      const matchStatus = matchesStatusFilter(row, appliedStatus);
      return matchAmount && matchStatus;
    });
  }, [listRows, activeTab, appliedAmount, appliedStatus]);

  const paginationTotal = listTotal;
  const paginatedRows = clientFiltered;

  const safePage = Math.min(page, Math.max(1, Math.ceil(Math.max(paginationTotal, 1) / pageSize)));

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, appliedStatus, appliedAmount]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as TxTab);
    setPage(1);
  };

  const exportBody = useMemo(() => {
    const tab = tabToApiTab(activeTab);
    const status = appliedStatus ? uiStatusToApiStatus(appliedStatus) : undefined;
    return {
      search: debouncedSearch || undefined,
      productSlug: tab,
      statuses: status ? [status] : undefined,
      dateFrom: appliedDate?.from ? appliedDate.from.toISOString() : undefined,
      dateTo: appliedDate?.to ? appliedDate.to.toISOString() : undefined,
    };
  }, [activeTab, appliedStatus, debouncedSearch, appliedDate]);

  const runExport = async (format: "csv" | "json" | "pdf") => {
    const filename = `transactions-${activeTab.toLowerCase().replace(/\s+/g, "-")}`;
    const exportColumns = TX_EXPORT_COLUMNS.map((col) => {
      if (col.header === "Product" && activeTab === "E-sim") {
        return {
          header: "Coverage",
          value: (r: AdminTransactionListRow) => String(r.raw.coverage || r.raw.esimCoverage || r.raw.region || r.product),
        };
      }
      return col;
    });
    await exportTableWithApiFallback(
      filename,
      format,
      () => exportViaTransactionsApi(filename, format, exportColumns, exportBody),
      clientFiltered,
      exportColumns,
    );
  };

  const exportProps = {
    exportDisabled: listLoading || clientFiltered.length === 0,
    onExportCsv: () => runExport("csv"),
    onExportPdf: () => runExport("pdf"),
    onExportJson: () => runExport("json"),
  };

  return (
    <div>
      <ProviderHeader title="Transactions" />

      {summaryError ? (
        <p className="mt-4 text-sm text-amber-800" role="status">
          {summaryError}
        </p>
      ) : null}

      <div className="mt-6 flex min-w-0 gap-3">
        <StatCard
          label="Total Amount Deposited"
          value={formatMetricAmount(summary?.totalAmountDeposited)}
          accentColor="#BCEB0F"
          icon={<CardReceive size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Amount Withdrawn"
          value={formatMetricAmount(summary?.totalAmountWithdrawn)}
          accentColor="#3B82F6"
          icon={<CardSend size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Number of Transactions"
          value={formatCount(summary?.totalTransactions)}
          accentColor="#EF4444"
          icon={<ChartSquare size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Number of Users"
          value={formatCount(summary?.totalUsers)}
          accentColor="#013220"
          icon={<ProfileTick size={20} variant="Outline" color="#0B294F" />}
        />
      </div>

      <div className="mt-10 mb-6">
        <UnderlineTabs tabs={TX_TABS} active={activeTab} onChange={handleTabChange} />
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
                label="Date"
                summary={formatDateRangeLabel(draftDate, "All time")}
                pillRef={registerPillRef("date")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "date" ? null : "date";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Amount"
                summary={draftAmount}
                pillRef={registerPillRef("amount")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "amount" ? null : "amount";
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
              {openFilter === "date" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-auto">
                  <TableFilterPanelTitle />
                  <TableFilterCalendar value={draftDate} onChange={setDraftDate} />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "amount" ? (
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={["Less than ₦100,000", "Greater than ₦100,000"] as AmountFilter[]}
                    onSelect={(opt) => {
                      setDraftAmount(opt as AmountFilter);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "status" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[160px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={["Successful", "Pending", "Failed"] as TxStatusFilter[]}
                    onSelect={(opt) => {
                      setDraftStatus(opt as TxStatusFilter);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedAmount(draftAmount);
                setAppliedStatus(draftStatus);
                setAppliedDate(draftDate);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedAmount(null);
                setAppliedStatus(null);
                setAppliedDate(undefined);
                setDraftAmount("Less than ₦20,000");
                setDraftStatus("Successful");
                setDraftDate(undefined);
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <AuditTrailToolbar
          tableSearch={search}
          onTableSearchChange={setSearch}
          onFilterClick={() => setFilterMode(true)}
          {...exportProps}
        />
      )}

      <ErrorAlert error={listError} onRetry={() => void loadList()} />

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse bg-white text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
              <th className="px-4 py-4 font-medium">Reference No</th>
              <th className="px-4 py-4 font-medium">Customer Names</th>
              <th className="px-4 py-4 font-medium">Channel</th>
              <th className="px-4 py-4 font-medium">{activeTab === "E-sim" ? "Coverage" : "Product"}</th>
              <th className="px-4 py-4 font-medium">Amount</th>
              <th className="px-4 py-4 font-medium">Provider</th>
              <th className="px-4 py-4 font-medium">Status</th>
              <th className="px-4 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  Loading transactions…
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr key={row.refNo} className="border-b border-zinc-50 transition-colors hover:bg-zinc-50">
                  <td className="h-16 px-4 py-0 align-middle">
                    <Link
                      href={`/dashboard/transactions/${encodeURIComponent(row.refNo)}`}
                      className="cursor-pointer text-[13px] font-semibold text-primary-text underline underline-offset-4 transition-colors hover:text-secondary-green"
                    >
                      {row.refNo}
                    </Link>
                  </td>
                  <td className="h-16 px-4 py-0 align-middle text-[13px] text-zinc-600">{row.customerName}</td>
                  <td className="h-16 px-4 py-0 align-middle text-[13px] text-zinc-600">{row.channel}</td>
                  <td className="h-16 px-4 py-0 align-middle text-[13px] text-zinc-600">
                    {activeTab === "E-sim" ? String(row.raw.coverage || row.raw.esimCoverage || row.raw.region || row.product) : row.product}
                  </td>
                  <td className="h-16 px-4 py-0 align-middle text-[13px] font-medium text-primary-text">{row.amount}</td>
                  <td className="h-16 px-4 py-0 align-middle text-[13px] text-zinc-600">{row.provider}</td>
                  <td className="h-16 px-4 py-0 align-middle">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="h-16 px-4 py-0 align-middle text-[13px] text-zinc-500">{row.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <AuditTrailPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={paginationTotal}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
