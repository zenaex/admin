"use client";

import { useRouter } from "next/navigation";
import { Edit } from "iconsax-react";
import type { EtradeRequestRow } from "@/components/e-trades/etrade-types";

type EtradeRequestListProps = {
  rows: EtradeRequestRow[];
};

export function EtradeRequestList({ rows }: EtradeRequestListProps) {
  const router = useRouter();

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/e-trades/${id}`);
  };

  return (
    <div className="mt-4 overflow-x-auto rounded-[8px] bg-white border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-[#F9F9F9] text-zinc-400 border-b border-zinc-100">
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Trade ID</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Customer</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Request</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Date Created</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Trade Value</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Status</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            let statusBadge = null;
            if (row.status === "Pending") {
              statusBadge = (
                <span className="inline-flex items-center rounded-full bg-[#FEF5ED] px-3 py-1 text-xs font-semibold text-[#E28743]">
                  Awaiting Approval
                </span>
              );
            } else if (row.status === "Successful") {
              statusBadge = (
                <span className="inline-flex items-center rounded-full bg-[#EAF9F1] px-3 py-1 text-xs font-semibold text-[#27AE60]">
                  Completed
                </span>
              );
            } else {
              statusBadge = (
                <span className="inline-flex items-center rounded-full bg-[#FCEBEC] px-3 py-1 text-xs font-semibold text-[#EB5757]">
                  Failed
                </span>
              );
            }

            return (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row.id)}
                className="group cursor-pointer border-b border-zinc-100 transition-colors hover:bg-surface-subtle"
              >
                <td className="h-16 px-4 py-0 align-middle font-medium">
                  <span className="text-[#0B294F] font-bold underline decoration-solid decoration-[#0B294F] hover:opacity-85">
                    {row.tradeId}
                  </span>
                </td>
                <td className="h-16 px-4 py-0 align-middle text-zinc-600 font-medium">{row.customer}</td>
                <td className="h-16 px-4 py-0 align-middle text-zinc-500">{row.title}</td>
                <td className="h-16 px-4 py-0 align-middle text-zinc-500">{row.dateCreated}</td>
                <td className="h-16 px-4 py-0 align-middle text-zinc-800 font-semibold">{row.tradeValue}</td>
                <td className="h-16 px-4 py-0 align-middle">{statusBadge}</td>
                <td className="h-16 px-4 py-0 align-middle">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(row.id);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-outline hover:text-zinc-600"
                    aria-label={`View trade ${row.tradeId}`}
                  >
                    <Edit size={16} variant="Outline" color="currentColor" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
