"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WalletMoney, CardReceive, CardSend, Profile2User, ChartSquare, ProfileTick } from "iconsax-react";
import { X, ChevronDown, CalendarDays } from "lucide-react";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { ProviderHeader } from "@/components/provider/provider-header";

/* ── Types ── */
type TxStatus = "Successful" | "Pending" | "Failed";
type TxTab = "All" | "Deposit" | "Crypto" | "Giftcard" | "Utility" | "E-sim" | "E-trade" | "Withdrawal";

type TxRow = {
  id: string;
  refNo: string;
  customerName: string;
  channel: string;
  amount: string;
  provider: string;
  status: TxStatus;
  date: string;
};

type AmountFilter = "Less than ₦20,000" | "Less than ₦100,000" | "Greater than ₦100,000";

/* ── Mock data ── */
const CHANNELS = ["Crypto", "Deposit", "Withdrawal", "Giftcard", "Esim", "Etrade", "Buy Crypto", "Sell Crypto", "Giftcard", "Deposit"];
const PROVIDERS = ["BAXI", "BAXI", "XPRESS_PAYMENT", "XPRESS_PAYMENT", "XPRESS_PAYMENT", "XPRESS_PAYMENT", "CRIBD", "WELLA_HEALTH", "NTEL VTU PURC...", "NTEL VTU PURC..."];
const NAMES = [
  "Naomi Salisu", "Job Awolowo", "Martha Kalio", "Victoria Salisu",
  "Mary Kalio", "Joseph Anunobi", "Sarah Ibe", "Elizabeth Kanu",
  "Elizabeth Amlesi", "Margaret Idris", "Mary Olowookere",
];
const STATUSES: TxStatus[] = ["Successful", "Successful", "Pending", "Pending", "Successful", "Successful", "Failed", "Successful", "Pending", "Failed", "Failed"];

const BASE_ROWS: Omit<TxRow, "id">[] = Array.from({ length: 11 }, (_, i) => ({
  refNo: "Zenx.WVA.S373QQOPN",
  customerName: NAMES[i % NAMES.length],
  channel: CHANNELS[i % CHANNELS.length],
  amount: "₦ 20,000",
  provider: PROVIDERS[i % PROVIDERS.length],
  status: STATUSES[i % STATUSES.length],
  date: "Jan 6, 2026 | 9:32AM",
}));

const ALL_ROWS: TxRow[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_ROWS[i % BASE_ROWS.length],
  id: `tx-${i}`,
}));

/* ── Stat card ── */
type StatCardProps = {
  label: string;
  value: string;
  accentColor: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, accentColor, icon }: StatCardProps) {
  const labelWords = label.trim().split(/\s+/);
  const labelPrefix = labelWords.slice(0, -1).join(" ");
  const labelLastWord = labelWords.at(-1) ?? "";

  return (
    <div className="relative flex min-w-[283px] flex-1 flex-col justify-between gap-[10px] overflow-hidden rounded-t-[8px] border border-zinc-100 bg-white px-6 py-[18px] shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] h-[129px]">
      <div
        className="absolute bottom-0 left-0 top-0 w-[4px] rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex h-[44px] items-start justify-between">
        <span className="text-[14px] font-medium" style={{ color: "#667085" }}>
          {labelPrefix ? (
            <>
              {labelPrefix}
              <span className="block">{labelLastWord}</span>
            </>
          ) : (
            labelLastWord
          )}
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-zinc-50 text-zinc-600 border border-zinc-100">
          {icon}
        </span>
      </div>
      <p className="flex h-[72px] items-center text-[28px] font-bold text-primary-text">{value}</p>
    </div>
  );
}

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

  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const filterScrollRef = useRef<HTMLDivElement | null>(null);
  const datePillRef = useRef<HTMLButtonElement | null>(null);
  const amountPillRef = useRef<HTMLButtonElement | null>(null);
  const statusPillRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState<number>(0);

  const [openFilter, setOpenFilter] = useState<null | "date" | "amount" | "status">(null);

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

  const syncDropdownLeft = (nextOpen: typeof openFilter) => {
    const bar = filterBarRef.current;
    if (!bar || !nextOpen) return;
    const target =
      nextOpen === "date"
        ? datePillRef.current
        : nextOpen === "amount"
          ? amountPillRef.current
          : statusPillRef.current;
    if (!target) return;
    const barRect = bar.getBoundingClientRect();
    const pillRect = target.getBoundingClientRect();
    setDropdownLeft(Math.max(0, pillRect.left - barRect.left));
  };

  useEffect(() => {
    syncDropdownLeft(openFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFilter]);

  useEffect(() => {
    if (!openFilter) return;
    const onResize = () => syncDropdownLeft(openFilter);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [openFilter]);

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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Amount Deposited"
          value="₦ 100,000,000"
          accentColor="#BCEB0F"
          icon={<CardReceive size={24} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Amount Withdrawn"
          value="₦ 100,000,000"
          accentColor="#3B82F6"
          icon={<CardSend size={24} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Number of Transactions"
          value="250,000"
          accentColor="#EF4444"
          icon={<ChartSquare size={24} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Number of Users"
          value="100,000"
          accentColor="#013220"
          icon={<ProfileTick size={24} variant="Outline" color="currentColor" />}
        />
      </div>

      {/* Tabs */}
      <div className="mt-10 mb-6">
        <UnderlineTabs tabs={TX_TABS} active={activeTab} onChange={handleTabChange} />
      </div>

      {/* Toolbar */}
      {filterMode ? (
        <div ref={filterBarRef} className="relative mt-6 flex h-14.5 items-center gap-2 rounded-xl bg-white px-3 sm:px-4 overflow-visible">
          {openFilter ? <div className="fixed inset-0 z-40" onClick={() => setOpenFilter(null)} /> : null}

          <div
            ref={filterScrollRef}
            className="relative z-50 min-w-0 flex-1 overflow-x-auto"
            onScroll={() => {
              if (openFilter) syncDropdownLeft(openFilter);
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
            <button
              ref={datePillRef}
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E8EBEE] bg-[#F7F7F7] px-3 py-2 text-[12px] text-primary-text"
              onClick={() =>
                setOpenFilter((v) => {
                  const next = v === "date" ? null : "date";
                  syncDropdownLeft(next);
                  return next;
                })
              }
            >
              <X size={14} />
              <span className="text-[12px]" style={{ color: "#667085" }}>Date</span>
              <span className="text-[12px]" style={{ color: "#667085" }}>{draftDateLabel}</span>
              <ChevronDown size={14} className="ml-0.5" />
            </button>

            <button
              ref={amountPillRef}
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E8EBEE] bg-[#F7F7F7] px-3 py-2 text-[12px]"
              onClick={() =>
                setOpenFilter((v) => {
                  const next = v === "amount" ? null : "amount";
                  syncDropdownLeft(next);
                  return next;
                })
              }
            >
              <X size={14} />
              <span className="text-[12px]" style={{ color: "#667085" }}>Amount</span>
              <span className="text-[12px]" style={{ color: "#667085" }}>{draftAmount}</span>
              <ChevronDown size={14} className="ml-0.5" />
            </button>

            <button
              ref={statusPillRef}
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E8EBEE] bg-[#F7F7F7] px-3 py-2 text-[12px]"
              onClick={() =>
                setOpenFilter((v) => {
                  const next = v === "status" ? null : "status";
                  syncDropdownLeft(next);
                  return next;
                })
              }
            >
              <X size={14} />
              <span className="text-[12px]" style={{ color: "#667085" }}>Status</span>
              <span className="text-[12px]" style={{ color: "#667085" }}>{draftStatus}</span>
              <ChevronDown size={14} className="ml-0.5" />
            </button>

            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E8EBEE] bg-[#F7F7F7] px-3 py-2 text-[12px]"
              aria-label="Calendar"
              onClick={() => setOpenFilter((v) => (v === "date" ? null : "date"))}
            >
              <CalendarDays size={14} />
            </button>
          </div>
          </div>

          {openFilter === "date" ? (
            <div
              className="absolute top-full z-[60] mt-2 w-[220px] rounded-[12px] border border-zinc-200 bg-white p-2 shadow-lg"
              style={{ left: dropdownLeft }}
            >
              <p className="text-[12px] font-medium" style={{ color: "#667085" }}>Filter</p>
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
            </div>
          ) : null}

          {openFilter === "amount" ? (
            <div
              className="absolute top-full z-[60] mt-2 w-[220px] rounded-[12px] border border-zinc-200 bg-white p-2 shadow-lg"
              style={{ left: dropdownLeft }}
            >
              <p className="text-[12px] font-medium" style={{ color: "#667085" }}>Filter</p>
              <div className="mt-2 overflow-hidden rounded-[10px]">
                {(["Less than ₦100,000", "Greater than ₦100,000"] as AmountFilter[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="flex w-full items-center px-2.5 py-2 text-left text-[14px] text-primary-text hover:bg-zinc-50"
                    onClick={() => {
                      setDraftAmount(opt);
                      setOpenFilter(null);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {openFilter === "status" ? (
            <div
              className="absolute top-full z-[60] mt-2 w-[160px] rounded-[12px] border border-zinc-200 bg-white p-2 shadow-lg"
              style={{ left: dropdownLeft }}
            >
              <p className="text-[12px] font-medium" style={{ color: "#667085" }}>Filter</p>
              <div className="mt-2 overflow-hidden rounded-[10px]">
                {(["Successful", "Pending", "Failed"] as TxStatus[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="flex w-full items-center px-2.5 py-2 text-left text-[14px] text-primary-text hover:bg-zinc-50"
                    onClick={() => {
                      setDraftStatus(opt);
                      setOpenFilter(null);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-3 shrink-0 z-50">
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-full bg-[#BCEB0F] px-5 text-[12px] font-semibold text-primary-text"
              onClick={() => {
                setAppliedAmount(draftAmount);
                setAppliedStatus(draftStatus);
                setAppliedDateLabel(draftDateLabel);
                setOpenFilter(null);
                setPage(1);
              }}
            >
              Apply
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[12px]"
              style={{ color: "#667085" }}
              onClick={() => {
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
            >
              <X size={14} />
              Clear Filter
            </button>
          </div>
        </div>
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
