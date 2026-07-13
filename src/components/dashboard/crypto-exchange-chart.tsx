"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ExportSquare } from "iconsax-react";
import { getAdminDashboardCrypto, type NormalizedCryptoVolume } from "@/lib/admin-api/dashboard-api";

function yTickFormatter(v: number) {
  if (v === 0) return "0";
  return `${v / 1000}k`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-outline bg-white px-4 py-2 shadow-lg text-center">
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className="text-base font-bold text-primary-text">
        {payload[0]?.value?.toLocaleString()}
      </p>
    </div>
  );
}

export function CryptoExchangeChart({ dateRange }: { dateRange?: DateRange }) {
  const [data, setData] = useState<NormalizedCryptoVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateRange) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const fromStr = dateRange.from ? dateRange.from.toISOString() : undefined;
        const toStr = dateRange.to ? dateRange.to.toISOString() : undefined;
        const res = await getAdminDashboardCrypto(fromStr, toStr);
        if (active) {
          setData(res);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load crypto data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [dateRange]);

  const maxVal = data.length > 0 ? Math.max(...data.map((d) => d.value), 100) : 100;
  const domainMax = Math.ceil(maxVal / 20000) * 20000 || 100000;
  const ticks = Array.from({ length: 6 }, (_, i) => Math.round((domainMax / 5) * i));

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl bg-white p-5 w-full min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-semibold text-primary-text leading-tight">
            Crypto Exchange &amp; Transfers
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-400">FX Conversion</p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium underline text-primary-text transition-colors"
        >
          Explore data
          <ExportSquare size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Chart / Loading states */}
      <div className="flex-1 min-h-55 w-full">
        {loading ? (
          <div className="flex h-55 w-full items-center justify-center">
            <p className="text-sm text-zinc-400">Loading crypto volumes...</p>
          </div>
        ) : error ? (
          <div className="flex h-55 w-full items-center justify-center text-center px-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-55 w-full items-center justify-center text-center">
            <p className="text-sm text-zinc-400">No crypto volume data.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barCategoryGap="35%"
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EBEE" vertical={false} />
              <XAxis
                dataKey="coin"
                tick={{ fontSize: 11, fill: "#0A0A0A" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={yTickFormatter}
                tick={{ fontSize: 11, fill: "#0A0A0A" }}
                axisLine={false}
                tickLine={false}
                ticks={ticks}
                domain={[0, domainMax]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(188,235,15,0.08)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill="#BCEB0F" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
