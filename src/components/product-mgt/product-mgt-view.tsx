"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown2, Edit, WalletMoney, CardReceive, CardSend } from "iconsax-react";
import { Download, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { ProviderHeader } from "@/components/provider/provider-header";

/* ── Types ── */
type ProductTab = "All" | "Utility" | "Crypto" | "Giftcard" | "E-sim";
type ProductStatus = "Active" | "Inactive";

type ProductRow = {
  id: string;
  productName: string;
  productCategory: string;
  commissionType: string;
  commissionRate: string;
  cap: string;
  switchProvider: string;
  status: ProductStatus;
};

/* ── Seed data ── */
const PROVIDERS = ["Buypower", "Presmit", "Quidax", "Baxi", "Flutterwave"];

const BASE_PRODUCTS: Omit<ProductRow, "id">[] = [
  { productName: "EKEDC Postpaid", productCategory: "Electricity", commissionType: "Percentage", commissionRate: "1.0%", cap: "-", switchProvider: "Buypower", status: "Active" },
  { productName: "Spectranet Data", productCategory: "Internet", commissionType: "% capped @", commissionRate: "₦50 FLAT", cap: "₦60 FLAT", switchProvider: "Presmit", status: "Active" },
  { productName: "Global 139", productCategory: "E-sim", commissionType: "Flat", commissionRate: "₦5000", cap: "-", switchProvider: "Buypower", status: "Active" },
  { productName: "Amazon USA", productCategory: "Giftcard", commissionType: "Percentage", commissionRate: "₦5000", cap: "-", switchProvider: "Buypower", status: "Active" },
  { productName: "Google Play UK", productCategory: "Giftcard", commissionType: "% capped @", commissionRate: "₦5000", cap: "1.0", switchProvider: "Buypower", status: "Inactive" },
  { productName: "Bitcoin", productCategory: "Crypto", commissionType: "% capped @", commissionRate: "₦5000", cap: "-", switchProvider: "Quidax", status: "Active" },
  { productName: "Spectranet Data", productCategory: "Internet", commissionType: "% capped @", commissionRate: "₦5000", cap: "-", switchProvider: "Buypower", status: "Inactive" },
  { productName: "Spectranet Data", productCategory: "Internet", commissionType: "% capped @", commissionRate: "₦5000", cap: "-", switchProvider: "Buypower", status: "Active" },
  { productName: "Spectranet Data", productCategory: "Internet", commissionType: "% capped @", commissionRate: "₦5000", cap: "-", switchProvider: "Buypower", status: "Active" },
  { productName: "Spectranet Data", productCategory: "Internet", commissionType: "% capped @", commissionRate: "₦5000", cap: "-", switchProvider: "Buypower", status: "Active" },
  { productName: "Spectranet Data", productCategory: "Internet", commissionType: "% capped @", commissionRate: "₦5000", cap: "-", switchProvider: "Buypower", status: "Active" },
];

const ALL_PRODUCTS: ProductRow[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_PRODUCTS[i % BASE_PRODUCTS.length],
  id: `product-${i}`,
  productName:
    i < BASE_PRODUCTS.length
      ? BASE_PRODUCTS[i].productName
      : `${BASE_PRODUCTS[i % BASE_PRODUCTS.length].productName} (${i + 1})`,
}));

const TABS: ProductTab[] = ["All", "Utility", "Crypto", "Giftcard", "E-sim"];

const TAB_CATEGORY_MAP: Record<ProductTab, string | null> = {
  All: null,
  Utility: "Electricity",
  Crypto: "Crypto",
  Giftcard: "Giftcard",
  "E-sim": "E-sim",
};

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

/* ── Status toggle (same style as provider details) ── */
function StatusToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-200 transition-colors"
      >
        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm ring-0 transition-transform ${checked ? "translate-x-4 bg-green-500" : "translate-x-0 bg-white"}`} />
      </button>
      <span className="text-xs text-zinc-400">{checked ? "Active" : "Inactive"}</span>
    </div>
  );
}

/* ── Switch Provider dropdown (per row) ── */
function ProviderDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-primary-text"
      >
        {value}
        <ArrowDown2 size={12} variant="Outline" color="currentColor" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { onChange(p); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-surface-subtle ${value === p ? "font-semibold text-primary-text" : "text-zinc-500"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main view ── */
export function ProductMgtView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductTab>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [statuses, setStatuses] = useState<Record<string, ProductStatus>>({});
  const [providers, setProviders] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    const category = TAB_CATEGORY_MAP[activeTab];
    const q = search.trim().toLowerCase();
    return ALL_PRODUCTS.filter((p) => {
      if (category && p.productCategory !== category) return false;
      if (q) return p.productName.toLowerCase().includes(q) || p.productCategory.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      return true;
    });
  }, [activeTab, search]);

  const totalItems = filteredProducts.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const paginatedRows = useMemo(() => filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize), [filteredProducts, safePage, pageSize]);

  const getStatus = (row: ProductRow) => statuses[row.id] ?? row.status;
  const getProvider = (row: ProductRow) => providers[row.id] ?? row.switchProvider;

  return (
    <div>
      {/* Reuse provider header pattern (title + search + bell + gear) */}
      <ProviderHeader title="Product Management" />

      {/* Stat cards */}
      <div className="mt-6 flex gap-3">
        <StatCard label="Total Products" value="100,000" accentColor="var(--color-primary-green)" icon={<WalletMoney size={20} variant="Outline" color="currentColor" />} />
        <StatCard label="Active Products" value="100,000" accentColor="var(--color-vivid-azure)" icon={<CardReceive size={20} variant="Outline" color="currentColor" />} />
        <StatCard label="Inactive Products" value="50,000" accentColor="var(--color-failed)" icon={<CardSend size={20} variant="Outline" color="currentColor" />} />
      </div>

      {/* Tab bar */}
      <div className="mt-6">
        <UnderlineTabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => { setActiveTab(id as ProductTab); setPage(1); }}
        />
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <div className="w-[280px] shrink-0">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle" aria-label="Filter">
            <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          </button>
          <button type="button" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle">
            <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Product Name</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Product Category</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Commission type</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Commission Rate</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">CAP</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Switch Provider</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} onClick={() => router.push(`/dashboard/product-mgt/${row.id}`)} className="cursor-pointer transition-colors hover:bg-surface-subtle">
                <td className="h-16 border-b border-outline px-4 py-0 font-medium text-primary-text align-middle">{row.productName}</td>
                <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.productCategory}</td>
                <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.commissionType}</td>
                <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.commissionRate}</td>
                <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.cap}</td>
                <td className="h-16 border-b border-outline px-4 py-0 align-middle" onClick={(e) => e.stopPropagation()}>
                  <ProviderDropdown
                    value={getProvider(row)}
                    onChange={(v) => setProviders((prev) => ({ ...prev, [row.id]: v }))}
                  />
                </td>
                <td className="h-16 border-b border-outline px-4 py-0 align-middle" onClick={(e) => e.stopPropagation()}>
                  <StatusToggle
                    checked={getStatus(row) === "Active"}
                    onChange={(v) => setStatuses((prev) => ({ ...prev, [row.id]: v ? "Active" : "Inactive" }))}
                  />
                </td>
                <td className="h-16 border-b border-outline px-4 py-0 align-middle" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="text-zinc-400 transition-colors hover:text-zinc-600" aria-label="Edit">
                    <Edit size={18} variant="Outline" color="currentColor" />
                  </button>
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
