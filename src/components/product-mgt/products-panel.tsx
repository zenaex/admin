"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown2, Edit } from "iconsax-react";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import {
  COMMISSION_TYPE_FILTER,
  PRODUCT_STATUS_FILTER,
} from "@/components/product-mgt/product-fixtures";
import type { ProductRow, ProductStatus } from "@/components/product-mgt/product-mgt-types";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";
import {
  getAdminProductsList,
  patchAdminProductToggle,
  patchAdminProductSwitchProvider,
  getAdminProductProviders,
  ProductProviderOption,
  UTILITY_PRODUCT_CATEGORY,
} from "@/lib/admin-api/products-api";
import { getAdminProvidersList } from "@/lib/admin-api/providers-api";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { TableSkeletonRows } from "@/components/ui/table-skeleton";

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
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm ring-0 transition-transform ${
            checked ? "translate-x-4 bg-green-500" : "translate-x-0 bg-white"
          }`}
        />
      </button>
      <span className="text-xs text-zinc-400">{checked ? "Active" : "Inactive"}</span>
    </div>
  );
}

function humanizeProviderName(p: string): string {
  if (!p) return "—";
  const t = p.trim();
  if (!t || t === "—" || t === "-") return "—";
  if (t.includes(" ") || (/[A-Z]/.test(t) && !t.includes("-"))) {
    return t;
  }
  const formatted = t
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return formatted || t;
}

function filterProvidersForProduct(
  productCategory: string | undefined,
  list: ProductProviderOption[],
): ProductProviderOption[] {
  const cat = (productCategory ?? "").toLowerCase();

  return list.filter((p) => {
    const nameLower = p.name.trim().toLowerCase();
    const slugLower = p.slug.trim().toLowerCase();

    if (
      nameLower.includes("threshold") ||
      slugLower.includes("threshold") ||
      nameLower === "manual" ||
      nameLower === "system" ||
      nameLower === "none" ||
      nameLower === "—" ||
      nameLower === "-"
    ) {
      return false;
    }

    if (
      cat.includes("utility") ||
      cat.includes("betting") ||
      cat.includes("airtime") ||
      cat.includes("electricity") ||
      cat.includes("cable") ||
      cat.includes("data")
    ) {
      const nonUtility = ["threshold", "quidax", "yellowcard", "binance", "paxful", "presmit", "cardvert"];
      if (nonUtility.some((n) => nameLower.includes(n) || slugLower.includes(n))) {
        return false;
      }
    }

    return true;
  });
}

function ProviderDropdown({
  productSlug,
  productCategory,
  value,
  onChange,
}: {
  productSlug: string;
  productCategory?: string;
  value: string;
  onChange: (v: ProductProviderOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ProductProviderOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && options.length === 0) {
      setLoading(true);
      getAdminProductProviders(productSlug)
        .then((list) => {
          const filteredList = filterProvidersForProduct(productCategory, list);
          setOptions(filteredList);
        })
        .catch((e) => {
          console.error(`Failed to load providers for product ${productSlug}:`, e);
          setOptions([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, productSlug, productCategory, options.length]);

  const displayLabel = humanizeProviderName(value);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.trim().toLowerCase();
    return options.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [options, searchTerm]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-primary-text hover:bg-surface-subtle transition-colors"
      >
        <span>{displayLabel === "—" ? "Select provider" : displayLabel}</span>
        <ArrowDown2
          size={12}
          variant="Outline"
          color="currentColor"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl">
          {options.length > 4 ? (
            <div className="p-1">
              <input
                type="text"
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-primary-text outline-none focus:border-zinc-400"
                placeholder="Search provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : null}

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-xs text-zinc-400">Loading providers...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-400">No matching provider</div>
            ) : (
              filteredOptions.map((p) => {
                const label = humanizeProviderName(p.name);
                const isSelected = label.toLowerCase() === displayLabel.toLowerCase();
                return (
                  <button
                    key={p.slug || p.id}
                    type="button"
                    onClick={() => {
                      onChange(p);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected ? "bg-zinc-100 font-semibold text-primary-text" : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected ? <span className="text-xs text-primary-green">✓</span> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProductsPanel() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "status" | "provider" | "commission">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"status" | "provider" | "commission">(openFilter, filterMode);

  const [draftStatus, setDraftStatus] = useState<string>("All statuses");
  const [draftProvider, setDraftProvider] = useState("All providers");
  const [draftCommission, setDraftCommission] = useState("All types");
  const [appliedProductStatus, setAppliedProductStatus] = useState<string | null>(null);
  const [appliedSwitchProvider, setAppliedSwitchProvider] = useState<string | null>(null);
  const [appliedCommissionType, setAppliedCommissionType] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statuses, setStatuses] = useState<Record<string, ProductStatus>>({});
  const [providers, setProviders] = useState<Record<string, string>>({});

  const [pendingToggle, setPendingToggle] = useState<{ row: ProductRow; nextActive: boolean } | null>(null);
  const [showSuccess, setShowSuccess] = useState<{ message: string } | null>(null);

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

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminProductsList({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: appliedProductStatus || undefined,
        provider: appliedSwitchProvider || undefined,
        commissionType: appliedCommissionType || undefined,
        category: UTILITY_PRODUCT_CATEGORY,
      });
      setProducts(res.items);
      setTotalItems(res.total);
    } catch (e) {
      console.error("Failed to load products:", e);
      setError("Failed to load products from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [
    page,
    pageSize,
    search,
    appliedProductStatus,
    appliedSwitchProvider,
    appliedCommissionType,
  ]);

  const getStatus = (row: ProductRow) => statuses[row.id] ?? row.status;
  const getProvider = (row: ProductRow) => providers[row.id] ?? row.switchProvider;

  const handleStatusToggleRequest = (row: ProductRow, nextActive: boolean) => {
    setPendingToggle({ row, nextActive });
  };

  const handleStatusToggleConfirm = async () => {
    if (!pendingToggle) return;
    const { row, nextActive } = pendingToggle;
    try {
      await patchAdminProductToggle(row.id, nextActive);
      setStatuses((prev) => ({ ...prev, [row.id]: nextActive ? "Active" : "Inactive" }));
      setPendingToggle(null);
      setShowSuccess({ message: `Product has been successfully ${nextActive ? "activated" : "deactivated"}` });
    } catch (e) {
      console.error("Failed to toggle status:", e);
      alert(e instanceof Error ? e.message : "Failed to toggle status");
    }
  };

  const [providerFilterOptions, setProviderFilterOptions] = useState<string[]>(["All providers"]);

  useEffect(() => {
    getAdminProvidersList({ pageSize: 100 })
      .then((res) => {
        if (res.items.length > 0) {
          const names = Array.from(new Set(res.items.map((p) => p.name)));
          setProviderFilterOptions(["All providers", ...names]);
        }
      })
      .catch(() => {});
  }, []);

  const handleProviderSwitch = async (row: ProductRow, option: ProductProviderOption) => {
    try {
      await patchAdminProductSwitchProvider(row.id, option.name);
      setProviders((prev) => ({ ...prev, [row.id]: option.name }));
      setShowSuccess({ message: `Active provider for ${row.productName} updated to ${humanizeProviderName(option.name)}` });
    } catch (e) {
      console.error("Failed to switch provider:", e);
      alert(e instanceof Error ? e.message : "Failed to switch provider");
    }
  };

  return (
    <>
      {filterMode ? (
        <TableFilterModeBar
          barClassName="!mt-4"
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
                label="Status"
                summary={draftStatus}
                pillRef={registerPillRef("status")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "status" ? null : "status";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Switch provider"
                summary={draftProvider}
                pillRef={registerPillRef("provider")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "provider" ? null : "provider";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
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
            </>
          }
          dropdownLayer={
            <>
              {openFilter === "status" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[180px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={[...PRODUCT_STATUS_FILTER]}
                    onSelect={(opt) => {
                      setDraftStatus(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "provider" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={providerFilterOptions}
                    onSelect={(opt) => {
                      setDraftProvider(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "commission" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="min-w-[200px] max-w-[min(92vw,320px)]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={COMMISSION_TYPE_FILTER}
                    onSelect={(opt) => {
                      setDraftCommission(opt);
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
                setAppliedProductStatus(draftStatus === "All statuses" ? null : draftStatus);
                setAppliedSwitchProvider(draftProvider === "All providers" ? null : draftProvider);
                setAppliedCommissionType(draftCommission === "All types" ? null : draftCommission);
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedProductStatus(null);
                setAppliedSwitchProvider(null);
                setAppliedCommissionType(null);
                setDraftStatus("All statuses");
                setDraftProvider("All providers");
                setDraftCommission("All types");
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <AuditTrailToolbar
          className="mt-4"
          tableSearch={search}
          onTableSearchChange={setSearch}
          onFilterClick={() => {
            setSearch("");
            setFilterMode(true);
          }}
        />
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

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
            {loading ? (
              <TableSkeletonRows columns={8} rows={8} cellVariants={["text-wide", "text", "text", "text", "text", "text", "badge", "icon"]} />
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No products.
                </td>
              </tr>
            ) : (
              products.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/dashboard/product-mgt/${row.id}`)}
                  className="cursor-pointer transition-colors hover:bg-surface-subtle"
                >
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle font-medium text-primary-text">
                    {row.productName}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                    {row.productCategory}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                    {row.commissionType}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                    {row.commissionRate}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">{row.cap}</td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle" onClick={(e) => e.stopPropagation()}>
                    <ProviderDropdown
                      productSlug={row.id}
                      productCategory={row.productCategory}
                      value={getProvider(row)}
                      onChange={(v) => handleProviderSwitch(row, v)}
                    />
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle" onClick={(e) => e.stopPropagation()}>
                    <StatusToggle
                      checked={getStatus(row) === "Active"}
                      onChange={(v) => handleStatusToggleRequest(row, v)}
                    />
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="text-zinc-400 transition-colors hover:text-zinc-600"
                      aria-label="Edit"
                    >
                      <Edit size={18} variant="Outline" color="currentColor" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AuditTrailPagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {/* Confirmation Modal */}
      {pendingToggle && (
        <ConfirmModal
          variant={pendingToggle.nextActive ? "approve" : "danger"}
          title={pendingToggle.nextActive ? "Activate Product" : "Deactivate Product"}
          message={`Are you sure you want to ${pendingToggle.nextActive ? "activate" : "deactivate"} this product?`}
          confirmLabel={pendingToggle.nextActive ? "Activate" : "Deactivate"}
          cancelLabel="Cancel"
          onConfirm={handleStatusToggleConfirm}
          onCancel={() => setPendingToggle(null)}
        />
      )}

      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          message={showSuccess.message}
          onContinue={() => setShowSuccess(null)}
        />
      )}
    </>
  );
}
