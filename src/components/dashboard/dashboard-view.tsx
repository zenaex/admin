"use client";

import React, { useState } from "react";
import { DocumentText, Document } from "iconsax-react";
import type { DateRange } from "react-day-picker";
import {
  ArrowUp,
  InfoCircle,
  People,
  Profile2User,
  RefreshCircle,
  ChartSquare,
  ProfileAdd,
} from "iconsax-react";
import { ListFilter, TrendingUp } from "lucide-react";
import { ProviderHeader } from "@/components/provider/provider-header";
import { TransactionTrendChart } from "@/components/dashboard/transaction-trend-chart";
import { ProductCategoryChart } from "@/components/dashboard/product-category-chart";
import { CryptoExchangeChart } from "@/components/dashboard/crypto-exchange-chart";
import { TopCustomers } from "@/components/dashboard/top-customers";
import { DashboardStatsSection } from "@/components/dashboard/dashboard-stats-section";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";

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
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        variant === "up" ? "text-green-600" : "text-red-500"
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
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[13px] font-semibold ${
              trendVariant === "up" ? "bg-green-100/50 text-green-600" : "bg-red-100/50 text-red-600"
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

/* ── Main Dashboard View ── */
export function DashboardView() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 6),
    to: new Date(2024, 0, 6),
  });
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div>
      {/* Header */}
      <ProviderHeader title="Dashboard" />

      {/* Greeting + toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white px-[30px] pt-[18px] pb-4 w-full">
        <div>
          <h2 className="text-[24px] font-semibold text-primary-text">
            Good Morning, Shakur 👋
          </h2>
          <p className="mt-0.5 text-[16px]" style={{ color: "#494A53" }}>
            Here are your activities for the day
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg  bg-white text-zinc-500 transition-colors "
            aria-label="Filter"
          >
            <ListFilter size={16} strokeWidth={2} color="currentColor" />
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors"
            >
              <ExportIcon size={16} />
              Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <DocumentText size={18} variant="Outline" color="currentColor" />
                      CSV
                    </button>
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <Document size={18} variant="Outline" color="currentColor" />
                      PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
          ₦140,813,000.00
        </p>
        <p className="mt-1 text-[18px]" style={{ color: "#777F89" }}>
          Yeay! transactions have surged by{" "}
          <span className="font-semibold text-primary-text">$1,000,000</span> from Last month!
        </p>

        {/* Small stat cards row */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SmallStatCard
            label="Transaction Count"
            value="50,000"
            trend="3.7%"
            trendVariant="up"
            subtext="+1.01% within {5days}"
            accentClass="bg-primary-green"
            icon={<ChartSquare size={24} variant="Outline" color="currentColor" className="text-primary-text" />}
          />
          <SmallStatCard
            label="Active Users"
            value="50,000"
            trend="3.7%"
            trendVariant="down"
            subtext="+1.01% within {5days}"
            accentClass="bg-vivid-azure"
            icon={<ProfileAdd size={24} variant="Outline" color="currentColor" className="text-primary-text" />}
          />
          <SmallStatCard
            label="New Signups"
            value="50,000"
            trend="3.7%"
            trendVariant="up"
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
          <CryptoExchangeChart />
        </div>

        {/* Right column — donut on top, top customers below, full height */}
        <div className="col-span-1 flex flex-col gap-4">
          <ProductCategoryChart />
          <TopCustomers />
        </div>
      </div>

      {/* Payment Processed + Top Selling Giftcards + Top Utility Product */}
      <DashboardStatsSection />

    </div>
  );
}
