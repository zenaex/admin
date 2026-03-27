"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Edit, Import, Sort } from "iconsax-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { AddProductModal, ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";

type ProviderDetail = {
  providerId: string;
  providerName: string;
  email: string;
  category: string;
  dateOnboarded: string;
  lastUpdated: string;
  status: "Active" | "Inactive";
};

type ProductRow = {
  id: string;
  productName: string;
  productCategory: string;
  commissionType: "Percentage" | "% capped @" | "Flat";
  commissionRate: string;
  cap: string;
  status: boolean;
};

const PROVIDER_DETAIL: ProviderDetail = {
  providerId: "Zena-77w6727",
  providerName: "Baxi",
  email: "Hi@baxi.com",
  category: "Bills Payment",
  dateOnboarded: "Jan 6, 2025 | 9:32AM",
  lastUpdated: "Jan 6, 2025 | 9:32AM",
  status: "Active",
};

const BASE_PRODUCTS: Omit<ProductRow, "id">[] = [
  { productName: "EKEDC Postpaid",  productCategory: "Electricity", commissionType: "Percentage",  commissionRate: "1.0%",     cap: "-",        status: true  },
  { productName: "Spectranet Data", productCategory: "Internet",    commissionType: "% capped @",  commissionRate: "₦50 FLAT", cap: "₦50 FLAT", status: true  },
  { productName: "Global 139",      productCategory: "E-sim",       commissionType: "Flat",        commissionRate: "₦5000",    cap: "-",        status: true  },
  { productName: "Spectranet Data", productCategory: "Internet",    commissionType: "% capped @",  commissionRate: "₦5000",    cap: "-",        status: false },
  { productName: "Spectranet Data", productCategory: "Internet",    commissionType: "% capped @",  commissionRate: "₦5000",    cap: "-",        status: true  },
  { productName: "Spectranet Data", productCategory: "Internet",    commissionType: "% capped @",  commissionRate: "₦5000",    cap: "-",        status: true  },
  { productName: "Spectranet Data", productCategory: "Internet",    commissionType: "% capped @",  commissionRate: "₦5000",    cap: "-",        status: true  },
  { productName: "Spectranet Data", productCategory: "Internet",    commissionType: "% capped @",  commissionRate: "₦5000",    cap: "-",        status: true  },
];

const ALL_PRODUCTS: ProductRow[] = Array.from({ length: 100 }, (_, i) => ({
  ...BASE_PRODUCTS[i % BASE_PRODUCTS.length],
  id: `product-${i}`,
  productName:
    i < BASE_PRODUCTS.length
      ? BASE_PRODUCTS[i].productName
      : `${BASE_PRODUCTS[i % BASE_PRODUCTS.length].productName} (${i + 1})`,
}));

type StatusToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

function StatusToggle({ checked, onChange, label }: StatusToggleProps) {
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
      <span className="text-xs font-medium text-zinc-400">
        {checked ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

type ProviderDetailsViewProps = {
  id?: string;
};

export function ProviderDetailsView({ id: _id }: ProviderDetailsViewProps) {
  const [productSearch, setProductSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [productStatuses, setProductStatuses] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ALL_PRODUCTS.map((p) => [p.id, p.status])),
  );
  const [billerActive, setBillerActive] = useState(PROVIDER_DETAIL.status === "Active");

  // Modal state
  type PendingToggle = { type: "biller" } | { type: "product"; id: string; value: boolean };
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ message: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.productCategory.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    );
  }, [productSearch]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  const requestProductToggle = (id: string, value: boolean) => {
    setPendingToggle({ type: "product", id, value });
  };

  const requestBillerToggle = () => {
    setPendingToggle({ type: "biller" });
  };

  const handleConfirm = () => {
    if (!pendingToggle) return;
    if (pendingToggle.type === "biller") {
      const next = !billerActive;
      setBillerActive(next);
      setPendingToggle(null);
      setShowSuccess({ message: `Biller has been successfully ${next ? "activated" : "deactivated"}` });
    } else {
      setProductStatuses((prev) => ({ ...prev, [pendingToggle.id]: pendingToggle.value }));
      setPendingToggle(null);
      setShowSuccess({ message: `Product has been successfully ${pendingToggle.value ? "activated" : "deactivated"}` });
    }
  };

  const handleCancel = () => setPendingToggle(null);

  return (
    <div>
      {/* Breadcrumb + Action */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/provider" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Providers
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Provider Details</span>
        </div>

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-[#F7F7F7] px-3 text-xs font-semibold text-primary-text"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Provider's Details */}
      <section>
        <h2 className="text-[18px] font-semibold text-primary-text">Provider&apos;s Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 bg-white">
          <table className="w-full min-w-200 border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500 bg-zinc-50">
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Provider ID</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Provider Name</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Email Address</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Category</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Date Onboarded</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Last Updated</th>
                <th className="border-b border-zinc-100 px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-zinc-100 font-medium text-secondary-green underline underline-offset-2">
                  {PROVIDER_DETAIL.providerId}
                </td>
                <td className="px-4 py-5 border-r border-zinc-100 text-primary-text">{PROVIDER_DETAIL.providerName}</td>
                <td className="px-4 py-5 border-r border-zinc-100 text-zinc-500">{PROVIDER_DETAIL.email}</td>
                <td className="px-4 py-5 border-r border-zinc-100 text-zinc-500">{PROVIDER_DETAIL.category}</td>
                <td className="px-4 py-5 border-r border-zinc-100 whitespace-nowrap text-zinc-500">{PROVIDER_DETAIL.dateOnboarded}</td>
                <td className="px-4 py-5 border-r border-zinc-100 whitespace-nowrap text-zinc-500">{PROVIDER_DETAIL.lastUpdated}</td>
                <td className="px-4 py-5">
                  <StatusToggle
                    checked={billerActive}
                    onChange={requestBillerToggle}
                    label="Toggle biller status"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Product List */}
      <section className="mt-8">
        <div className="flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
          <span className="shrink-0 text-[15px] font-semibold text-primary-text">
            Product List ({ALL_PRODUCTS.length})
          </span>
          <div className="ml-4 w-[280px] shrink-0">
            <AuditTrailIconSearch
              variant="toolbar"
              placeholder="Search by Name or ID"
              aria-label="Search products"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
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
          <table className="w-full min-w-200 border-collapse bg-white text-left text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-500">
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Product Name</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Product Category</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Commission type</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Commission Rate</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">CAP</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-zinc-50">
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 font-medium text-primary-text align-middle">
                    {product.productName}
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                    {product.productCategory}
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                    {product.commissionType}
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                    {product.commissionRate}
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                    {product.cap}
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                    <StatusToggle
                      checked={productStatuses[product.id] ?? product.status}
                      onChange={(val) => requestProductToggle(product.id, val)}
                      label={`Toggle status for ${product.productName}`}
                    />
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                      aria-label={`Edit ${product.productName}`}
                    >
                      <Edit size={16} variant="Outline" color="currentColor" />
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
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      {/* Edit product modal */}
      {editingProduct && (
        <AddProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            setShowSuccess({ message: "Product has been successfully added" });
          }}
        />
      )}

      {/* Confirmation modal */}
      {pendingToggle && (
        <ConfirmModal
          title={pendingToggle.type === "biller" ? "Deactivate Biller" : (pendingToggle.value ? "Activate Product" : "Deactivate Product")}
          message={pendingToggle.type === "biller" ? "Are you sure you want to deactivate this biller?" : (pendingToggle.value ? "Are you sure you want to activate this product?" : "Are you sure you want to deactivate this product?")}
          confirmLabel={pendingToggle.type === "biller" ? "Yes, Deactivate" : (pendingToggle.value ? "Yes, Activate" : "Yes, Deactivate")}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Success modal */}
      {showSuccess && (
        <SuccessModal
          message={showSuccess.message}
          onContinue={() => setShowSuccess(null)}
        />
      )}
    </div>
  );
}
