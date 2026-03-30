"use client";

import React, { useState } from "react";
import {
  ArrowDown2,
  ArrowUp,
  Calendar,
  Chart,
  Import,
  InfoCircle,
  People,
  Profile2User,
  Sort,
} from "iconsax-react";
import { ProviderHeader } from "@/components/provider/provider-header";
import { TransactionTrendChart } from "@/components/dashboard/transaction-trend-chart";
import { ProductCategoryChart } from "@/components/dashboard/product-category-chart";

/* ── Date range picker (static display) ── */
function DateRangePicker() {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-sm font-medium text-primary-text transition-colors hover:bg-surface-subtle"
    >
      <Calendar size={16} variant="Outline" color="currentColor" />
      Jan 6, 2024 – Jan 6, 2024
      <ArrowDown2 size={14} variant="Outline" color="currentColor" />
    </button>
  );
}

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
  accentColor: string;
  icon: React.ReactNode;
};

function SmallStatCard({
  label,
  value,
  trend,
  trendVariant,
  subtext,
  accentColor,
  icon,
}: SmallCardProps) {
  return (
    <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-outline bg-white px-5 py-4">
      <div
        className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full"
        style={{ backgroundColor: accentColor }}
      />
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
  return (
    <div>
      {/* Header */}
      <ProviderHeader title="Dashboard" />

      {/* Greeting + toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline bg-white px-5 py-4">
        <div>
          <h2 className="text-[16px] font-semibold text-primary-text">
            Good Morning, Shakur 👋
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">Here are your activities for the day</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-white text-zinc-500 transition-colors hover:bg-surface-subtle"
            aria-label="Filter"
          >
            <Sort size={16} variant="Outline" color="currentColor" />
          </button>
          <DateRangePicker />
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
          >
            <Import size={16} variant="Outline" color="currentColor" />
            Export
          </button>
        </div>
      </div>

      {/* Total transaction hero card */}
      <div className="mt-4 rounded-xl border border-outline bg-white px-5 py-5">
        <p className="text-sm font-medium text-primary-text">
          Total Transaction{" "}
          <span className="font-semibold text-primary-green">in NGN</span>
          <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[10px] text-zinc-400 cursor-default" title="Nigerian Naira">ⓘ</span>
        </p>
        <p className="mt-2 text-[32px] font-bold tracking-tight text-primary-text">
          ₦140,813,000.00
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Yeay! transactions have surged by{" "}
          <span className="font-semibold text-primary-text">$1,000,000</span> from Last month!
        </p>

        {/* Small stat cards row */}
        <div className="mt-4 flex gap-3">
          <SmallStatCard
            label="Transaction Count"
            value="50,000"
            trend="3.7%"
            trendVariant="up"
            subtext="+1.01% within {5days}"
            accentColor="var(--color-primary-green)"
            icon={<Chart size={18} variant="Outline" color="currentColor" />}
          />
          <SmallStatCard
            label="Active Users"
            value="50,000"
            trend="3.7%"
            trendVariant="down"
            subtext="+1.01% within {5days}"
            accentColor="var(--color-vivid-azure)"
            icon={<People size={18} variant="Outline" color="currentColor" />}
          />
          <SmallStatCard
            label="New Signups"
            value="50,000"
            trend="3.7%"
            trendVariant="up"
            subtext="+1.01% within {5days}"
            accentColor="var(--color-coral-red)"
            icon={<Profile2User size={18} variant="Outline" color="currentColor" />}
          />
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
