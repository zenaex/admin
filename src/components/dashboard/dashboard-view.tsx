"use client";

import React, { useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  ArrowUp,
  Import,
  InfoCircle,
  People,
  Profile2User,
  Sort,
  RefreshCircle,
  ChartSquare,
  ProfileAdd,
} from "iconsax-react";
import { ProviderHeader } from "@/components/provider/provider-header";
import { TransactionTrendChart } from "@/components/dashboard/transaction-trend-chart";
import { ProductCategoryChart } from "@/components/dashboard/product-category-chart";
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
      <ArrowUp
        size={12}
        variant="Bold"
        color="currentColor"
        className={variant === "down" ? "rotate-180" : ""}
      />
      {value}
    </span>
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
    <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-[8px] border border-outline bg-white px-5 py-4">
      <div className={`absolute bottom-0 left-0 top-0 w-[5px] ${accentClass}`} />
      <div className="flex items-start justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-subtle text-zinc-400">
          {icon}
        </span>
      </div>
      <div className="flex items-end gap-3">
        <p className="text-[22px] font-bold leading-none text-primary-text">{value}</p>
        <Trend value={trend} variant={trendVariant} />
      </div>
      <p className="flex items-center gap-1 text-[11px] text-zinc-400">
        <InfoCircle size={12} variant="Outline" color="currentColor" />
        {subtext}
      </p>
    </div>
  );
}

/* ── Main Dashboard View ── */
export function DashboardView() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 6),
    to: new Date(2024, 0, 6),
  });

  return (
    <div>
      {/* Header */}
      <ProviderHeader title="Dashboard" />

      {/* Greeting + toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline bg-white px-5 py-4 w-full">
        <div>
          <h2 className="text-[16px] font-semibold text-primary-text">
            Good Morning, Shakur 👋
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">Here are your activities for the day</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg  bg-white text-zinc-500 transition-colors "
            aria-label="Filter"
          >
            <Sort size={16} variant="Outline" color="currentColor" />
          </button>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors "
          >
            <Import size={16} variant="Outline" color="currentColor" />
            Export
          </button>
        </div>
      </div>

      {/* Total transaction hero card */}
      <div className="mt-4 rounded-xl border border-outline bg-white px-5 py-5 w-full">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-primary-text m-0">
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
        <p className="mt-1 text-[18px] text-zinc-400">
          Yeay! transactions have surged by{" "}
          <span className="font-semibold text-primary-text">$1,000,000</span> from Last month!
        </p>

        {/* Small stat cards row */}
        <div className="mt-4 flex gap-3">
          <div className="flex-1">
            <div className="relative h-[176px] flex flex-col justify-between rounded-[8px] border border-outline bg-white overflow-hidden">
              <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-primary-green" />
              {/* Main content */}
              <div className="flex-1 flex flex-col gap-3 px-5 pt-4 pb-0 bg-background">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-body">Transaction Count</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-subtle text-zinc-400">
                    <ChartSquare size={24} variant="Outline" color="currentColor" className="text-primary-text" />
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-[30px] font-semibold leading-none text-text-heading">50,000</p>
                  <Trend value="3.7%" variant="up" />
                </div>
              </div>
              {/* Bottom subtext bar */}
              <div className="h-[40px] px-5 flex items-center border-t border-outline bg-white">
                <p className="flex items-center gap-1 text-[11px] text-zinc-400 m-0">
                  <InfoCircle size={12} variant="Outline" color="currentColor" />
                  +1.01% within {`{5days}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative h-[176px] flex flex-col justify-between rounded-[8px] border border-outline bg-background overflow-hidden">
              <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-vivid-azure" />
              <div className="flex-1 flex flex-col gap-3 px-5 pt-4 pb-0">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-body">Active Users</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-subtle text-zinc-400">
                    <ProfileAdd size={24} variant="Outline" color="currentColor" className="text-primary-text" />
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-[30px] font-semibold leading-none text-text-heading">50,000</p>
                  <Trend value="3.7%" variant="down" />
                </div>
              </div>
              <div className="h-[40px] px-5 flex items-center border-t border-outline bg-white">
                <p className="flex items-center gap-1 text-[11px] text-zinc-400 m-0">
                  <InfoCircle size={12} variant="Outline" color="currentColor" />
                  +1.01% within {`{5days}`}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1">
              <div className="relative h-[176px] flex flex-col justify-between rounded-[8px] border border-outline bg-background overflow-hidden">
              <div className="absolute bottom-0 left-0 top-0 w-[5px] bg-coral-red" />
              <div className="flex-1 flex flex-col gap-3 px-5 pt-4 pb-0">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-body">New Signups</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-subtle text-zinc-400">
                    <ProfileAdd size={24} variant="Outline" color="currentColor" className="text-primary-text" />
                  </span>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-[30px] font-semibold leading-none text-text-heading">50,000</p>
                  <Trend value="3.7%" variant="up" />
                </div>
              </div>
              <div className="h-[40px] px-5 flex items-center border-t border-outline bg-white">
                <p className="flex items-center gap-1 text-[11px] text-zinc-400 m-0">
                  <InfoCircle size={12} variant="Outline" color="currentColor" />
                  +1.01% within {`{5days}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row — 3/4 + 1/4 split */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <TransactionTrendChart />
        </div>
        <div className="col-span-1">
          <ProductCategoryChart />
        </div>
      </div>

    </div>
  );
}
