"use client";

import { ListFilter } from "lucide-react";

import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { TableExportMenu } from "@/components/ui/table-export-menu";

type CommunicationToolbarProps = {
  tableSearch: string;
  onTableSearchChange: (value: string) => void;
  onFilterClick?: () => void;
  exportDisabled?: boolean;
  exportLoading?: boolean;
  onExportCsv?: () => void | Promise<void>;
  onExportPdf?: () => void | Promise<void>;
  onExportJson?: () => void | Promise<void>;
};

export function CommunicationToolbar({
  tableSearch,
  onTableSearchChange,
  onFilterClick,
  exportDisabled,
  exportLoading,
  onExportCsv,
  onExportPdf,
  onExportJson,
}: CommunicationToolbarProps) {
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
          onClick={onFilterClick}
        >
          <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
        </button>
        {onExportCsv && onExportPdf ? (
          <TableExportMenu
            disabled={exportDisabled}
            loading={exportLoading}
            onExportCsv={onExportCsv}
            onExportPdf={onExportPdf}
            onExportJson={onExportJson}
          />
        ) : null}
      </div>
    </div>
  );
}
