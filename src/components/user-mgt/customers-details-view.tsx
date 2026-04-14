"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown2, ArrowLeft2, ArrowRight2, WalletMoney, CardReceive, CardSend, Copy, DocumentDownload, Warning2, Forbidden2, CloseCircle, Forbidden, DocumentText, Document } from "iconsax-react";
import { Download, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";

/* ── Tab config ── */
type CustomerDetailTab = "Customer Details" | "Transaction History" | "KYC Details" | "Wallet" | "Audit Log";
const TABS: CustomerDetailTab[] = ["Customer Details", "Transaction History", "KYC Details", "Wallet", "Audit Log"];

/* ── Mock data ── */
const CUSTOMER_INFO = {
  accountId: "10124325326267",
  customerName: "Shakur Waisu",
  username: "@Shakur2pacs",
  phoneNumber: "08077657678",
  emailAddress: "Shakurwasiu@gmail.com",
  dateOnboarded: "Jan 6, 2025 | 9:32AM",
};

const ACCOUNT_INFO = {
  passcode: "Set" as "Set" | "Not Set",
  transactionPin: "Set" as "Set" | "Not Set",
  kycLevel: "Tier 2",
  accountStatus: "Active" as "Active" | "Inactive" | "Blocked" | "PND" | "Lien",
  dateTransactedLast: "Jan 6, 2025 | 9:32AM",
  securityQuestion: "Not Set" as "Set" | "Not Set",
};

/* ── Main view ── */
type CustomerDetailsViewProps = {
  id?: string;
};

export function CustomerDetailsView({ id: _id }: CustomerDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>("Customer Details");
  const [actionOpen, setActionOpen] = useState(false);

  const ACTION_ITEMS = [
    { label: "Account Statement", icon: <DocumentDownload size={16} variant="Outline" color="currentColor" /> },
    { label: "Place on Lien",     icon: <Warning2        size={16} variant="Outline" color="currentColor" /> },
    { label: "PND Account",       icon: <Forbidden2      size={16} variant="Outline" color="currentColor" /> },
    { label: "Block Account",     icon: <CloseCircle     size={16} variant="Outline" color="currentColor" /> },
    { label: "Deactivate Account",icon: <Forbidden       size={16} variant="Outline" color="currentColor" /> },
  ];

  return (
    <div >
      {/* Breadcrumb + Action */}
      <div className="h-[66px] mb-6 flex items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/user-mgt/customers" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Customers
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Customer Details</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setActionOpen((o) => !o)}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text"
          >
            Action
            <ArrowDown2 size={12} variant="Outline" color="currentColor" className={`transition-transform ${actionOpen ? "rotate-180" : ""}`} />
          </button>
          {actionOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActionOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg">
                {ACTION_ITEMS.map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActionOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50"
                  >
                    <span className="text-zinc-500">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <UnderlineTabs
        tabs={TABS.map((t) => ({ id: t, label: t }))}
        active={activeTab}
        onChange={(id) => setActiveTab(id as CustomerDetailTab)}
      />

      {/* Tab content */}
      {activeTab === "Customer Details" && <CustomerDetailsTab />}
      {activeTab === "Transaction History" && <TransactionHistoryTab />}
      {activeTab === "KYC Details" && <KycDetailsTab />}
      {activeTab === "Wallet" && <WalletTab />}
      {activeTab === "Audit Log" && <AuditLogTab />}
    </div>
  );
}

/* ── Customer Details tab ── */
function CustomerDetailsTab() {
  return (
    <>
      {/* Customer Details table */}
      <section className="mt-6">
        <h2 className="text-[18px] font-semibold text-primary-text">Customer Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Account ID</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Customer Name</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Username</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Phone Number</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Email Address</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date Onboarded</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline font-medium text-gray-900 underline underline-offset-2">
                  {CUSTOMER_INFO.accountId}
                </td>
                <td className="px-4 py-5 border-r border-outline text-primary-text">{CUSTOMER_INFO.customerName}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{CUSTOMER_INFO.username}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{CUSTOMER_INFO.phoneNumber}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{CUSTOMER_INFO.emailAddress}</td>
                <td className="px-4 py-5 whitespace-nowrap text-zinc-500">{CUSTOMER_INFO.dateOnboarded}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Account Details table */}
      <section className="mt-8">
        <div className="overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Passcode</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Transaction PIN</th>
                <th className="border-b border-outline px-4 py-3 font-medium">KYC Level</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Account Status</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date Transacted Last</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Security Question</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline">
                  <SetBadge value={ACCOUNT_INFO.passcode} />
                </td>
                <td className="px-4 py-5 border-r border-outline">
                  <SetBadge value={ACCOUNT_INFO.transactionPin} />
                </td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{ACCOUNT_INFO.kycLevel}</td>
                <td className="px-4 py-5 border-r border-outline">
                  <AccountStatusBadge status={ACCOUNT_INFO.accountStatus} />
                </td>
                <td className="px-4 py-5 border-r border-outline whitespace-nowrap text-zinc-500">
                  {ACCOUNT_INFO.dateTransactedLast}
                </td>
                <td className="px-4 py-5">
                  <SetBadge value={ACCOUNT_INFO.securityQuestion} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ── Transaction History tab ── */
type TxStatus = "Successful" | "Pending" | "Failed";

type TransactionRow = {
  id: string;
  referenceNo: string;
  customerName: string;
  channel: string;
  amount: string;
  biller: string;
  status: TxStatus;
  date: string;
};

const BASE_TRANSACTIONS: Omit<TransactionRow, "id">[] = [
  { referenceNo: "Zenx_WVA_S373000PN", customerName: "Naomi Salisu", channel: "Crypto", amount: "₦ 20,000", biller: "BAXI", status: "Successful", date: "Jan 6, 2026 | 9:32AM" },
  { referenceNo: "Zenx_WVA_S373000PN", customerName: "Job Awolowo", channel: "Deposit", amount: "₦ 20,000", biller: "BAXI", status: "Successful", date: "Jan 6, 2026 | 9:32AM" },
  { referenceNo: "Zenx_WVA_S373000PN", customerName: "Martha Kalio", channel: "Withdrawal", amount: "₦ 20,000", biller: "XPRESS_PAYMENT", status: "Pending", date: "Jan 6, 2026 | 9:32AM" },
  { referenceNo: "Zenx_WVA_S373000PN", customerName: "Victoria Salisu", channel: "Giftcard", amount: "₦ 20,000", biller: "XPRESS_PAYMENT", status: "Pending", date: "Jan 6, 2026 | 9:32AM" },
  { referenceNo: "Zenx_WVA_S373000PN", customerName: "Mary Kalio", channel: "Esim", amount: "₦ 20,000", biller: "XPRESS_PAYMENT", status: "Successful", date: "Jan 6, 2026 | 9:32AM" },
  { referenceNo: "Zenx_WVA_S373000PN", customerName: "Joseph Anunobi", channel: "Etrade", amount: "₦ 20,000", biller: "XPRESS_PAYMENT", status: "Successful", date: "Jan 6, 2026 | 9:32AM" },
  { referenceNo: "Zenx_WVA_S373000PN", customerName: "Sarah Ibe", channel: "Buy Crypto", amount: "₦ 20,000", biller: "CRIBD", status: "Failed", date: "Jan 6, 2026 | 9:32AM" },
];

const ALL_TRANSACTIONS: TransactionRow[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_TRANSACTIONS[i % BASE_TRANSACTIONS.length],
  id: `tx-${i}`,
}));

function TransactionHistoryTab() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_TRANSACTIONS;
    return ALL_TRANSACTIONS.filter(
      (t) =>
        t.referenceNo.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.biller.toLowerCase().includes(q),
    );
  }, [search]);

  const totalItems = filtered.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const paginatedRows = useMemo(() => filtered.slice((safePage - 1) * pageSize, safePage * pageSize), [filtered, safePage, pageSize]);

  const allChecked = paginatedRows.length > 0 && paginatedRows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) paginatedRows.forEach((r) => next.delete(r.id));
      else paginatedRows.forEach((r) => next.add(r.id));
      return next;
    });
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      {/* Stat cards */}
      <div className="mt-6 flex gap-3">
        <TxStatCard label="Total Available Balance" value="₦ 150,000" accentColor="var(--color-primary-green)" icon={<WalletMoney size={20} variant="Outline" color="currentColor" />} />
        <TxStatCard label="Total Amount Inflow" value="100,000" accentColor="var(--color-vivid-azure)" icon={<CardReceive size={20} variant="Outline" color="currentColor" />} />
        <TxStatCard label="Total Amount Outflow" value="50,000" accentColor="var(--color-failed)" icon={<CardSend size={20} variant="Outline" color="currentColor" />} />
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <span className="shrink-0 text-[15px] font-semibold text-primary-text">
          All Transactions ({totalItems.toLocaleString()})
        </span>
        <div className="ml-4 w-[280px] shrink-0">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by Reference No"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle" aria-label="Filter">
            <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
            >
              <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
              Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <DocumentText size={18} variant="Outline" color="currentColor" />
                      CSV
                    </button>
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <Document size={18} variant="Outline" color="currentColor" />
                      PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="h-11 w-10 border-b border-zinc-200 px-4 py-0 align-middle">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                />
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Reference No</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Customer Names</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Channel</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Amount</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Biller</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                  />
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 font-medium text-grey-900 underline underline-offset-2 align-middle">
                  {row.referenceNo}
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.customerName}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.channel}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.amount}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.biller}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <TxStatusBadge status={row.status} />
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    </>
  );
}

/* ── Tx Stat card ── */
function TxStatCard({ label, value, accentColor, icon }: { label: string; value: string; accentColor: string; icon: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col justify-between gap-[13px] overflow-hidden rounded-xl border border-outline bg-white px-5 py-4">
      <div className="absolute bottom-0 left-0 top-0 w-[4px] rounded-r-full" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <span className="text-[13px] text-zinc-400">{label}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-outline text-zinc-400">{icon}</span>
      </div>
      <p className="mt-3 text-[28px] font-bold text-primary-text">{value}</p>
    </div>
  );
}

/* ── Tx Status badge ── */
function TxStatusBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    Successful: "bg-green-50 text-green-600",
    Pending: "bg-orange-50 text-orange-500",
    Failed: "bg-red-50 text-red-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

/* ── Set / Not Set badge ── */
function SetBadge({ value }: { value: "Set" | "Not Set" }) {
  return (
    <span className={`text-sm font-medium ${value === "Set" ? "text-green-600" : "text-red-500"}`}>
      {value}
    </span>
  );
}

/* ── Account Status badge ── */
function AccountStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-green-50 text-green-600",
    Inactive: "bg-zinc-100 text-zinc-500",
    Blocked: "bg-red-50 text-red-500",
    PND: "bg-red-50 text-red-500",
    Lien: "bg-red-50 text-red-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status] ?? "text-zinc-500"}`}>
      {status}
    </span>
  );
}

/* ── Wallet tab ── */
const WALLETS = [
  { name: "Bitcoin", ticker: "BTC", address: "3r2G7GVaSwsaPaW1ALxs", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1280px-Bitcoin.svg.png" },
  { name: "Ethereum", ticker: "ETH", address: "3r2G7GVaSwsaPaW1ALxs", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJDn0ojTITvcdAzMsfBMJaZC4STaDHzduleQ&s" },
  { name: "Cardano", ticker: "ADA", address: "3r2G7GVaSwsaPaW1ALxs", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLdd9WfS3QIH6smKyelNNojxodAJk9w03ZmA&s" },
  { name: "Tron", ticker: "TRX", address: "3r2G7GVaSwsaPaW1ALxs", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBsWaz0K2kxYpSFMhQ2pPdBcnOwpQHWYEyzw&s" },
  { name: "Solana", ticker: "SOL", address: "3r2G7GVaSwsaPaW1ALxs", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYjqar5ovv3GMyrHAY2qoIdX6boeg0GYVAIA&s" },
  { name: "Tether", ticker: "USDT", address: "3r2G7GVaSwsaPaW1ALxs", logo: "https://cdn-icons-png.flaticon.com/512/825/825508.png" },
];

function WalletTab() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (address: string, idx: number) => {
    navigator.clipboard.writeText(address);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <section className="mt-6">
      <h2 className="text-[18px] font-semibold text-primary-text">Wallet Details</h2>
      <div className="mt-4 rounded-xl border border-outline bg-white">
        {WALLETS.map((wallet, idx) => (
          <div
            key={wallet.ticker}
            className={`flex items-center gap-4 px-5 py-4 ${idx < WALLETS.length - 1 ? "border-b border-outline" : ""
              }`}
          >

            {/* Logo */}
            <Image
              src={wallet.logo}
              alt={wallet.name}
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
              unoptimized
            />

            {/* Name + ticker */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary-text">{wallet.name}</span>
              <span className="text-xs text-zinc-400">{wallet.ticker}</span>
            </div>

            {/* Address + copy */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-medium text-primary-text">{wallet.address}</span>
              <button
                type="button"
                onClick={() => handleCopy(wallet.address, idx)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-600"
                aria-label={`Copy ${wallet.name} address`}
              >
                {copiedIdx === idx ? (
                  <span className="text-xs font-medium text-green-600">✓</span>
                ) : (
                  <Copy size={16} variant="Outline" color="currentColor" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── KYC Details tab ── */
function KycDetailsTab() {
  return (
    <>
      {/* Tier 1 Details */}
      <section className="mt-6">
        <h2 className="text-[18px] font-semibold text-primary-text">Tier 1 Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Name</th>
                <th className="border-b border-outline px-4 py-3 font-medium">BVN</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date of Birth</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline text-primary-text">Shakur Waisu</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">23231212321</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">Oct. 19, 1988</td>
                <td className="px-4 py-5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Approved
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tier 2 Details */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-primary-text">Tier 2 Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">ID Type</th>
                <th className="border-b border-outline px-4 py-3 font-medium">ID Number</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date Issued</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date of Expiry</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline text-primary-text">NIN</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">23231212321</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">-</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">-</td>
                <td className="px-4 py-5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Approved
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ── Audit Log tab ── */
type ActivityItem = {
  time: string;
  message: string;
  userAgent: string;
  ip: string;
};

const todayActivities: ActivityItem[] = Array.from({ length: 4 }, () => ({
  time: "2022-01-19 03:14:07",
  message: "User Logged in with fingerprint successfully",
  userAgent: "Mozilla5.0 (Windows 11; Win 64; x64",
  ip: "192.160.1.1",
}));

const yesterdayActivities: ActivityItem[] = Array.from({ length: 4 }, () => ({
  time: "2022-01-19 03:14:07",
  message: "User Logged in with fingerprint successfully",
  userAgent: "Mozilla5.0 (Windows 11; Win 64; x64",
  ip: "192.160.1.1",
}));

function ActivityGroup({ title, items }: { title: string; items: ActivityItem[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-[18px] font-semibold text-primary-text">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, idx) => (
          <div
            key={`${title}-${idx}`}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-xl border border-outline bg-white px-4 py-4 text-sm"
          >
            <span className="rounded-md bg-outline px-2 py-1 text-sidebar-dark">{item.time}</span>
            <span className="text-sidebar-dark">{item.message}</span>
            <span className="text-sidebar-dark">{item.userAgent}</span>
            <span className="text-sidebar-dark">{item.ip}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditLogTab() {
  return (
    <>
      <ActivityGroup title="Today - 10th March, 2026" items={todayActivities} />
      <ActivityGroup title="Yesterday - 9th March, 2026" items={yesterdayActivities} />
    </>
  );
}

/* ── Placeholder for other tabs ── */
function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="mt-6 rounded-xl border border-outline bg-white px-6 py-10 text-center text-zinc-400">
      {label} content will go here.
    </div>
  );
}
