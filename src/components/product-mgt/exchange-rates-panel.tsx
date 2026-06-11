"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListFilter } from "lucide-react";
import { Setting2 } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { ProductMgtSubTabs } from "@/components/product-mgt/product-mgt-sub-tabs";
import { CryptoCurrencyCell } from "@/components/product-mgt/crypto-currency-cell";
import { CurrencyCell } from "@/components/product-mgt/currency-cell";
import { FiatRateUpdateFlow } from "@/components/product-mgt/fiat-rate-update-flow";
import { SellCryptoRateUpdateFlow } from "@/components/product-mgt/sell-crypto-rate-update-flow";
import { SwapCryptoRateUpdateFlow } from "@/components/product-mgt/swap-crypto-rate-update-flow";
import { SwapPairCell } from "@/components/product-mgt/swap-pair-cell";
import { ExchangeRatesSwapToolbarActions } from "@/components/product-mgt/exchange-rates-toolbar-actions";
import { EXCHANGE_RATE_SUB_TABS } from "@/components/product-mgt/exchange-rate-fixtures";
// Render the new Giftcard tab panel alongside other currency types
import { GiftcardRatesPanel } from "@/components/product-mgt/giftcard-rates-panel";
import type { ExchangeRateRow, ExchangeRateSubTab } from "@/components/product-mgt/product-mgt-types";
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
import { getExchangeRates } from "@/lib/admin-api/exchange-rates-api";
import { mergeSwapPairRows, readExtraSwapPairRows } from "@/lib/product-mgt/swap-pair-storage";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";

const TYPE_FILTER_OPTIONS = ["All types", "Flat", "Percentage", "% capped @", "—"] as const;

const FIAT_EXPORT_COLUMNS: ExportColumn<ExchangeRateRow>[] = [
  { header: "Currency", value: (r) => r.currencyCode },
  { header: "Name", value: (r) => r.currencyName },
  { header: "Type", value: (r) => r.commissionType },
  { header: "Our Commission", value: (r) => r.ourCommission },
  { header: "Base Rate", value: (r) => r.baseRate },
  { header: "Final Rate", value: (r) => r.finalRate },
  { header: "Date Updated", value: (r) => r.dateUpdated },
];

const COMPACT_EXPORT_COLUMNS: ExportColumn<ExchangeRateRow>[] = [
  { header: "Currency", value: (r) => r.currencyCode },
  { header: "Name", value: (r) => r.currencyName },
  { header: "Type", value: (r) => r.commissionType },
  { header: "Our Markup", value: (r) => r.ourCommission },
  { header: "Date Updated", value: (r) => r.dateUpdated },
];

const SELL_CRYPTO_EXPORT_COLUMNS: ExportColumn<ExchangeRateRow>[] = [
  { header: "Currency", value: (r) => r.currencyCode },
  { header: "Name", value: (r) => r.currencyName },
  { header: "Markup Type", value: (r) => r.commissionType },
  { header: "Our Markup", value: (r) => r.ourCommission },
  { header: "Date Updated", value: (r) => r.dateUpdated },
];

function displayDash(value: string) {
  return value === "—" || !value.trim() ? "—" : value;
}

function parseRatesSubTab(value: string | null): ExchangeRateSubTab | null {
  if (
    value === "fiat" ||
    value === "sell-crypto" ||
    value === "swap-crypto" ||
    value === "giftcard"
  ) {
    return value;
  }
  return null;
}

export function ExchangeRatesPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ratesSubTabFromUrl = searchParams?.get("ratesSubTab") ?? null;
  const [subTab, setSubTab] = useState<ExchangeRateSubTab>(() => parseRatesSubTab(ratesSubTabFromUrl) ?? "fiat");
  const [rows, setRows] = useState<ExchangeRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "type">(null);
  const [draftType, setDraftType] = useState<string>("All types");
  const [appliedType, setAppliedType] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<ExchangeRateRow | null>(null);

  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"type">(openFilter, filterMode);

  const sectionMeta = EXCHANGE_RATE_SUB_TABS.find((t) => t.id === subTab) ?? EXCHANGE_RATE_SUB_TABS[0];
  const isSellCrypto = subTab === "sell-crypto";
  const isSwapCrypto = subTab === "swap-crypto";
  const isCompactTable = isSellCrypto || isSwapCrypto;
  const columnCount = isCompactTable ? 5 : 7;
  const typeColumnLabel = isSellCrypto ? "Markup Type" : "Type";
  const commissionColumnLabel = isCompactTable ? "Our Markup" : "Our Commission";
  const filterTypeLabel = isSellCrypto ? "Markup Type" : "Type";

  useEffect(() => {
    const fromUrl = parseRatesSubTab(ratesSubTabFromUrl);
    if (fromUrl) setSubTab(fromUrl);
  }, [ratesSubTabFromUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExchangeRates(subTab);
      let items = res.items;
      if (subTab === "swap-crypto") {
        items = mergeSwapPairRows(items, readExtraSwapPairRows());
      }
      setRows(items);
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => {
    void load();
    setPage(1);
    setSearch("");
    setAppliedType(null);
    setDraftType("All types");
    setFilterMode(false);
  }, [subTab, load]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (appliedType && appliedType !== "All types" && r.commissionType !== appliedType) return false;
      if (!q) return true;
      const pairHaystack = r.swapPair
        ? [
            r.swapPair.baseCode,
            r.swapPair.quoteCode,
            r.swapPair.baseName,
            r.swapPair.quoteName,
          ]
            .join(" ")
            .toLowerCase()
        : "";
      return (
        r.currencyCode.toLowerCase().includes(q) ||
        r.currencyName.toLowerCase().includes(q) ||
        pairHaystack.includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search, appliedType]);

  const totalItems = filtered.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(Math.max(totalItems, 1) / pageSize)));
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const runExport = (format: "csv" | "json" | "pdf") => {
    const columns = isSellCrypto
      ? SELL_CRYPTO_EXPORT_COLUMNS
      : isSwapCrypto
        ? COMPACT_EXPORT_COLUMNS
        : FIAT_EXPORT_COLUMNS;
    exportClientTable(`exchange-rates-${subTab}`, format, filtered, columns);
  };

  return (
    <>
      <div className="mt-6">
        <ProductMgtSubTabs
          tabs={EXCHANGE_RATE_SUB_TABS.map((t) => ({ id: t.id, label: t.label }))}
          active={subTab}
          onChange={(id) => setSubTab(id as ExchangeRateSubTab)}
        />
      </div>

      {subTab === "giftcard" ? (
        <GiftcardRatesPanel />
      ) : (
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
                <TableFilterPill
                  label={filterTypeLabel}
                  summary={draftType}
                  pillRef={registerPillRef("type")}
                  onClick={() =>
                    setOpenFilter((v) => {
                      const next = v === "type" ? null : "type";
                      syncDropdownLeft(next);
                      return next;
                    })
                  }
                />
              }
              dropdownLayer={
                openFilter === "type" ? (
                  <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                    <TableFilterPanelTitle />
                    <TableFilterOptionsList
                      options={[...TYPE_FILTER_OPTIONS]}
                      onSelect={(opt) => {
                        setDraftType(opt);
                        setOpenFilter(null);
                      }}
                    />
                  </TableFilterDropdownCard>
                ) : null
              }
              actions={
                <TableFilterApplyClear
                  onApply={() => {
                    setAppliedType(draftType === "All types" ? null : draftType);
                    setOpenFilter(null);
                    setPage(1);
                  }}
                  onClear={() => {
                    setSearch("");
                    setAppliedType(null);
                    setDraftType("All types");
                    setOpenFilter(null);
                    setFilterMode(false);
                    setPage(1);
                  }}
                />
              }
            />
          ) : (
            <div className="mt-4 flex h-14 flex-wrap items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
              <span className="shrink-0 text-[15px] font-semibold text-primary-text">
                {sectionMeta.sectionTitle} ({totalItems.toLocaleString()})
              </span>
              <div className="ml-0 w-full min-w-[200px] max-w-[320px] sm:ml-4 sm:w-[280px]">
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
                  onClick={() => setFilterMode(true)}
                >
                  <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
                </button>
                <TableExportMenu
                  disabled={loading || filtered.length === 0}
                  onExportCsv={() => runExport("csv")}
                  onExportPdf={() => runExport("pdf")}
                  onExportJson={() => runExport("json")}
                />
                {isSwapCrypto && (
                  <ExchangeRatesSwapToolbarActions
                    onCreatePair={() => router.push("/dashboard/product-mgt/swap-pair/create")}
                    onAddRateSheet={() => undefined}
                  />
                )}
              </div>
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-[8px]">
            <table className="w-full border-collapse bg-white text-left text-sm">
              <thead>
                <tr className="bg-outline text-xs text-zinc-400">
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Currency</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">{typeColumnLabel}</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                    {commissionColumnLabel}
                  </th>
                  {!isCompactTable && (
                    <>
                      <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Base Rate</th>
                      <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Final Rate</th>
                    </>
                  )}
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Updated</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columnCount} className="px-4 py-8 text-center text-zinc-500">
                      Loading…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount} className="px-4 py-8 text-center text-zinc-500">
                      No rates found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-surface-subtle">
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                        {isSwapCrypto && row.swapPair ? (
                          <SwapPairCell pair={row.swapPair} />
                        ) : isSellCrypto ? (
                          <CryptoCurrencyCell
                            currencyCode={row.currencyCode}
                            currencyName={row.currencyName}
                            iconUrl={row.iconUrl}
                          />
                        ) : (
                          <CurrencyCell
                            currencyCode={row.currencyCode}
                            currencyName={row.currencyName}
                            countryCode={row.countryCode}
                          />
                        )}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {displayDash(row.commissionType)}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {displayDash(row.ourCommission)}
                      </td>
                      {!isCompactTable && (
                        <>
                          <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                            {displayDash(row.baseRate)}
                          </td>
                          <td className="h-16 border-b border-outline px-4 py-0 align-middle text-zinc-500">
                            {displayDash(row.finalRate)}
                          </td>
                        </>
                      )}
                      <td className="h-16 whitespace-nowrap border-b border-outline px-4 py-0 align-middle text-zinc-500">
                        {row.dateUpdated}
                      </td>
                      <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                        <button
                          type="button"
                          className="text-[#001928] transition-colors hover:opacity-80"
                          aria-label={`Settings for ${row.currencyCode}`}
                          onClick={() => setEditRow(row)}
                        >
                          <Setting2 size={20} variant="Outline" color="currentColor" />
                        </button>
                      </td>
                    </tr>
                  ))
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

          {isSellCrypto && (
            <SellCryptoRateUpdateFlow
              row={editRow}
              onClose={() => setEditRow(null)}
              onApplied={(updated) => {
                setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              }}
            />
          )}
          {isSwapCrypto && (
            <SwapCryptoRateUpdateFlow
              row={editRow}
              onClose={() => setEditRow(null)}
              onApplied={(updated) => {
                setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              }}
            />
          )}
          {!isSellCrypto && !isSwapCrypto && (
            <FiatRateUpdateFlow
              row={editRow}
              onClose={() => setEditRow(null)}
              onApplied={(updated) => {
                setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              }}
            />
          )}
        </>
      )}
    </>
  );
}
