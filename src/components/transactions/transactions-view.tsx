"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  type TxRow,
  type TxStatus,
  TRANSACTION_DEMO_TABLE_ROWS,
  buildFillerTransactionRows,
} from "@/components/transactions/transaction-mocks";

type AmountFilter = "Less than ₦20,000" | "Less than ₦100,000" | "Greater than ₦100,000";

/* Demo/QA rows first; filler for pagination. Detail view falls back for unknown ids. */
const ALL_ROWS: TxRow[] = [
  ...TRANSACTION_DEMO_TABLE_ROWS,
  ...buildFillerTransactionRows(120, 0),
];

/* ── Status badge ── */
function StatusBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    Successful: "bg-green-50 text-green-600",
    Pending:    "bg-orange-50 text-orange-500",
    Failed:     "bg-red-50 text-red-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

/* ── Tabs ── */
const TX_TABS: { id: string; label: string }[] = [
  { id: "All",        label: "All"        },
  { id: "Deposit",    label: "Deposit"    },
  { id: "Crypto",     label: "Crypto"     },
  { id: "Giftcard",   label: "Giftcard"   },
  { id: "Utility",    label: "Utility"    },
  { id: "E-sim",      label: "E-sim"      },
  { id: "E-trade",    label: "E-trade"    },
  { id: "Withdrawal", label: "Withdrawal" },
];

/* ── Main view ── */
export function TransactionsView() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [openFilter, setOpenFilter] = useState<null | "date" | "amount" | "status">(null);

  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"date" | "amount" | "status">(openFilter, filterMode);

  const [draftAmount, setDraftAmount] = useState<AmountFilter>("Less than ₦20,000");
  const [draftStatus, setDraftStatus] = useState<TxStatus>("Successful");
  const [draftDateLabel, setDraftDateLabel] = useState("From Jan 6, 2026 - To Jan 6, 2026");

  const [appliedAmount, setAppliedAmount] = useState<AmountFilter | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<TxStatus | null>(null);
  const [appliedDateLabel, setAppliedDateLabel] = useState<string | null>(null);

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

  const parseAmount = (amount: string) => {
    const numeric = amount.replace(/[^\d]/g, "");
    const n = Number(numeric);
    return Number.isFinite(n) ? n : 0;
  };

  const matchesAmountFilter = (row: TxRow) => {
    if (!appliedAmount) return true;
    const amt = parseAmount(row.amount);
    if (appliedAmount === "Less than ₦20,000") return amt < 20000;
    if (appliedAmount === "Less than ₦100,000") return amt < 100000;
    return amt > 100000;
  };

  const filtered = useMemo(() => {
    return ALL_ROWS.filter((row) => {
      const matchTab = activeTab === "All" || row.channel.includes(activeTab);
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.refNo.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.channel.toLowerCase().includes(q);
      const matchStatus = !appliedStatus || row.status === appliedStatus;
      const matchAmount = matchesAmountFilter(row);
      const matchDate = !appliedDateLabel || row.date.includes("Jan 6, 2026");
      return matchTab && matchSearch && matchStatus && matchAmount && matchDate;
    });
  }, [activeTab, search, appliedStatus, appliedAmount, appliedDateLabel]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <ProviderHeader title="Transactions" />

      {/* Stat cards */}
      <div className="mt-6 flex min-w-0 gap-3">
        <StatCard
          label="Total Amount Deposited"
          value="₦ 100,000,000"
          accentColor="#BCEB0F"
          icon={<CardReceive size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Amount Withdrawn"
          value="₦ 100,000,000"
          accentColor="#3B82F6"
          icon={<CardSend size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Number of Transactions"
          value="250,000"
          accentColor="#EF4444"
          icon={<ChartSquare size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Number of Users"
          value="100,000"
          accentColor="#013220"
          icon={<ProfileTick size={20} variant="Outline" color="#0B294F" />}
        />
      </div>

      {/* Tabs */}
      <div className="mt-10 mb-6">
        <UnderlineTabs tabs={TX_TABS} active={activeTab} onChange={handleTabChange} />
      </div>

      {/* Toolbar */}
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
              {openFilter === "amount" ? (
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={["Less than ₦100,000", "Greater than ₦100,000"] as AmountFilter[]}
                    onSelect={(opt) => {
                      setDraftAmount(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "status" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[160px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={["Successful", "Pending", "Failed"] as TxStatus[]}
                    onSelect={(opt) => {
                      setDraftStatus(opt as TxStatus);
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
                setAppliedDateLabel(draftDateLabel);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedAmount(null);
                setAppliedStatus(null);
                setAppliedDateLabel(null);
                setDraftAmount("Less than ₦20,000");
                setDraftStatus("Successful");
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
          tableSearch={search}
          onTableSearchChange={setSearch}
          onFilterClick={() => {
            setSearch("");
            setFilterMode(true);
          }}
        />
      )}

      {/* Table border boundary box */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse bg-white text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">
              <th className="px-4 py-4 w-10">
                <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green" />
              </th>
              <th className="px-4 py-4 font-medium">Reference No ↓</th>
              <th className="px-4 py-4 font-medium">Customer Names</th>
              <th className="px-4 py-4 font-medium">Channel</th>
              <th className="px-4 py-4 font-medium">Amount</th>
              <th className="px-4 py-4 font-medium">Provider</th>
              <th className="px-4 py-4 font-medium">Status</th>
              <th className="px-4 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-50 transition-colors hover:bg-zinc-50"
              >
                <td className="h-16 px-4 py-0 align-middle">
                  <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green" />
                </td>
                <td className="h-16 px-4 py-0 align-middle">
                  <Link href={`/dashboard/transactions/${row.id}`} className="text-[13px] font-semibold text-primary-text underline underline-offset-4 cursor-pointer hover:text-secondary-green transition-colors">
                    {row.refNo}
                  </Link>
                </td>
                <td className="h-16 px-4 py-0 text-[13px] text-zinc-600 align-middle">{row.customerName}</td>
                <td className="h-16 px-4 py-0 text-[13px] text-zinc-600 align-middle">{row.channel}</td>
                <td className="h-16 px-4 py-0 text-[13px] font-medium text-primary-text align-middle">{row.amount}</td>
                <td className="h-16 px-4 py-0 text-[13px] text-zinc-600 align-middle">{row.provider}</td>
                <td className="h-16 px-4 py-0 align-middle">
                  <StatusBadge status={row.status} />
                </td>
                <td className="h-16 px-4 py-0 text-[13px] align-middle">
                  {(() => {
                    const [datePart, timePart] = row.date.split(" | ");
                    return (
                      <>
                        <span style={{ color: "#7A7A7A" }}>{datePart}</span>
                        {timePart ? <span style={{ color: "#9E9E9E" }}> | {timePart}</span> : null}
                      </>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <AuditTrailPagination
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>
    </div>
  );
}
