"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname() ?? "";
  const isEtradeChatroom =
    /^\/dashboard\/e-trades\/[^/]+$/.test(pathname) &&
    pathname !== "/dashboard/e-trades/transaction";
  const isEtradeTransactionDetail = /^\/dashboard\/e-trades\/transaction\/[^/]+$/.test(pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const collapseTimerRef = useRef<number | null>(null);

  return (
    <div className="box-border flex h-dvh max-h-dvh min-h-0 gap-4 overflow-hidden bg-background p-2">
      <div
        className="flex h-full min-h-0 shrink-0"
        onMouseEnter={() => {
          if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
          collapseTimerRef.current = null;
          setIsSidebarCollapsed(false);
        }}
        onMouseLeave={() => {
          if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
          collapseTimerRef.current = window.setTimeout(() => {
            setIsSidebarCollapsed(true);
          }, 120);
        }}
      >
        <DashboardSidebar collapsed={isSidebarCollapsed} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main
          className={[
            "min-h-0 w-full flex-1 rounded-[22px] bg-background px-8 pb-8 pt-4",
            isEtradeChatroom || isEtradeTransactionDetail
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto overscroll-y-contain",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
