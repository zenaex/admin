"use client";

import React, { useMemo, useState } from "react";
import { Import, Sort } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { ProviderHeader } from "@/components/provider/provider-header";

/* ── Types ── */
type CustomerStatus = "Successful" | "Pending" | "Failed";

type Customer = {
  id: string;
  initials: string;
  avatarColor: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  dateOnboarded: string;
};

/* ── Seed data ── */
const BASE_CUSTOMERS: Omit<Customer, "id">[] = [
  { initials: "AT", avatarColor: "bg-orange-100 text-orange-600",  name: "Adekunle Timothy",  handle: "@kunielin",    email: "Adekunle@gmail.com",       phone: "08077657878", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "TN", avatarColor: "bg-teal-100 text-teal-600",      name: "Timothy Nasiru",    handle: "@Timo",        email: "Nastimo@gmail.com",        phone: "08077657878", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "BT", avatarColor: "bg-blue-100 text-blue-600",      name: "Babangida Tunde",   handle: "@Bangi",       email: "Babangida@yahoo.com",      phone: "08077657878", status: "Pending",    dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "CN", avatarColor: "bg-purple-100 text-purple-600",  name: "Chiamaka Ngozi",    handle: "@maxxxxxx",    email: "Maxngigozi@gmail.com",     phone: "08077657878", status: "Pending",    dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "CI", avatarColor: "bg-green-100 text-green-600",    name: "Chiroma Ikechukwu", handle: "@Chillboy",    email: "Ikechukwe@gmail.com",      phone: "08077657878", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "CA", avatarColor: "bg-pink-100 text-pink-600",      name: "Chizoba Adekunle",  handle: "@Chigirl",     email: "Chizoba@gmail.com",        phone: "08077657878", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "LJ", avatarColor: "bg-indigo-100 text-indigo-600",  name: "Lala Jibola",       handle: "@Ogala",       email: "Lalajibola@gmail.com",     phone: "08077657878", status: "Failed",     dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "PF", avatarColor: "bg-yellow-100 text-yellow-600",  name: "Pelumi Fetuga",     handle: "@Fat",         email: "Pelumifetuga@gmail.com",   phone: "08077657878", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "PI", avatarColor: "bg-rose-100 text-rose-600",      name: "Precious Ikotun",   handle: "@Biotunegbeda", email: "Precioudikotun@gmail.com", phone: "08077657878", status: "Pending",    dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "PL", avatarColor: "bg-cyan-100 text-cyan-600",      name: "Poco Lee",          handle: "@pocojee",     email: "Poco.lee@yahoo.com",       phone: "08077657878", status: "Failed",     dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { initials: "SW", avatarColor: "bg-lime-100 text-lime-700",      name: "Shakur Wasiu",      handle: "@2pacsshakur", email: "Shakurrwasiu@gmail.com",   phone: "08077657878", status: "Failed",     dateOnboarded: "Jan 6, 2026 | 9:32AM" },
];

const ALL_CUSTOMERS: Customer[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_CUSTOMERS[i % BASE_CUSTOMERS.length],
  id: `customer-${i}`,
  name:
    i < BASE_CUSTOMERS.length
      ? BASE_CUSTOMERS[i].name
      : `${BASE_CUSTOMERS[i % BASE_CUSTOMERS.length].name} (${i + 1})`,
}));

/* ── Stat card ── */
function StatCard({
  label, value, accentColor, icon,
}: { label: string; value: string; accentColor: string; icon: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col justify-between gap-[13px] overflow-hidden rounded-xl border border-outline bg-white px-5 py-4">
      <div className="absolute bottom-0 left-0 top-0 w-[4px] rounded-r-full" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <span className="text-[13px] text-zinc-400">{label}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-outline text-zinc-400">{icon}</span>
      </div>
      <p className="text-[28px] font-bold text-primary-text">{value}</p>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: CustomerStatus }) {
  const styles: Record<CustomerStatus, string> = {
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

/* ── Avatar ── */
function Avatar({ initials, colorClass }: { initials: string; colorClass: string }) {
  return (
    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}>
      {initials}
    </span>
  );
}

/* ── Main view ── */
export function CustomersView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_CUSTOMERS;
    return ALL_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [search]);

  const totalItems = filtered.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

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
    <div>
      <ProviderHeader title="Customers" />

      {/* Stat cards */}
      <div className="mt-6 flex gap-3">
        <StatCard
          label="Total Customers"
          value="₦ 150,000"
          accentColor="var(--color-primary-green)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          }
        />
        <StatCard
          label="Active Customers"
          value="100,000"
          accentColor="var(--color-vivid-azure)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6"/><circle cx="17" cy="8" r="3"/><path d="M21 20c0-3.3-2.7-6-6-6"/></svg>
          }
        />
        <StatCard
          label="Inactive Customers"
          value="50,000"
          accentColor="var(--color-failed)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="17" y1="3" x2="22" y2="8"/></svg>
          }
        />
        <StatCard
          label="New Sign ups"
          value="50,000"
          accentColor="var(--color-secondary-green)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="8" r="4"/><path d="M2 20c0-4 3.6-7 8-7"/><path d="M19 8v6m3-3h-6"/></svg>
          }
        />
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <div className="w-[280px] shrink-0">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by name or ID"
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
            <Sort size={18} variant="Outline" color="var(--color-brand-navy)" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
          >
            <Import size={18} variant="Outline" color="var(--color-brand-navy)" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-surface-subtle text-xs text-zinc-400">
              <th className="h-11 w-10 border-b border-zinc-200 px-4 py-0 align-middle">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                />
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                <span className="inline-flex items-center gap-1">Customer Name</span>
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email Address</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Phone Number</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Onboarded</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-surface-subtle">
                <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                  />
                </td>
                <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                  <div className="flex items-center gap-3">
                    <Avatar initials={row.initials} colorClass={row.avatarColor} />
                    <div>
                      <p className="font-medium text-primary-text leading-tight">{row.name}</p>
                      <p className="text-xs text-zinc-400 leading-tight">{row.handle}</p>
                    </div>
                  </div>
                </td>
                <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.phone}</td>
                <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                  <StatusBadge status={row.status} />
                </td>
                <td className="h-16 border-b border-outline px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">
                  {row.dateOnboarded}
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
    </div>
  );
}
