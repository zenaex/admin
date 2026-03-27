"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Edit, Import, Sort } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";

/* ── Types ── */
type ProviderRow = {
  id: string;
  providerName: string;
  commissionType: string;
  commissionRate: string;
  cap: string;
  status: boolean;
};

/* ── Mock product detail ── */
const PRODUCT_DETAIL = {
  productName: "MTN-VTU",
  productCategory: "Utility",
  dateCreated: "Jan 6, 2025 | 9:32AM",
  phoneNumber: "08077857878",
  commissionType: "Percentage",
  commissionRate: "1.0%",
  cap: "₦50 FLAT",
  status: true,
};

/* ── Mock providers list ── */
const BASE_PROVIDERS: Omit<ProviderRow, "id">[] = [
  { providerName: "MTN",   commissionType: "Percentage",  commissionRate: "1.0%",  cap: "-", status: true  },
  { providerName: "Shago", commissionType: "% capped @",  commissionRate: "₦5000", cap: "-", status: false },
  { providerName: "Baxi",  commissionType: "Flat",        commissionRate: "₦3000", cap: "-", status: true  },
  { providerName: "Quidax",commissionType: "% capped @",  commissionRate: "₦5000", cap: "-", status: true  },
];

const ALL_PROVIDERS: ProviderRow[] = Array.from({ length: 36 }, (_, i) => ({
  ...BASE_PROVIDERS[i % BASE_PROVIDERS.length],
  id: `prov-${i}`,
  providerName:
    i < BASE_PROVIDERS.length
      ? BASE_PROVIDERS[i].providerName
      : `${BASE_PROVIDERS[i % BASE_PROVIDERS.length].providerName} (${i + 1})`,
}));

/* ── Status toggle ── */
function StatusToggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-200 transition-colors"
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm ring-0 transition-transform ${
            checked ? "translate-x-4 bg-green-500" : "translate-x-0 bg-white"
          }`}
        />
      </button>
      <span className="text-xs font-medium text-zinc-400">{checked ? "Active" : "Inactive"}</span>
    </div>
  );
}

/* ── Main view ── */
export function ProductDetailsView({ id: _id }: { id?: string }) {
  const [providerSearch, setProviderSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [productActive, setProductActive] = useState(PRODUCT_DETAIL.status);
  const [providerStatuses, setProviderStatuses] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALL_PROVIDERS.map((p) => [p.id, p.status])),
  );
  const [pendingToggle, setPendingToggle] = useState<{ id: string; value: boolean } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredProviders = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return ALL_PROVIDERS;
    return ALL_PROVIDERS.filter((p) => p.providerName.toLowerCase().includes(q));
  }, [providerSearch]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredProviders.length / pageSize)));
  const paginatedProviders = useMemo(
    () => filteredProviders.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredProviders, safePage, pageSize],
  );

  const handleConfirm = () => {
    if (!pendingToggle) return;
    setProviderStatuses((prev) => ({ ...prev, [pendingToggle.id]: pendingToggle.value }));
    setSuccessMsg(pendingToggle.value ? "Provider has been activated successfully." : "Provider has been deactivated successfully.");
    setPendingToggle(null);
  };

  return (
    <div>
      {/* Breadcrumb + Action */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/product-mgt" className="inline-flex items-center gap-1 hover:underline text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Product Management
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Product Details</span>
        </div>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-[#F7F7F7] px-3 text-xs font-semibold text-primary-text"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Product Details */}
      <section>
        <h2 className="text-[18px] font-semibold text-primary-text">Product Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 bg-white">
          {/* Detail row table */}
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500">
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Product Name</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium border-r border-zinc-100">Product Category</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium border-r border-zinc-100">Date Created</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium border-r border-zinc-100">Phone Number</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium border-r border-zinc-100">Commission type</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium border-r border-zinc-100">Commission Rate</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">CAP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-zinc-100 font-medium text-primary-text">{PRODUCT_DETAIL.productName}</td>
                <td className="px-4 py-5 border-r border-zinc-100 text-zinc-500">{PRODUCT_DETAIL.productCategory}</td>
                <td className="px-4 py-5 border-r border-zinc-100 whitespace-nowrap text-zinc-500">{PRODUCT_DETAIL.dateCreated}</td>
                <td className="px-4 py-5 border-r border-zinc-100 text-zinc-500">{PRODUCT_DETAIL.phoneNumber}</td>
                <td className="px-4 py-5 border-r border-zinc-100 text-zinc-500">{PRODUCT_DETAIL.commissionType}</td>
                <td className="px-4 py-5 border-r border-zinc-100 text-zinc-500">{PRODUCT_DETAIL.commissionRate}</td>
                <td className="px-4 py-5 text-zinc-500">{PRODUCT_DETAIL.cap}</td>
              </tr>
            </tbody>
          </table>

          {/* Status row */}
          <div className="border-t border-zinc-100 px-4 py-4">
            <p className="mb-2 text-xs font-medium text-zinc-400">Status</p>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${productActive ? "bg-green-500" : "bg-zinc-400"}`} />
              <span className="text-sm font-medium text-primary-text">{productActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Provider's Information */}
      <section className="mt-8">
        <div className="flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
          <span className="shrink-0 text-[15px] font-semibold text-primary-text">
            Provider&apos;s Information
          </span>
          <div className="ml-4 w-[260px] shrink-0">
            <AuditTrailIconSearch
              variant="toolbar"
              placeholder="Search by Name or ID"
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-zinc-50"
              aria-label="Filter"
            >
              <Sort size={18} variant="Outline" color="#17375E" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-[#17375E] transition-colors hover:bg-zinc-50"
            >
              <Import size={18} variant="Outline" color="#17375E" />
              Export
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[8px]">
          <table className="w-full border-collapse bg-white text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs">
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Provider Name</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Commission type</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Commission Rate</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">CAP</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProviders.map((row) => {
                const active = providerStatuses[row.id] ?? row.status;
                return (
                  <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 font-medium text-primary-text align-middle">{row.providerName}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.commissionType}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.commissionRate}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.cap}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                      <StatusToggle
                        checked={active}
                        onChange={(val) => setPendingToggle({ id: row.id, value: val })}
                        label={`Toggle status for ${row.providerName}`}
                      />
                    </td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                        aria-label={`Edit ${row.providerName}`}
                      >
                        <Edit size={16} variant="Outline" color="currentColor" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AuditTrailPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={filteredProviders.length}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </section>

      {/* Confirm toggle modal */}
      {pendingToggle && (
        <ConfirmModal
          variant={pendingToggle.value ? "approve" : "danger"}
          title={pendingToggle.value ? "Activate Provider" : "Deactivate Provider"}
          message={`Are you sure you want to ${pendingToggle.value ? "activate" : "deactivate"} this provider?`}
          confirmLabel={pendingToggle.value ? "Activate" : "Deactivate"}
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={() => setPendingToggle(null)}
        />
      )}

      {successMsg && (
        <SuccessModal message={successMsg} onContinue={() => setSuccessMsg(null)} />
      )}
    </div>
  );
}
