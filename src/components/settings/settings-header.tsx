"use client";

import { ArrowDown2 } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";

export function SettingsHeader() {
  return (
    <header className="flex flex-wrap items-center gap-4">
      <h1 className="text-primary-text shrink-0 text-[20px] font-semibold tracking-tight">
        Settings
      </h1>

      <div className="flex min-w-0 flex-1 justify-center">
        <div className="h-10 w-[382px] shrink-0">
          <AuditTrailIconSearch variant="header" placeholder="Search here..." aria-label="Search" />
        </div>
      </div>

      <div className="ml-auto shrink-0">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-50"
        >
          Action
          <ArrowDown2 size={14} variant="Outline" color="currentColor" />
        </button>
      </div>
    </header>
  );
}
