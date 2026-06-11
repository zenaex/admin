"use client";

import { Fragment, useMemo, useState, useEffect, useCallback } from "react";
import { Add, ArrowDown2, Setting2 } from "iconsax-react";
import { GiftcardRateSheetUploadModal } from "@/components/product-mgt/giftcard-rate-sheet-upload-modal";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { GiftcardBrandCell } from "@/components/product-mgt/giftcard-brand-cell";
import { GiftcardRateUpdateFlow } from "@/components/product-mgt/giftcard-rate-update-flow";
import type { GiftcardBrand, GiftcardDenomination } from "@/components/product-mgt/product-mgt-types";
import { getGiftcardRates, toggleGiftcardCategoryActive } from "@/lib/admin-api/exchange-rates-api";

function StatusToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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

function displayDash(value: string) {
  return value === "—" || !value.trim() ? "—" : value;
}

export function GiftcardRatesPanel() {
  const [brands, setBrands] = useState<GiftcardBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [editBrand, setEditBrand] = useState<GiftcardBrand | null>(null);
  const [rateSheetOpen, setRateSheetOpen] = useState(false);
  const [togglingDenomId, setTogglingDenomId] = useState<string | null>(null);

  const loadGiftcardRates = async () => {
    setLoading(true);
    try {
      const res = await getGiftcardRates();
      setBrands(res ?? []);
    } catch (e) {
      console.error("Failed to load giftcard rates:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGiftcardRates();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDenomStatusToggle = useCallback(
    async (brand: GiftcardBrand, denom: GiftcardDenomination, nextActive: boolean) => {
      setTogglingDenomId(denom.id);
      const prevStatus = denom.status;
      setBrands((prev) =>
        prev.map((b) =>
          b.id === brand.id
            ? {
                ...b,
                denominations: b.denominations.map((d) =>
                  d.id === denom.id ? { ...d, status: nextActive ? "Active" : "Inactive" } : d,
                ),
              }
            : b,
        ),
      );
      try {
        await toggleGiftcardCategoryActive(brand, denom, nextActive);
      } catch (e) {
        console.error("Failed to toggle giftcard category:", e);
        setBrands((prev) =>
          prev.map((b) =>
            b.id === brand.id
              ? {
                  ...b,
                  denominations: b.denominations.map((d) =>
                    d.id === denom.id ? { ...d, status: prevStatus } : d,
                  ),
                }
              : b,
          ),
        );
        alert(e instanceof Error ? e.message : "Failed to update category status");
      } finally {
        setTogglingDenomId(null);
      }
    },
    [],
  );

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.brandName.toLowerCase().includes(q) ||
        b.brandType.toLowerCase().includes(q) ||
        b.country.toLowerCase().includes(q) ||
        b.denominations.some(
          (d) =>
            d.label.toLowerCase().includes(q) || (d.category || "").toLowerCase().includes(q),
        ),
    );
  }, [brands, search]);

  const totalItems = filteredBrands.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const paginatedBrands = useMemo(
    () => filteredBrands.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredBrands, safePage, pageSize],
  );

  return (
    <>
      <div className="mt-4 flex h-14 flex-wrap items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <span className="shrink-0 text-[15px] font-semibold text-primary-text">
          Giftcard Rate ({totalItems.toLocaleString()})
        </span>
        <div className="ml-0 w-full min-w-[200px] max-w-[320px] sm:ml-4 sm:w-[280px]">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setRateSheetOpen(true)}
          className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-3 text-xs font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          <Add size={16} variant="Outline" color="currentColor" />
          Add Rate Sheet
        </button>
      </div>

      <GiftcardRateSheetUploadModal
        open={rateSheetOpen}
        onClose={() => setRateSheetOpen(false)}
        onSuccess={() => void loadGiftcardRates()}
      />

      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Currency</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Type</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Our Commission</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">RMB Rate</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : paginatedBrands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No giftcard rates found.
                </td>
              </tr>
            ) : (
              paginatedBrands.map((brand) => {
                const isExpanded = expandedBrands.has(brand.id);
                const hasSubProducts = brand.denominations.length > 0;
                return (
                  <Fragment key={brand.id}>
                    <tr className="transition-colors hover:bg-surface-subtle">
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(brand.id)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                            aria-expanded={isExpanded}
                          >
                            <ArrowDown2
                              size={16}
                              variant="Outline"
                              color="currentColor"
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : "rotate-0"
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            className="min-w-0 text-left"
                            onClick={() => toggleExpand(brand.id)}
                          >
                            <GiftcardBrandCell
                              brandName={brand.brandName}
                              brandType={brand.brandType}
                              country={brand.country}
                              currency={brand.currency}
                              cardType={brand.cardType}
                              iconUrl={brand.iconUrl}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {displayDash(brand.commissionType)}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {displayDash(brand.ourCommission)}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {displayDash(brand.rmbRate)}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                        <button
                          type="button"
                          className="text-[#001928] transition-colors hover:opacity-80"
                          onClick={() => setEditBrand(brand)}
                          aria-label={`Settings for ${brand.brandName}`}
                        >
                          <Setting2 size={20} variant="Outline" color="currentColor" />
                        </button>
                      </td>
                    </tr>

                    {isExpanded && hasSubProducts ? (
                      <tr>
                        <td colSpan={5} className="border-b border-outline p-0">
                          <table className="w-full border-collapse text-left text-sm">
                            <thead>
                              <tr className="bg-outline text-xs text-zinc-400">
                                <th className="h-10 border-b border-zinc-200 py-0 pl-14 pr-4 font-medium align-middle">
                                  Currency
                                </th>
                                <th className="h-10 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                                  Vendor Rate
                                </th>
                                <th className="h-10 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                                  Final Rate
                                </th>
                                <th className="h-10 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                                  Date Updated
                                </th>
                                <th className="h-10 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {brand.denominations.map((denom) => (
                                <tr
                                  key={denom.id}
                                  className="bg-white transition-colors hover:bg-surface-subtle"
                                >
                                  <td className="h-14 border-b border-outline py-0 pl-14 pr-4 align-middle">
                                    <span className="text-sm font-semibold text-primary-text">
                                      {denom.label || denom.category || "—"}
                                    </span>
                                  </td>
                                  <td className="h-14 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                                    {displayDash(denom.vendorRate)}
                                  </td>
                                  <td className="h-14 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                                    {displayDash(denom.finalRate)}
                                  </td>
                                  <td className="h-14 whitespace-nowrap border-b border-outline px-4 py-0 align-middle text-xs text-zinc-500">
                                    {denom.dateUpdated}
                                  </td>
                                  <td className="h-14 border-b border-outline px-4 py-0 align-middle">
                                    <StatusToggle
                                      checked={denom.status === "Active"}
                                      disabled={togglingDenomId === denom.id}
                                      onChange={(next) =>
                                        void handleDenomStatusToggle(brand, denom, next)
                                      }
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null}

                    {isExpanded && !hasSubProducts ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="h-14 border-b border-outline bg-white py-0 pl-14 pr-4 align-middle text-sm text-zinc-400"
                        >
                          No sub-products available.
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
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

      <GiftcardRateUpdateFlow
        brand={editBrand}
        brands={brands}
        onClose={() => setEditBrand(null)}
        onApplied={(updated) => {
          setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        }}
      />
    </>
  );
}
