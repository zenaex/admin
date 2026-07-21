"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Edit } from "iconsax-react";
import { ListFilter } from "lucide-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import {
  ConfirmModal,
  EditProductCommissionModal,
  EditProviderEmailModal,
  SuccessModal,
} from "@/components/provider/provider-modals";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  commissionApiToFormValues,
  commissionFormToApiBody,
  getAdminProviderDetail,
  patchAdminProviderEmail,
  patchAdminProviderProductCommission,
  patchAdminProviderProductToggle,
  patchAdminProviderToggle,
} from "@/lib/admin-api/providers-api";
import type { AdminProviderDetail, AdminProviderProductRow } from "@/lib/admin-api/types";

const PRODUCT_ROW_STATUS_FILTER = ["All statuses", "Active", "Inactive"] as const;

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

export function ProviderDetailsView({ id }: ProviderDetailsViewProps) {
  const [providerDetail, setProviderDetail] = useState<AdminProviderDetail | null>(null);
  const [products, setProducts] = useState<AdminProviderProductRow[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [productSearch, setProductSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "commission" | "status">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"commission" | "status">(openFilter, filterMode);

  const [draftCommission, setDraftCommission] = useState("All types");
  const [draftRowStatus, setDraftRowStatus] = useState<string>("All statuses");
  const [appliedCommission, setAppliedCommission] = useState<string | null>(null);
  const [appliedRowStatus, setAppliedRowStatus] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [productStatuses, setProductStatuses] = useState<Record<string, boolean>>({});
  const [providerActive, setProviderActive] = useState(false);

  const commissionFilterOptions = useMemo(() => {
    const types = Array.from(new Set(products.map((p) => p.commissionType))).sort();
    return ["All types", ...types];
  }, [products]);

  const loadDetail = useCallback(async () => {
    if (!id) {
      setDetailLoading(false);
      setDetailError("Provider id is missing.");
      return;
    }
    setDetailError(null);
    setDetailLoading(true);
    try {
      const result = await getAdminProviderDetail(id);
      setProviderDetail(result.provider);
      setProducts(result.products);
      setTotalProducts(result.totalProducts);
      setProductStatuses(Object.fromEntries(result.products.map((p) => [p.id, p.status])));
      setProviderActive(result.provider.status === "Active");
    } catch (e) {
      setProviderDetail(null);
      setProducts([]);
      setTotalProducts(0);
      setProductStatuses({});
      setDetailError(
        e instanceof AdminApiError ? e.message : "Could not load provider details.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  type PendingToggle =
    | { type: "provider"; nextActive: boolean }
    | { type: "product"; slug: string; nextActive: boolean };
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ message: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProviderProductRow | null>(null);
  const [editingEmail, setEditingEmail] = useState(false);

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

  const getProductRowActive = (p: AdminProviderProductRow) => productStatuses[p.id] ?? p.status;

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (appliedCommission && appliedCommission !== "All types" && p.commissionType !== appliedCommission)
        return false;
      if (appliedRowStatus && appliedRowStatus !== "All statuses") {
        const active = getProductRowActive(p);
        if (appliedRowStatus === "Active" && !active) return false;
        if (appliedRowStatus === "Inactive" && active) return false;
      }
      if (
        q &&
        !(
          p.productName.toLowerCase().includes(q) ||
          p.productCategory.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [products, productSearch, productStatuses, appliedCommission, appliedRowStatus]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const runProductExport = (format: "csv" | "json" | "pdf") => {
    const columns: ExportColumn<AdminProviderProductRow>[] = [
      { header: "Product", value: (r) => r.productName },
      { header: "Category", value: (r) => r.productCategory },
      { header: "Commission Type", value: (r) => r.commissionType },
      { header: "Rate", value: (r) => r.commissionRate },
      { header: "Cap", value: (r) => r.cap },
      {
        header: "Status",
        value: (r) => ((productStatuses[r.id] ?? r.status) ? "Active" : "Inactive"),
      },
    ];
    exportClientTable("provider-products", format, filteredProducts, columns);
  };


  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  const requestProductToggle = (product: AdminProviderProductRow, nextActive: boolean) => {
    if (nextActive === getProductRowActive(product)) return;
    setActionError(null);
    setPendingToggle({ type: "product", slug: product.slug, nextActive });
  };

  const requestProviderToggle = (nextActive: boolean) => {
    if (nextActive === providerActive) return;
    setActionError(null);
    setPendingToggle({ type: "provider", nextActive });
  };

  const handleConfirm = async () => {
    if (!pendingToggle || !id) return;
    setToggleLoading(true);
    setActionError(null);
    try {
      if (pendingToggle.type === "provider") {
        await patchAdminProviderToggle(id, pendingToggle.nextActive);
        setProviderActive(pendingToggle.nextActive);
        setShowSuccess({
          message: `Provider has been successfully ${pendingToggle.nextActive ? "activated" : "deactivated"}.`,
        });
      } else {
        await patchAdminProviderProductToggle(id, pendingToggle.slug, pendingToggle.nextActive);
        const product = products.find((p) => p.slug === pendingToggle.slug);
        if (product) {
          setProductStatuses((prev) => ({ ...prev, [product.id]: pendingToggle.nextActive }));
        }
        setShowSuccess({
          message: `Product has been successfully ${pendingToggle.nextActive ? "activated" : "deactivated"}.`,
        });
      }
      setPendingToggle(null);
      await loadDetail();
    } catch (e) {
      setActionError(e instanceof AdminApiError ? e.message : "Action failed.");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleCancel = () => {
    if (!toggleLoading) setPendingToggle(null);
  };

  return (
    <div>
      {/* Breadcrumb + Action */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
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
          className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text hover:bg-surface-subtle transition-colors"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Provider's Details */}
      <section>
        <h2 className="text-[18px] font-semibold text-primary-text">Provider&apos;s Details</h2>
        {detailError ? (
          <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {detailError}
          </p>
        ) : null}
        {actionError ? (
          <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {actionError}
          </p>
        ) : null}
        {detailLoading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading provider details…</p>
        ) : providerDetail ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
            <table className="w-full min-w-200 border-collapse text-left text-sm">
              <thead>
                <tr className="text-zinc-500 bg-surface-subtle">
                  <th className="border-b border-outline px-4 py-3 font-medium">Provider ID</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Provider Name</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Email Address</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Category</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Date Onboarded</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Last Updated</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-5 border-r border-outline font-medium text-secondary-green underline underline-offset-2">
                    {providerDetail.providerId}
                  </td>
                  <td className="px-4 py-5 border-r border-outline text-primary-text">
                    {providerDetail.providerName}
                  </td>
                  <td className="px-4 py-5 border-r border-outline text-zinc-500">
                    <div className="flex items-center gap-2">
                      <span>{providerDetail.email}</span>
                      <button
                        type="button"
                        onClick={() => setEditingEmail(true)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-outline hover:text-zinc-600"
                        aria-label="Edit provider email"
                      >
                        <Edit size={14} variant="Outline" color="currentColor" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-5 border-r border-outline text-zinc-500">{providerDetail.category}</td>
                  <td className="px-4 py-5 border-r border-outline whitespace-nowrap text-zinc-500">
                    {providerDetail.dateOnboarded}
                  </td>
                  <td className="px-4 py-5 border-r border-outline whitespace-nowrap text-zinc-500">
                    {providerDetail.lastUpdated}
                  </td>
                  <td className="px-4 py-5">
                    <StatusToggle
                      checked={providerActive}
                      onChange={requestProviderToggle}
                      label="Toggle provider status"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* Product List */}
      <section className="mt-8">
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
                  label="Commission type"
                  summary={draftCommission}
                  pillRef={registerPillRef("commission")}
                  onClick={() =>
                    setOpenFilter((v) => {
                      const next = v === "commission" ? null : "commission";
                      syncDropdownLeft(next);
                      return next;
                    })
                  }
                />
                <TableFilterPill
                  label="Status"
                  summary={draftRowStatus}
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
            dropdownLayer={
              <>
                {openFilter === "commission" ? (
                  <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                    <TableFilterPanelTitle />
                    <TableFilterOptionsList
                      options={commissionFilterOptions}
                      onSelect={(opt) => {
                        setDraftCommission(opt);
                        setOpenFilter(null);
                      }}
                    />
                  </TableFilterDropdownCard>
                ) : null}
                {openFilter === "status" ? (
                  <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[180px]">
                    <TableFilterPanelTitle />
                    <TableFilterOptionsList
                      options={[...PRODUCT_ROW_STATUS_FILTER]}
                      onSelect={(opt) => {
                        setDraftRowStatus(opt);
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
                  setAppliedCommission(draftCommission === "All types" ? null : draftCommission);
                  setAppliedRowStatus(draftRowStatus === "All statuses" ? null : draftRowStatus);
                  setOpenFilter(null);
                  setFilterMode(false);
                  setPage(1);
                }}
                onClear={() => {
                  setProductSearch("");
                  setAppliedCommission(null);
                  setAppliedRowStatus(null);
                  setDraftCommission("All types");
                  setDraftRowStatus("All statuses");
                  setOpenFilter(null);
                  setFilterMode(false);
                  setPage(1);
                }}
              />
            }
          />
        ) : (
        <div className="flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
          <span className="shrink-0 text-[15px] font-semibold text-primary-text">
            Product List ({totalProducts})
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
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
              aria-label="Filter"
              onClick={() => {
                setProductSearch("");
                setFilterMode(true);
              }}
            >
              <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
            </button>
            <TableExportMenu
              disabled={filteredProducts.length === 0}
              onExportCsv={() => runProductExport("csv")}
              onExportPdf={() => runProductExport("pdf")}
              onExportJson={() => runProductExport("json")}
            />
          </div>
        </div>
        )}

        {!detailLoading && !detailError && products.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No products for this provider.</p>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-[8px]">
          <table className="w-full min-w-200 border-collapse bg-white text-left text-sm">
            <thead>
              <tr className="bg-outline text-zinc-500">
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
                <tr key={product.id} className="transition-colors hover:bg-surface-subtle">
                  <td className="h-16 border-b border-outline px-4 py-0 font-medium text-primary-text align-middle">
                    {product.productName}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">
                    {product.productCategory}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">
                    {product.commissionType}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">
                    {product.commissionRate}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">
                    {product.cap}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                    <StatusToggle
                      checked={productStatuses[product.id] ?? product.status}
                      onChange={(val) => requestProductToggle(product, val)}
                      label={`Toggle status for ${product.productName}`}
                    />
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-outline hover:text-zinc-600"
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
      {editingEmail && providerDetail ? (
        <EditProviderEmailModal
          initialEmail={providerDetail.email}
          onClose={() => setEditingEmail(false)}
          onSave={async (email) => {
            if (!id) return;
            await patchAdminProviderEmail(id, { email });
            setEditingEmail(false);
            setShowSuccess({ message: "Provider email has been updated successfully." });
            await loadDetail();
          }}
        />
      ) : null}

      {editingProduct && id ? (
        <EditProductCommissionModal
          productName={editingProduct.productName}
          initial={commissionApiToFormValues(editingProduct)}
          onClose={() => setEditingProduct(null)}
          onSave={async (form) => {
            await patchAdminProviderProductCommission(
              id,
              editingProduct.slug,
              commissionFormToApiBody(form),
            );
            setEditingProduct(null);
            setShowSuccess({ message: "Product commission has been updated successfully." });
            await loadDetail();
          }}
        />
      ) : null}

      {pendingToggle ? (
        <ConfirmModal
          variant={pendingToggle.nextActive ? "approve" : "danger"}
          title={
            pendingToggle.type === "provider"
              ? pendingToggle.nextActive
                ? "Activate Provider"
                : "Deactivate Provider"
              : pendingToggle.nextActive
                ? "Activate Product"
                : "Deactivate Product"
          }
          message={
            pendingToggle.type === "provider"
              ? `Are you sure you want to ${pendingToggle.nextActive ? "activate" : "deactivate"} this provider?`
              : `Are you sure you want to ${pendingToggle.nextActive ? "activate" : "deactivate"} this product?`
          }
          confirmLabel={
            toggleLoading
              ? "Please wait…"
              : pendingToggle.nextActive
                ? "Yes, Activate"
                : "Yes, Deactivate"
          }
          onConfirm={() => void handleConfirm()}
          onCancel={handleCancel}
        />
      ) : null}

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
