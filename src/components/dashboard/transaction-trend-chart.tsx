"use client";

import { useState, useEffect } from "react";
import { getAdminDashboardTrend, type NormalizedTrendItem } from "@/lib/admin-api/dashboard-api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ExportSquare } from "iconsax-react";

type TimeFrame = "12 months" | "3 months" | "30 days" | "7 days" | "24 hours";

/* ── Monthly data ── */
const MONTHLY_DATA = [
  { month: "Jan", inflows: 650, outflows: 380 },
  { month: "Feb", inflows: 320, outflows: 590 },
  { month: "Mar", inflows: 890, outflows: 340 },
  { month: "Apr", inflows: 410, outflows: 780 },
  { month: "May", inflows: 950, outflows: 420 },
  { month: "Jun", inflows: 520, outflows: 890 },
  { month: "Jul", inflows: 1100, outflows: 450 },
  { month: "Aug", inflows: 490, outflows: 980 },
  { month: "Sep", inflows: 1250, outflows: 510 },
  { month: "Oct", inflows: 580, outflows: 1100 },
  { month: "Nov", inflows: 1400, outflows: 550 },
  { month: "Dec", inflows: 620, outflows: 1250 },
];

const THREE_MONTH_DATA = MONTHLY_DATA.slice(9);
const THIRTY_DAY_DATA = Array.from({ length: 30 }, (_, i) => {
  const baseInflow = 650 + Math.sin(i * 1.4) * 260 + Math.cos(i * 0.8) * 130 + (i % 3 === 0 ? 160 : -110);
  const baseOutflow = 480 + Math.cos(i * 1.7) * 190 + Math.sin(i * 0.9) * 95 + (i % 4 === 0 ? 130 : -90);
  return {
    month: `${i + 1}`,
    inflows: Math.max(120, Math.round(baseInflow)),
    outflows: Math.max(90, Math.round(baseOutflow)),
  };
});
const SEVEN_DAY_DATA = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
  const inflowVals = [780, 390, 950, 450, 1100, 320, 1250];
  const outflowVals = [420, 680, 310, 820, 490, 910, 380];
  return {
    month: d,
    inflows: inflowVals[i],
    outflows: outflowVals[i],
  };
});
const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => {
  const baseInflow = 450 + Math.sin(i * 1.3) * 220 + Math.cos(i * 2.6) * 110 + (i % 2 === 0 ? 90 : -90);
  const baseOutflow = 320 + Math.cos(i * 1.5) * 160 + Math.sin(i * 2.2) * 85 + (i % 3 === 0 ? 70 : -70);
  return {
    month: `${i}:00`,
    inflows: Math.max(60, Math.round(baseInflow)),
    outflows: Math.max(40, Math.round(baseOutflow)),
  };
});

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
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-outline bg-white px-4 py-3 shadow-lg text-left text-xs gap-1.5 flex flex-col min-w-[140px]">
      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || (item.name === "inflows" ? "#2E7D32" : "#F5222D") }} />
            <span className="text-zinc-500 font-medium capitalize">{item.name}</span>
          </div>
          <span className="font-bold text-primary-text">
            ₦{Number(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
}

function yTickFormatter(v: number) {
  if (v === 0) return "0";
  if (v >= 1e9) return `₦${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `₦${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `₦${(v / 1e3).toFixed(0)}k`;
  return `₦${v}`;
}

const TIMEFRAME_TO_API_PERIOD = {
  "12 months": "12M",
  "3 months": "3M",
  "30 days": "30D",
  "7 days": "7D",
  "24 hours": "24H",
};

export function TransactionTrendChart() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("12 months");
  const [data, setData] = useState<NormalizedTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadTrend = async () => {
      setLoading(true);
      setError(null);
      try {
        const periodCode = TIMEFRAME_TO_API_PERIOD[timeFrame];
        const res = await getAdminDashboardTrend(periodCode);
        if (active) {
          setData(res);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load trend data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadTrend();
    return () => {
      active = false;
    };
  }, [timeFrame]);

  return (
    <div className="flex flex-col gap-4 rounded-[12px] bg-white p-5 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-primary-text">Transaction Trend</h3>
        <button type="button" className="inline-flex underline items-center gap-1 text-xs font-medium text-brand-navy transition-colors">
          Explore data
          <ExportSquare size={12} variant="Outline" color="currentColor" className="text-brand-navy" />
        </button>
      </div>

      {/* Time frame switcher */}
      <div className="flex flex-wrap items-center gap-1 rounded-full p-1 w-fit max-w-full">
        {(["12 months", "3 months", "30 days", "7 days", "24 hours"] as TimeFrame[]).map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeFrame(tf)}
            className={`rounded-full px-3 py-1 text-[16px] font-medium transition-colors ${
              timeFrame === tf
                ? "bg-[#F7F7F7] text-brand-navy"
                : "text-[#494A53] hover:opacity-90"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="h-2.5 w-4.5 rounded-sm" style={{ backgroundColor: "#2E7D32" }} />
          Inflows
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="h-2.5 w-4.5 rounded-sm" style={{ backgroundColor: "#F5222D" }} />
          Outflows
        </span>
      </div>

      {/* Chart */}
      <div className="h-[220px] w-full flex items-center justify-center relative">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading trend data...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-zinc-400">No trend data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EBEE" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#0A0A0A" }}
                axisLine={false}
                tickLine={false}
                label={{ value: X_LABEL_MAP[timeFrame], position: "insideBottom", offset: -2, style: { fontSize: 11, fill: "#0A0A0A" } }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#0A0A0A" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yTickFormatter}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2E7D32", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Line
                type="monotone"
                dataKey="inflows"
                stroke="#2E7D32"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#2E7D32", strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="outflows"
                stroke="#F5222D"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#F5222D", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
