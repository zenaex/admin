"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown2, Edit } from "iconsax-react";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { ProductMgtSubTabs } from "@/components/product-mgt/product-mgt-sub-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import {
  ALL_PRODUCTS,
  COMMISSION_TYPE_FILTER,
  PRODUCT_STATUS_FILTER,
  PRODUCT_TABS,
  PRODUCT_PROVIDERS,
  PROVIDER_FILTER_OPTIONS,
  TAB_CATEGORY_MAP,
} from "@/components/product-mgt/product-fixtures";
import type { ProductRow, ProductStatus, ProductTab } from "@/components/product-mgt/product-mgt-types";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";

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
        <ArrowDown2
          size={12}
          variant="Outline"
          color="currentColor"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          {PRODUCT_PROVIDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-surface-subtle ${
                value === p ? "font-semibold text-primary-text" : "text-zinc-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProductsPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductTab>("All");
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
  const [statuses, setStatuses] = useState<Record<string, ProductStatus>>({});
  const [providers, setProviders] = useState<Record<string, string>>({});

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

  const filteredProducts = useMemo(() => {
    const category = TAB_CATEGORY_MAP[activeTab];
    const q = search.trim().toLowerCase();
    return ALL_PRODUCTS.filter((p) => {
      if (category && p.productCategory !== category) return false;
      const st = statuses[p.id] ?? p.status;
      const prov = providers[p.id] ?? p.switchProvider;
      if (appliedProductStatus && appliedProductStatus !== "All statuses" && st !== appliedProductStatus)
        return false;
      if (appliedSwitchProvider && appliedSwitchProvider !== "All providers" && prov !== appliedSwitchProvider)
        return false;
      if (
        appliedCommissionType &&
        appliedCommissionType !== "All types" &&
        p.commissionType !== appliedCommissionType
      )
        return false;
      if (q)
        return (
          p.productName.toLowerCase().includes(q) ||
          p.productCategory.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      return true;
    });
  }, [
    activeTab,
    search,
    statuses,
    providers,
    appliedProductStatus,
    appliedSwitchProvider,
    appliedCommissionType,
  ]);

  const totalItems = filteredProducts.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalItems / pageSize)));
  const paginatedRows = useMemo(
    () => filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredProducts, safePage, pageSize],
  );

  const getStatus = (row: ProductRow) => statuses[row.id] ?? row.status;
  const getProvider = (row: ProductRow) => providers[row.id] ?? row.switchProvider;

  return (
    <>
      <div className="mt-6">
        <ProductMgtSubTabs
          tabs={PRODUCT_TABS.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => {
            setActiveTab(id as ProductTab);
            setPage(1);
          }}
        />
      </div>

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
                    options={PROVIDER_FILTER_OPTIONS}
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
                  <button
                    type="button"
                    className="text-zinc-400 transition-colors hover:text-zinc-600"
                    aria-label="Edit"
                  >
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
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </>
  );
}
