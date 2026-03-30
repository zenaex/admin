"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Export } from "iconsax-react";

type TimeFrame = "12 months" | "3 months" | "30 days" | "7 days" | "24 hours";

/* ── Monthly data ── */
const MONTHLY_DATA = [
  { month: "Jan", inflows: 420, outflows: 310 },
  { month: "Feb", inflows: 460, outflows: 340 },
  { month: "Mar", inflows: 490, outflows: 360 },
  { month: "Apr", inflows: 510, outflows: 370 },
  { month: "May", inflows: 560, outflows: 390 },
  { month: "Jun", inflows: 620, outflows: 420 },
  { month: "Jul", inflows: 680, outflows: 450 },
  { month: "Aug", inflows: 710, outflows: 460 },
  { month: "Sep", inflows: 740, outflows: 480 },
  { month: "Oct", inflows: 780, outflows: 500 },
  { month: "Nov", inflows: 820, outflows: 520 },
  { month: "Dec", inflows: 870, outflows: 560 },
];

const THREE_MONTH_DATA = MONTHLY_DATA.slice(9);
const THIRTY_DAY_DATA = Array.from({ length: 30 }, (_, i) => ({
  month: `${i + 1}`,
  inflows: 400 + Math.round(Math.sin(i / 3) * 80 + i * 8),
  outflows: 300 + Math.round(Math.sin(i / 4) * 50 + i * 5),
}));
const SEVEN_DAY_DATA = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
  month: d,
  inflows: 500 + i * 30 + Math.round(Math.random() * 60),
  outflows: 350 + i * 20 + Math.round(Math.random() * 40),
}));
const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
  month: `${i}:00`,
  inflows: 200 + Math.round(Math.sin(i / 3) * 100 + 50),
  outflows: 150 + Math.round(Math.sin(i / 4) * 70 + 30),
}));

const DATA_MAP: Record<TimeFrame, typeof MONTHLY_DATA> = {
  "12 months": MONTHLY_DATA,
  "3 months":  THREE_MONTH_DATA,
  "30 days":   THIRTY_DAY_DATA,
  "7 days":    SEVEN_DAY_DATA,
  "24 hours":  HOURLY_DATA,
};

const X_LABEL_MAP: Record<TimeFrame, string> = {
  "12 months": "Month",
  "3 months":  "Month",
  "30 days":   "Day",
  "7 days":    "Day",
  "24 hours":  "Hour",
};

/* ── Custom tooltip ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-outline bg-white px-4 py-3 shadow-lg text-center">
      <p className="text-[10px] text-zinc-400">This Month</p>
      <p className="text-lg font-bold text-primary-text">
        {payload[0]?.value?.toLocaleString()}
      </p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}

export function TransactionTrendChart() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("12 months");
  const data = DATA_MAP[timeFrame];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-text">Transaction Trend</h3>
        <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-primary-text transition-colors">
          Explore data
          <Export size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Time frame switcher */}
      <div className="flex items-center gap-1 rounded-full border border-outline bg-surface-subtle p-1 w-fit">
        {(["12 months", "3 months", "30 days", "7 days", "24 hours"] as TimeFrame[]).map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeFrame(tf)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              timeFrame === tf
                ? "bg-white text-primary-text shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-green" />
          Inflows
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="h-2.5 w-2.5 rounded-full bg-coral-red" />
          Outflows
        </span>
      </div>

      {/* Chart */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EBEE" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9E9E9E" }}
              axisLine={false}
              tickLine={false}
              label={{ value: X_LABEL_MAP[timeFrame], position: "insideBottom", offset: -2, style: { fontSize: 11, fill: "#9E9E9E" } }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9E9E9E" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#013220", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Line
              type="monotone"
              dataKey="inflows"
              stroke="#013220"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#013220", strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="outflows"
              stroke="#FF6A6C"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#FF6A6C", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
