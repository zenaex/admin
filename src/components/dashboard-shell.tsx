"use client";

import { useRef, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
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
      <div className="flex min-h-0 min-w-0 flex-1 justify-center">
        <main className="min-h-0 w-full overflow-y-auto overscroll-y-contain rounded-[22px] bg-[#FAFAFA] px-8 pb-8 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}
