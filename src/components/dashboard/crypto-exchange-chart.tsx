"use client";

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

const DATA = [
  { coin: "ETH",  value: 65000 },
  { coin: "BTC",  value: 85000 },
  { coin: "DOGE", value: 12000 },
  { coin: "USDT", value: 80000 },
  { coin: "BNB",  value: 25000 },
  { coin: "SOL",  value: 60000 },
  { coin: "YEN",  value: 15000 },
];

function yTickFormatter(v: number) {
  if (v === 0) return "0";
  return `${v / 1000}k`;
}

function CustomTooltip({ active, payload, label }: any) {
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

export function CryptoExchangeChart() {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline bg-white p-5 w-full min-w-0">
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

      {/* Chart */}
      <div className="flex-1 min-h-55 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={DATA}
            barCategoryGap="35%"
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBEE" vertical={false} />
            <XAxis
              dataKey="coin"
              tick={{ fontSize: 11, fill: "#9E9E9E" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yTickFormatter}
              tick={{ fontSize: 11, fill: "#9E9E9E" }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 20000, 40000, 60000, 80000, 100000]}
              domain={[0, 100000]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(188,235,15,0.08)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {DATA.map((entry, i) => (
                <Cell key={i} fill="#BCEB0F" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
