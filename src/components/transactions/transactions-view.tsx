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
} from "@/components/ui/table-filter-bar";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  filterRowsByChannelTab,
  filterWalletTabRows,
  getAdminTransactionsList,
  getAdminWalletTransactionsList,
  mergeTransactionListResults,
  uiStatusToApiStatus,
} from "@/lib/admin-api/transactions-api";
import type { AdminTransactionListRow } from "@/lib/admin-api/types";
import type { ExportColumn } from "@/lib/export/table-export";
import {
  exportTableWithApiFallback,
  exportViaTransactionsApi,
} from "@/lib/export/export-handlers";

const TX_EXPORT_COLUMNS: ExportColumn<AdminTransactionListRow>[] = [
  { header: "Reference", value: (r) => r.refNo },
  { header: "Customer", value: (r) => r.customerName },
  { header: "Channel", value: (r) => r.channel },
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
  { id: "E-trade", label: "E-trade" },
  { id: "Withdrawal", label: "Withdrawal" },
];

type TxTab = (typeof TX_TABS)[number]["id"];

const WALLET_TABS: TxTab[] = ["Deposit", "Withdrawal"];
const PRODUCT_TABS: TxTab[] = ["Crypto", "Giftcard", "Utility", "E-sim", "E-trade"];

function isWalletTab(tab: TxTab): boolean {
  return WALLET_TABS.includes(tab);
}

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
  const [draftDateLabel, setDraftDateLabel] = useState("Date range (picker coming soon)");

  const [appliedAmount, setAppliedAmount] = useState<AmountFilter | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<TxStatusFilter | null>(null);

  const [listRows, setListRows] = useState<AdminTransactionListRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const mergeTab = activeTab === "All";

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

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const statusParam = appliedStatus ? uiStatusToApiStatus(appliedStatus) : undefined;
      const channelParam =
        activeTab !== "All" && !isWalletTab(activeTab) ? activeTab : undefined;
      const baseQuery = {
        search: debouncedSearch || undefined,
        status: statusParam,
        channel: channelParam,
        type: channelParam,
      };

      if (mergeTab) {
        const fetchSize = 100;
        const [product, wallet] = await Promise.all([
          getAdminTransactionsList({ ...baseQuery, page: 1, pageSize: fetchSize }),
          getAdminWalletTransactionsList({ ...baseQuery, page: 1, pageSize: fetchSize }),
        ]);
        const merged = mergeTransactionListResults(product, wallet);
        setListRows(merged.items);
        setListTotal(merged.total);
      } else if (isWalletTab(activeTab)) {
        const res = await getAdminWalletTransactionsList({
          ...baseQuery,
          page,
          pageSize,
        });
        const filtered =
          activeTab === "Deposit" || activeTab === "Withdrawal"
            ? filterWalletTabRows(res.items, activeTab)
            : res.items;
        setListRows(filtered);
        setListTotal(res.total);
      } else {
        const res = await getAdminTransactionsList({
          ...baseQuery,
          page,
          pageSize,
        });
        const filtered = filterRowsByChannelTab(res.items, activeTab);
        setListRows(filtered);
        setListTotal(res.total);
      }
    } catch (e) {
      setListRows([]);
      setListTotal(0);
      setListError(e instanceof AdminApiError ? e.message : "Could not load transactions.");
    } finally {
      setListLoading(false);
    }
  }, [activeTab, appliedStatus, debouncedSearch, mergeTab, page, pageSize]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const clientFiltered = useMemo(() => {
    return listRows.filter((row) => {
      const matchAmount = matchesAmountFilter(row, appliedAmount);
      const matchStatus = matchesStatusFilter(row, appliedStatus);
      if (!mergeTab && PRODUCT_TABS.includes(activeTab)) {
        return matchAmount && matchStatus && filterRowsByChannelTab([row], activeTab).length > 0;
      }
      return matchAmount && matchStatus;
    });
  }, [listRows, appliedAmount, appliedStatus, activeTab, mergeTab]);

  const paginationTotal = mergeTab ? clientFiltered.length : listTotal;
  const paginatedRows = useMemo(() => {
    if (!mergeTab) return clientFiltered;
    const start = (page - 1) * pageSize;
    return clientFiltered.slice(start, start + pageSize);
  }, [clientFiltered, mergeTab, page, pageSize]);

  const safePage = mergeTab
    ? Math.min(page, Math.max(1, Math.ceil(Math.max(paginationTotal, 1) / pageSize)))
    : page;

  useEffect(() => {
    if (mergeTab) setPage(1);
  }, [activeTab, debouncedSearch, appliedStatus, appliedAmount, mergeTab]);

  const handleTabChange = (id: string) => {
    setActiveTab(id as TxTab);
    setPage(1);
  };

  const exportBody = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: appliedStatus ? uiStatusToApiStatus(appliedStatus) : undefined,
      channel: activeTab !== "All" && !isWalletTab(activeTab) ? activeTab : undefined,
      type: isWalletTab(activeTab) ? activeTab.toLowerCase() : undefined,
    }),
    [activeTab, appliedStatus, debouncedSearch],
  );

  const runExport = async (format: "csv" | "json" | "pdf") => {
    const filename = `transactions-${activeTab.toLowerCase().replace(/\s+/g, "-")}`;
    await exportTableWithApiFallback(
      filename,
      format,
      () => exportViaTransactionsApi(filename, format, exportBody),
      clientFiltered,
      TX_EXPORT_COLUMNS,
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

      <div className="mt-6 flex min-w-0 gap-3">
        <StatCard
          label="Total Amount Deposited"
          value="—"
          accentColor="#BCEB0F"
          icon={<CardReceive size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Amount Withdrawn"
          value="—"
          accentColor="#3B82F6"
          icon={<CardSend size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Number of Transactions"
          value="—"
          accentColor="#EF4444"
          icon={<ChartSquare size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Number of Users"
          value="—"
          accentColor="#013220"
          icon={<ProfileTick size={20} variant="Outline" color="#0B294F" />}
        />
      </div>

      {mergeTab ? (
        <p className="mt-3 text-xs text-zinc-500">
          All tab merges up to 100 product and 100 wallet transactions, then paginates locally.
        </p>
      ) : null}

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
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <p className="px-2 py-2 text-xs text-zinc-500">
                    Date range filters will send ISO dates once a picker is wired.
                  </p>
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
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedAmount(null);
                setAppliedStatus(null);
                setDraftAmount("Less than ₦20,000");
                setDraftStatus("Successful");
                setDraftDateLabel("Date range (picker coming soon)");
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

      {listError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {listError}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void loadList()}>
            Retry
          </button>
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse bg-white text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
              <th className="px-4 py-4 font-medium">Reference No</th>
              <th className="px-4 py-4 font-medium">Customer Names</th>
              <th className="px-4 py-4 font-medium">Channel</th>
              <th className="px-4 py-4 font-medium">Amount</th>
              <th className="px-4 py-4 font-medium">Provider</th>
              <th className="px-4 py-4 font-medium">Status</th>
              <th className="px-4 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  Loading transactions…
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
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
