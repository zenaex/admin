"use client";

import { useState } from "react";
import { DocumentText, Document } from "iconsax-react";
import { Download, ListFilter } from "lucide-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";

type AuditTrailToolbarProps = {
  tableSearch: string;
  onTableSearchChange: (value: string) => void;
};

export function AuditTrailToolbar({ tableSearch, onTableSearchChange }: AuditTrailToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);

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
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
          >
            <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
            Export
          </button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
                  <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                    <DocumentText size={18} variant="Outline" color="currentColor" />
                    CSV
                  </button>
                  <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                    <Document size={18} variant="Outline" color="currentColor" />
                    PDF
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
