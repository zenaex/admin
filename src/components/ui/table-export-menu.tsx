"use client";

import { useState } from "react";
import { DocumentText, Document } from "iconsax-react";
import { Download } from "lucide-react";

export type TableExportMenuProps = {
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
  triggerClassName?: string;
  onExportCsv: () => void | Promise<void>;
  onExportPdf: () => void | Promise<void>;
  /** Show JSON option when API returns JSON records */
  onExportJson?: () => void | Promise<void>;
};

export function TableExportMenu({
  disabled = false,
  loading = false,
  label = "Export",
  className = "",
  triggerClassName = "",
  onExportCsv,
  onExportPdf,
  onExportJson,
}: TableExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => void | Promise<void>) => {
    if (disabled || loading || busy) return;
    setBusy(true);
    try {
      await fn();
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed.";
      window.alert(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName || "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle disabled:opacity-50"}
      >
        <Download size={18} strokeWidth={2} color={triggerClassName ? "currentColor" : "var(--color-brand-navy)"} />
        {loading || busy ? "Exporting…" : label}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
            <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
              <button
                type="button"
                onClick={() => void run(onExportCsv)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50"
              >
                <DocumentText size={18} variant="Outline" color="currentColor" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => void run(onExportPdf)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50"
              >
                <Document size={18} variant="Outline" color="currentColor" />
                PDF
              </button>
              {onExportJson ? (
                <button
                  type="button"
                  onClick={() => void run(onExportJson)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50"
                >
                  <DocumentText size={18} variant="Outline" color="currentColor" />
                  JSON
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
