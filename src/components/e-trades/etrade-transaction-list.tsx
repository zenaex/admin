"use client";

import { useRouter } from "next/navigation";
import { Cpu } from "iconsax-react";

import type { EtradeTransactionListRow } from "@/components/e-trades/etrade-mock-transactions";

type EtradeTransactionListProps = {
  rows: EtradeTransactionListRow[];
};

const statusClass: Record<EtradeTransactionListRow["status"], string> = {
  Successful: "text-green-600",
  Failed: "text-red-500",
};

export function EtradeTransactionList({ rows }: EtradeTransactionListProps) {
  const router = useRouter();

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      <ul className="divide-y divide-zinc-100">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/e-trades/transaction/${row.id}`)}
              className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-subtle"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                <Cpu size={22} variant="Outline" color="currentColor" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary-text">{row.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{row.subtitle}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-primary-text">{row.amount}</p>
                <p className={`mt-1 text-sm font-medium ${statusClass[row.status]}`}>{row.status}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
