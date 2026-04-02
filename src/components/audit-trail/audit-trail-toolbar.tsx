"use client";

import { Export, Filter } from "iconsax-react";
import { Download, ListFilter } from "lucide-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";

type AuditTrailToolbarProps = {
  tableSearch: string;
  onTableSearchChange: (value: string) => void;
};

export function AuditTrailToolbar({ tableSearch, onTableSearchChange }: AuditTrailToolbarProps) {
  return (
    <div className="mt-6 flex h-14.5 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
      <div className="w-[325px] shrink-0">
        <AuditTrailIconSearch
          variant="toolbar"
          placeholder="Search by Name or ID"
          aria-label="Search by name or ID"
          value={tableSearch}
          onChange={(e) => onTableSearchChange(e.target.value)}
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
          aria-label="Filter"
        >
          <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
        </button>
        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
        >
          <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          Export
        </button>
      </div>
    </div>
  );
}
