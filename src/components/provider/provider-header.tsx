"use client";

import { Notification, Setting2 } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";

export function ProviderHeader({ title = "Provider" }: { title?: string }) {
  return (
    <header className="flex flex-wrap items-center gap-4">
      <h1 className="text-primary-text shrink-0 text-[20px] font-semibold tracking-tight">
        {title}
      </h1>

      <div className="flex min-w-0 flex-1 justify-center">
        <div className="h-10 w-[382px] shrink-0">
          <AuditTrailIconSearch variant="header" placeholder="Search here..." aria-label="Search" />
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Notifications"
        >
          <Notification size={22} variant="Outline" color="currentColor" />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-semibold text-white">
            3
          </span>
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Settings"
        >
          <Setting2 size={22} variant="Outline" color="currentColor" />
        </button>
      </div>
    </header>
  );
}
