"use client";

import React, { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  ArrowUp,
  InfoCircle,
  People,
  ProfileTick,
  RefreshCircle,
  ChartSquare,
  ProfileAdd,
} from "iconsax-react";
import { CalendarDays, ListFilter, TrendingUp } from "lucide-react";
import { ProviderHeader } from "@/components/provider/provider-header";
import { getAdminDashboardKpis, type NormalizedDashboardKpis, type NormalizedDashboardExtras } from "@/lib/admin-api/dashboard-api";
import {
  TableFilterApplyClear,
  TableFilterDatePanel,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
} from "@/components/ui/table-filter-bar";
import { formatDateRangeLabel as formatDashboardDateLabel, normalizeDateRange } from "@/lib/filters/date-range";
import { useFilterBar } from "@/lib/filters/use-filter-bar";
import { TransactionTrendChart } from "@/components/dashboard/transaction-trend-chart";
import { ProductCategoryChart } from "@/components/dashboard/product-category-chart";
import { CryptoExchangeChart } from "@/components/dashboard/crypto-exchange-chart";
import { TopCustomers } from "@/components/dashboard/top-customers";
import { DashboardStatsSection } from "@/components/dashboard/dashboard-stats-section";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";

/* ── Trend badge ── */
function Trend({
  value,
  variant = "up",
}: {
  value: string;
  variant?: "up" | "down";
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${variant === "up" ? "text-green-600" : "text-red-500"
        }`}
    >
      <TrendingUp
        size={19}
        color="currentColor"
      />
      {value}
    </span>
  );
}

function ExportIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-square-arrow-out-up-right ${className}`}
    >
      <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
      <path d="m21 3-9 9" />
      <path d="M15 3h6v6" />
    </svg>
  );
}

/* ── Small stat card (Transaction Count, Active Users, New Signups) ── */
type SmallCardProps = {
  label: string;
  value: string;
  trend: string;
  trendVariant: "up" | "down";
  subtext: string;
  accentClass: string;
  icon: React.ReactNode;
};

function SmallStatCard({
  label,
  value,
  trend,
  trendVariant,
  subtext,
  accentClass,
  icon,
}: SmallCardProps) {
  return (
    <div className="relative w-full h-[176px] flex flex-col justify-between overflow-hidden rounded-[8px] bg-white">
      <div className={`absolute bottom-0 left-0 top-0 w-[8px] ${accentClass}`} />

      {/* Top Section */}
      <div className="h-[136px] flex flex-col justify-center px-[24px] bg-[#F7F7F7]">
        <div className="flex items-start justify-between">
          <span className="text-[18px] font-medium text-zinc-400">{label}</span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F7F7] text-primary-text">
            {icon}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[36px] font-bold leading-none text-primary-text">{value}</p>
          <div
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[13px] font-semibold ${trendVariant === "up" ? "bg-green-100/50 text-green-600" : "bg-red-100/50 text-red-600"
              }`}
          >
            {trendVariant === "up" ? (
              <TrendingUp size={16} strokeWidth={2.5} />
            ) : (
              <TrendingUp size={16} strokeWidth={2.5} className="rotate-180" />
            )}
            {trend}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="h-[40px] px-[24px] flex items-center bg-white">
        <p className="flex items-center gap-[10px] text-[14px] text-[#667085] m-0">
          <InfoCircle size={22} variant="Outline" color="currentColor" />
          {subtext}
        </p>
      </div>
    </div>
  );
}

function DashboardGreetingToolbar({
  dateRange,
  onDateRangeChange,
}: {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}) {
  const runDashboardExport = (format: "csv" | "json" | "pdf") => {
    const label = formatDashboardDateLabel(dateRange, "All time");
    const rows = [
      { metric: "Total Transaction (NGN)", value: "₦140,813,000.00", period: label },
      { metric: "Transaction Count", value: "50,000", period: label },
      { metric: "Active Users", value: "12,400", period: label },
    ];
    const columns: ExportColumn<(typeof rows)[number]>[] = [
      { header: "Metric", value: (r) => r.metric },
      { header: "Value", value: (r) => r.value },
      { header: "Period", value: (r) => r.period },
    ];
    exportClientTable("dashboard-summary", format, rows, columns);
  };

  const {
    filterMode,
    openFilter,
    setOpenFilter,
    toggleFilter,
    openFilterBar,
    closeFilterBar,
    filterBarRef,
    filterScrollRef,
    dropdownLeft,
    registerPillRef,
    syncDropdownLeft,
  } = useFilterBar<"period" | "currency">();

  const [draftCurrency, setDraftCurrency] = useState("NGN (default)");
  const [draftPeriod, setDraftPeriod] = useState<DateRange | undefined>(dateRange);
  const [appliedCurrency, setAppliedCurrency] = useState("NGN (default)");

  useEffect(() => {
    setDraftPeriod(dateRange);
  }, [dateRange]);

  const syncAllFilters = () => {
    setDraftPeriod(dateRange);
    setDraftCurrency(appliedCurrency);
  };

  return (
    <>
      <div className="mt-6 flex w-full flex-wrap items-center justify-between gap-4 rounded-xl bg-white px-[30px] pb-4 pt-[18px]">
        <div>
          <h2 className="text-[24px] font-semibold text-primary-text">Good Morning, Shakur 👋</h2>
          <p className="mt-0.5 text-[16px]" style={{ color: "#494A53" }}>
            Here are your activities for the day
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!filterMode ? (
            <>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-500 transition-colors"
                aria-label="Filter"
                onClick={() => openFilterBar(syncAllFilters)}
              >
                <ListFilter size={16} strokeWidth={2} color="currentColor" />
              </button>
              <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
            </>
          ) : null}
          <TableExportMenu
            onExportCsv={() => runDashboardExport("csv")}
            onExportPdf={() => runDashboardExport("pdf")}
            onExportJson={() => runDashboardExport("json")}
          />
        </div>
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
                label="Period"
                summary={formatDashboardDateLabel(draftPeriod, "All time")}
                pillRef={registerPillRef("period")}
                onClick={() => toggleFilter("period")}
              />
              <TableFilterPill
                label="Currency view"
                summary={draftCurrency}
                pillRef={registerPillRef("currency")}
                onClick={() => toggleFilter("currency")}
              />
            </>
          }
          pillsTrailing={
            <TableFilterTrailingIconButton ariaLabel="Calendar" onClick={() => toggleFilter("period")}>
              <CalendarDays size={14} />
            </TableFilterTrailingIconButton>
          }
          dropdownLayer={
            <>
              {openFilter === "period" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-auto">
                  <TableFilterDatePanel value={draftPeriod} onChange={setDraftPeriod} />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "currency" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={["NGN (default)", "USD view", "Crypto totals"]}
                    onSelect={(opt) => {
                      setDraftCurrency(opt);
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
                onDateRangeChange(normalizeDateRange(draftPeriod));
                setAppliedCurrency(draftCurrency);
                setOpenFilter(null);
              }}
              onClear={() => {
                setDraftCurrency("NGN (default)");
                setAppliedCurrency("NGN (default)");
                setDraftPeriod(undefined);
                onDateRangeChange(undefined);
                setOpenFilter(null);
                closeFilterBar();
              }}
            />
          }
        />
      ) : null}
    </>
  );
}

/* ── Main Dashboard View ── */
export function DashboardView() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    setDateRange({ from, to });
    setMounted(true);
  }, []);

  const [kpis, setKpis] = useState<NormalizedDashboardKpis | null>(null);
  const [extras, setExtras] = useState<NormalizedDashboardExtras | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted || !dateRange) return;
    let active = true;
    const load = async () => {
      setKpisLoading(true);
      setKpisError(null);
      try {
        const fromStr = dateRange.from ? dateRange.from.toISOString() : undefined;
        const toStr = dateRange.to ? dateRange.to.toISOString() : undefined;
        const res = await getAdminDashboardKpis(fromStr, toStr);
        if (active) {
          setKpis(res.kpis);
          setExtras(res.extras);
        }
      } catch (err) {
        if (active) {
          setKpisError(err instanceof Error ? err.message : "Failed to load dashboard KPIs.");
        }
      } finally {
        if (active) {
          setKpisLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [dateRange, mounted]);

  return (
    <div>
      {/* Header */}
      <ProviderHeader title="Dashboard" />

      <DashboardGreetingToolbar dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* Total transaction hero card */}
      <div className="mt-4 rounded-xl bg-white px-5 py-5 w-full">
        <div className="flex items-center gap-2">
          <p className="m-0 text-[20px] font-medium text-primary-text">
            Total Transaction{" "}
            <span className="font-semibold text-success">in NGN</span>
          </p>
          <span className="flex items-center">
            <RefreshCircle size={16.67} variant="Outline" className="text-success" color="currentColor" />
          </span>
        </div>
        <p className="mt-2 text-[40px] font-semibold text-primary-text">
          {kpisLoading ? "Loading..." : kpis?.totalTransactionVolume || "₦0.00"}
        </p>
        {!kpisLoading && kpis ? (
          <p className="mt-1 text-[18px]" style={{ color: "#777F89" }}>
            Yeay! transactions have surged by{" "}
            <span className="font-semibold text-primary-text">{kpis.totalTransactionVolumeChange}</span> from last month!
          </p>
        ) : kpisError ? (
          <p className="mt-1 text-sm text-red-500 m-0">{kpisError}</p>
        ) : (
          <p className="mt-1 text-[18px]" style={{ color: "#777F89" }}>
            Fetching stats...
          </p>
        )}

        {/* Small stat cards row */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SmallStatCard
            label="Transaction Count"
            value={kpisLoading ? "..." : kpis?.transactionCount || "0"}
            trend={kpisLoading ? "" : kpis?.transactionCountTrend || "0%"}
            trendVariant={kpis?.transactionCountTrendVariant || "up"}
            subtext="+1.01% within {5days}"
            accentClass="bg-primary-green"
            icon={<ChartSquare size={24} variant="Outline" color="currentColor" className="text-primary-text" />}
          />
          <SmallStatCard
            label="Active Users"
            value={kpisLoading ? "..." : kpis?.activeUsers || "0"}
            trend={kpisLoading ? "" : kpis?.activeUsersTrend || "0%"}
            trendVariant={kpis?.activeUsersTrendVariant || "up"}
            subtext="+1.01% within {5days}"
            accentClass="bg-vivid-azure"
            icon={<ProfileTick size={24} variant="Outline" color="currentColor" className="text-primary-text" />}
          />
          <SmallStatCard
            label="New Signups"
            value={kpisLoading ? "..." : kpis?.newSignups || "0"}
            trend={kpisLoading ? "" : kpis?.newSignupsTrend || "0%"}
            trendVariant={kpis?.newSignupsTrendVariant || "up"}
            subtext="+1.01% within {5days}"
            accentClass="bg-coral-red"
            icon={<ProfileAdd size={24} variant="Outline" color="currentColor" className="text-primary-text" />}
          />
        </div>
      </div>

      {/* Charts section — left 3/4 stacked, right 1/4 spans both rows */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        {/* Left column — two charts stacked */}
        <div className="col-span-3 flex flex-col gap-4">
          <TransactionTrendChart />
          <CryptoExchangeChart dateRange={dateRange} />
        </div>

        {/* Right column — donut on top, top customers below, full height */}
        <div className="col-span-1 flex flex-col gap-4">
          <ProductCategoryChart dateRange={dateRange} />
          <TopCustomers dateRange={dateRange} />
        </div>
      </div>

      {/* Payment Processed + Top Selling Giftcards + Top Utility Product */}
      <DashboardStatsSection dateRange={dateRange} />

    </div>
  );
}
