"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ExportSquare } from "iconsax-react";

const DATA = [
  { name: "Crypto",   value: 45, color: "#BCEB0F" },
  { name: "Giftcard", value: 30, color: "#FF6A6C" },
  { name: "Utility",  value: 20, color: "#6A82FF" },
  { name: "Others",   value: 5,  color: "#013220" },
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="rounded-xl border border-outline bg-white px-3 py-2 shadow-lg text-xs">
      <span className="font-semibold text-primary-text">{name}</span>
      <span className="ml-1 text-zinc-400">{value}%</span>
    </div>
  );
}

export function ProductCategoryChart() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline bg-white p-5 w-full min-w-0">
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
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
        
              <Pie
                data={DATA}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={-15}
                dataKey="value"
                strokeWidth={0}
                cornerRadius={12}
              >
                {DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {DATA.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name} ({item.value}%)
          </span>
        ))}
      </div>
    </div>
  );
}
