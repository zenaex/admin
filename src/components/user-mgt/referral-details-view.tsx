"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, People, UserTick, UserRemove, WalletMoney, DocumentText, Document } from "iconsax-react";
import { Download, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";

/* ── Types ── */
type ReferredStatus = "Reward Pending" | "Onboarded" | "Invite Pending" | "Pending" | "Reward Earned" | "Successful";

type ReferredUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  date: string;
  status: ReferredStatus;
};

/* ── Mock data ── */
const CUSTOMER = {
  name: "Shakur Waisu",
  username: "2pacshakur",
  email: "Shakur.wasiu@zenaex.com",
  phone: "08077657678",
};

const STATUSES: ReferredStatus[] = ["Reward Pending", "Onboarded", "Invite Pending", "Pending", "Reward Earned", "Successful"];

const BASE_REFERRED: Omit<ReferredUser, "id">[] = [
  { name: "Adeboye Temidayo", email: "Adeboye.temidayo@gmail.com", phone: "08098776576", referralCode: "bigbear444", date: "Jan 6, 2026 | 9:32AM", status: "Reward Pending" },
  { name: "Azuka Adefemi", email: "Azuka.adefemi@zaneax.com", phone: "08098776576", referralCode: "bigbear444", date: "Jan 6, 2026 | 9:32AM", status: "Onboarded" },
  { name: "Chiamaka Ngozi", email: "Chiamaka.ngozi@gmail.com", phone: "08098776576", referralCode: "bigbear444", date: "Jan 6, 2026 | 9:32AM", status: "Invite Pending" },
  { name: "Lala Serubawon", email: "Lala.serubawon@gmail.com", phone: "08098776576", referralCode: "bigbear444", date: "Jan 6, 2026 | 9:32AM", status: "Pending" },
  { name: "Poco Lee", email: "Poco.lee@gmail.com", phone: "08098776576", referralCode: "bigbear444", date: "Jan 6, 2026 | 9:32AM", status: "Reward Earned" },
  { name: "Shakur Wasiu", email: "Shakur.wasiu@gmail.com", phone: "08077657678", referralCode: "bigbear444", date: "Jan 6, 2026 | 9:32AM", status: "Successful" },
];

const ALL_REFERRED: ReferredUser[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_REFERRED[i % BASE_REFERRED.length],
  id: `referred-${i}`,
  name:
    i < BASE_REFERRED.length
      ? BASE_REFERRED[i].name
      : `${BASE_REFERRED[i % BASE_REFERRED.length].name} (${i + 1})`,
}));

/* ── Stat card ── */
function StatCard({ label, value, accentColor, icon }: { label: string; value: string; accentColor: string; icon: React.ReactNode }) {
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

/* ── Status badge ── */
function ReferredStatusBadge({ status }: { status: ReferredStatus }) {
  const styles: Record<ReferredStatus, string> = {
    "Reward Pending": "text-orange-500",
    Onboarded:       "text-vivid-azure",
    "Invite Pending": "text-coral-red",
    Pending:          "text-pending",
    "Reward Earned":  "text-brand-purple",
    Successful:       "text-green-600",
  };
  return (
    <span className={`text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

/* ── Main view ── */
type ReferralDetailsViewProps = {
  id?: string;
};

export function ReferralDetailsView({ id: _id }: ReferralDetailsViewProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_REFERRED;
    return ALL_REFERRED.filter(
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
      {/* Breadcrumb + Action */}
      <div className="h-[66px] mb-6 flex items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/user-mgt/referral" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Referrals
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Referral Details</span>
        </div>

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="flex gap-3">
        <StatCard label="Total Referrals Made" value="56" accentColor="#BCEB0F" icon={<People size={20} variant="Outline" color="currentColor" />} />
        <StatCard label="Onboarded Referred Users" value="100,000" accentColor="#3B82F6" icon={<UserTick size={20} variant="Outline" color="currentColor" />} />
        <StatCard label="Pending Referred Users" value="50,000" accentColor="#EF4444" icon={<UserRemove size={20} variant="Outline" color="currentColor" />} />
        <StatCard label="Total Rewards Earned" value="₦50,000.00" accentColor="#013220" icon={<WalletMoney size={20} variant="Outline" color="currentColor" />} />
      </div>

      {/* Customer Details */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-primary-text">Customer Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Customer Name</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Username</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Email Address</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Phone Number</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline text-primary-text font-medium">{CUSTOMER.name}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{CUSTOMER.username}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{CUSTOMER.email}</td>
                <td className="px-4 py-5 text-zinc-500">{CUSTOMER.phone}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Referred Users */}
      <section className="mt-8">
        <div className="flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
          <span className="shrink-0 text-[15px] font-semibold text-primary-text">
            Referred Users
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
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Name</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Phone Number</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Referral Code</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-sm font-medium text-primary-text align-middle">{row.name}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.phone}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.referralCode}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle whitespace-nowrap">{row.date}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                    <ReferredStatusBadge status={row.status} />
                  </td>
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
      </section>
    </div>
  );
}
