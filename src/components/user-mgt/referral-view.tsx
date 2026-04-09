"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CloseCircle } from "iconsax-react";
import { Download, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { ProviderHeader } from "@/components/provider/provider-header";
import { SuccessModal } from "@/components/provider/provider-modals";

/* ── Types ── */
type Referral = {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  referralMade: number;
  totalRewardsEarned: string;
};

/* ── Seed data ── */
const BASE_REFERRALS: Omit<Referral, "id">[] = [
  { name: "Adeboye Temidayo", email: "Adeboye.temidayo@zaneax.com", phone: "08077657678", referralCode: "bigbear444", referralMade: 40, totalRewardsEarned: "₦60,000.00" },
  { name: "Azuka Adefemi", email: "Azuka.adefemi@zaneax.com", phone: "08077657678", referralCode: "Baddoooo", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Babangida Tunde", email: "Babangida.tunde@zaneax.com", phone: "08077657678", referralCode: "BigJerry", referralMade: 40, totalRewardsEarned: "₦60,000.00" },
  { name: "Chiamaka Ngozi", email: "Chiamaka.ngozi@zaneax.com", phone: "08077657678", referralCode: "Samierry01", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Chiroma Ikechukwu", email: "Chiroma.ikechukwu@zaneax.com", phone: "08077657678", referralCode: "Papitto39", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Chizoba Adekunle", email: "Chizoba.adekunle@shago.com", phone: "08077657678", referralCode: "Papitto39", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Lala Jibola", email: "Lala.jibola@zaneax.com", phone: "08077657678", referralCode: "Papitto39", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Lola Serubawon", email: "Lala.serubawon@zaneax.com", phone: "08077657678", referralCode: "Papitto39", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Pelumi Fetuga", email: "Pelumi.fetuga@zaneax.com", phone: "08077657678", referralCode: "Papitto39", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Poco Lee", email: "Poco.lee@zaneax.com", phone: "08077657678", referralCode: "Papitto39", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
  { name: "Shakur Wasiu", email: "Shakur.wasiu@zaneax.com", phone: "08077657678", referralCode: "Papitto39", referralMade: 50, totalRewardsEarned: "₦60,000.00" },
];

const ALL_REFERRALS: Referral[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_REFERRALS[i % BASE_REFERRALS.length],
  id: `ref-${i}`,
  name:
    i < BASE_REFERRALS.length
      ? BASE_REFERRALS[i].name
      : `${BASE_REFERRALS[i % BASE_REFERRALS.length].name} (${i + 1})`,
}));

/* ── Avatar ── */
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-profile-picture text-xs font-semibold text-blue-grey">
      {initials}
    </span>
  );
}

/* ── Configure Earnings Modal ── */
const THRESHOLD_TYPES = ["Transaction number", "Amount spent", "Sign-up count"];

function ConfigureEarningsModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [thresholdType, setThresholdType] = useState("Transaction number");
  const [transactionNumber, setTransactionNumber] = useState("20");
  const [rewardAmount, setRewardAmount] = useState("₦5000");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl mx-4">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Configure Earnings</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          {/* Threshold Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Threshold Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={thresholdType}
                onChange={(e) => setThresholdType(e.target.value)}
              >
                {THRESHOLD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>

          {/* Transaction Number */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Transaction Number</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              placeholder="e.g. 20"
            />
          </div>

          {/* Reward Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Reward Amount</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="e.g. ₦5000"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main view ── */
export function ReferralView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConfigSuccess, setShowConfigSuccess] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_REFERRALS;
    return ALL_REFERRALS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.referralCode.toLowerCase().includes(q),
    );
  }, [search]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  return (
    <div>
      <ProviderHeader title="Referrals" />

      {/* Toolbar */}
      <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <span className="shrink-0 text-[15px] font-semibold text-primary-text">
          Referral List
        </span>
        <div className="ml-4 w-[280px] shrink-0">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by Name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
            aria-label="Filter"
          >
            <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
          >
            <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Configure Earning
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Customer Name</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Phone Number</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Referral Code</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Referral Made</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Total Rewards Earned</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer transition-colors hover:bg-zinc-50"
                onClick={() => {}}
              >
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <Link href={`/dashboard/user-mgt/referral/${row.id}`} className="flex items-center gap-3">
                    <Avatar name={row.name} />
                    <span className="text-sm font-medium text-primary-text">{row.name}</span>
                  </Link>
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.phone}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.referralCode}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle text-center">{row.referralMade}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.totalRewardsEarned}</td>
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

      {/* Configure Earnings Modal */}
      {showConfigModal && (
        <ConfigureEarningsModal
          onClose={() => setShowConfigModal(false)}
          onSave={() => {
            setShowConfigModal(false);
            setShowConfigSuccess(true);
          }}
        />
      )}

      {/* Success Modal */}
      {showConfigSuccess && (
        <SuccessModal
          message="Earning configuration has been saved successfully"
          confirmLabel="Done"
          onContinue={() => setShowConfigSuccess(false)}
        />
      )}
    </div>
  );
}
