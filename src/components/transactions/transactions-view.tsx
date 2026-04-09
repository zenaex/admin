"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WalletMoney, CardReceive, CardSend, Profile2User } from "iconsax-react";
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
  return (
    <div className="relative flex flex-1 flex-col justify-between gap-[13px] overflow-hidden rounded-xl border border-zinc-100 bg-white px-5 py-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      <div
        className="absolute bottom-0 left-0 top-0 w-[4px] rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-zinc-400">{label}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-zinc-50 text-zinc-600 border border-zinc-100">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold text-primary-text">{value}</p>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const filtered = useMemo(() => {
    return ALL_ROWS.filter((row) => {
      const matchTab = activeTab === "All" || row.channel.includes(activeTab);
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        row.refNo.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q) ||
        row.channel.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [activeTab, search]);

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
          icon={<CardReceive size={18} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Amount Withdrawn"
          value="₦ 100,000,000"
          accentColor="#3B82F6"
          icon={<CardSend size={18} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Number of Transactions"
          value="250,000"
          accentColor="#EF4444"
          icon={<WalletMoney size={18} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Number of Users"
          value="100,000"
          accentColor="#013220"
          icon={<Profile2User size={18} variant="Outline" color="currentColor" />}
        />
      </div>

      {/* Tabs */}
      <div className="mt-10 mb-6">
        <UnderlineTabs tabs={TX_TABS} active={activeTab} onChange={handleTabChange} />
      </div>

      {/* Toolbar */}
      <AuditTrailToolbar tableSearch={search} onTableSearchChange={setSearch} />

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
                <td className="h-16 px-4 py-0 text-[13px] text-zinc-500 align-middle">{row.date}</td>
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
