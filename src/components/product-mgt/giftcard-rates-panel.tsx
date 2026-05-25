"use client";
// Renders the Giftcard Rate subtab interface with expandable hierarchical brands table

import { Fragment, useMemo, useState } from "react";
import { Add, ArrowDown2, Setting2 } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { GiftcardBrandCell } from "@/components/product-mgt/giftcard-brand-cell";
import { GiftcardRateUpdateFlow } from "@/components/product-mgt/giftcard-rate-update-flow";
import { getGiftcardBrands } from "@/components/product-mgt/exchange-rate-fixtures";
import type { GiftcardBrand } from "@/components/product-mgt/product-mgt-types";

export function GiftcardRatesPanel() {
  const [brands, setBrands] = useState<GiftcardBrand[]>(() => getGiftcardBrands());
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(
    () => new Set(["gc-apple-ecode"]) // Expand Apple E-code by default for a gorgeous visual layout
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [editBrand, setEditBrand] = useState<GiftcardBrand | null>(null);

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

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.brandName.toLowerCase().includes(q) ||
        b.brandType.toLowerCase().includes(q) ||
        b.country.toLowerCase().includes(q)
    );
  }, [brands, search]);

  const totalItems = filteredBrands.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const paginatedBrands = useMemo(
    () => filteredBrands.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredBrands, safePage, pageSize]
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mt-4 flex h-14 flex-wrap items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <span className="shrink-0 text-[15px] font-semibold text-primary-text">
          Giftcard Brands ({totalItems.toLocaleString()})
        </span>
        <div className="ml-0 w-full min-w-[200px] max-w-[320px] sm:ml-4 sm:w-[280px]">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by brand name or type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-3 text-xs font-semibold text-primary-text transition-opacity hover:opacity-90"
            onClick={() => setEditBrand(brands[0])}
          >
            <Add size={16} variant="Outline" color="currentColor" />
            Add Rate Sheet
          </button>
        </div>
      </div>

      {/* Expandable Table */}
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
            {paginatedBrands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No giftcard brands found.
                </td>
              </tr>
            ) : (
              paginatedBrands.map((brand) => {
                const isExpanded = expandedBrands.has(brand.id);
                return (
                  <Fragment key={brand.id}>
                    {/* Parent row */}
                    <tr className="group transition-colors hover:bg-surface-subtle">
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle font-medium text-primary-text">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(brand.id)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            <ArrowDown2
                              size={16}
                              variant="Outline"
                              color="currentColor"
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-0" : "-rotate-90"
                              }`}
                            />
                          </button>
                          <div
                            className="cursor-pointer"
                            onClick={() => toggleExpand(brand.id)}
                          >
                            <GiftcardBrandCell
                              brandName={brand.brandName}
                              brandType={brand.brandType}
                              country={brand.country}
                              iconUrl={brand.iconUrl}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {brand.commissionType}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {brand.ourCommission}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {brand.rmbRate}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                        <span className="text-zinc-300">
                          <Setting2 size={20} variant="Outline" color="currentColor" />
                        </span>
                      </td>
                    </tr>

                    {/* Denominations (Children rows) */}
                    {isExpanded &&
                      brand.denominations.map((denom) => (
                        <tr
                          key={denom.id}
                          className="bg-zinc-50/60 transition-colors hover:bg-zinc-100/50"
                        >
                          <td className="h-14 border-b border-outline pl-14 pr-4 py-0 align-middle">
                            <span className="text-xs font-semibold text-zinc-500">
                              {denom.label}
                            </span>
                          </td>
                          <td className="h-14 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                            {denom.vendorRate}
                          </td>
                          <td className="h-14 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                            {denom.finalRate}
                          </td>
                          <td className="h-14 border-b border-outline px-4 py-0 align-middle text-zinc-400 text-xs">
                            {denom.dateUpdated}
                          </td>
                          <td className="h-14 border-b border-outline px-4 py-0 align-middle">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                denom.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                  : "bg-zinc-50 text-zinc-600 ring-zinc-500/10"
                              }`}
                            >
                              {denom.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
