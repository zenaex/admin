"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ExportSquare } from "iconsax-react";
import { getAdminDashboardCategories, type NormalizedProductCategory } from "@/lib/admin-api/dashboard-api";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: NormalizedProductCategory & { displayValue?: number } }> }) {
  if (!active || !payload?.length) return null;
  const { name, displayValue, value } = payload[0].payload;
  const valToShow = displayValue !== undefined ? displayValue : value;
  return (
    <div className="rounded-xl border border-outline bg-white px-3 py-2 shadow-lg text-xs">
      <span className="font-semibold text-primary-text">{name}</span>
      <span className="ml-1 text-zinc-400">{valToShow}%</span>
    </div>
  );
}

export function ProductCategoryChart({ dateRange }: { dateRange?: DateRange }) {
  const [data, setData] = useState<NormalizedProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateRange) return;
    let active = true;
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const fromStr = dateRange.from ? dateRange.from.toISOString() : undefined;
        const toStr = dateRange.to ? dateRange.to.toISOString() : undefined;
        const res = await getAdminDashboardCategories(fromStr, toStr);
        if (active) {
          const sorted = [...res].sort((a, b) => b.value - a.value);
          setData(sorted);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load categories.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadCategories();
    return () => {
      active = false;
    };
  }, [dateRange]);

  const chartData = data.map((item) => ({
    ...item,
    value: Math.max(item.value, 12),
    displayValue: item.value,
  }));

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[16px] font-semibold text-primary-text whitespace-nowrap">Product Category</h3>
        <button type="button" className="inline-flex underline items-center gap-1 text-[12px] font-medium text-primary-text transition-colors whitespace-nowrap shrink-0">
          Explore data
          <ExportSquare size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Donut chart */}
      <div className="flex items-center justify-center">
        <div className="h-45 w-45">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-sm text-zinc-400">Loading...</p>
            </div>
          ) : error ? (
            <div className="flex h-full w-full items-center justify-center text-center px-2">
              <p className="text-xs text-red-500">{error}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={-15}
                  dataKey="value"
                  strokeWidth={0}
                  cornerRadius={12}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name} ({item.value}%)
          </span>
        ))}
      </div>
    </div>
  );
}
