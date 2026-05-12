"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { getAccessToken } from "@/lib/auth/token-storage";
import { useAuth } from "@/lib/auth/auth-context";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuth();
  const pathname = usePathname() ?? "";
  const isEtradeChatroom =
    /^\/dashboard\/e-trades\/[^/]+$/.test(pathname) &&
    pathname !== "/dashboard/e-trades/transaction";
  const isEtradeTransactionDetail = /^\/dashboard\/e-trades\/transaction\/[^/]+$/.test(pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const collapseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated && !getAccessToken()) {
      router.replace("/login");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || (!isAuthenticated && !getAccessToken())) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-zinc-500">
        Checking session…
      </div>
    );
  }

  return (
    <div className="box-border flex h-dvh max-h-dvh min-h-0 gap-4 overflow-hidden bg-background p-4">
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
            "min-h-0 w-full flex-1 rounded-[22px] bg-background pb-8 pt-4",
            isEtradeChatroom || isEtradeTransactionDetail
              ? "flex flex-col overflow-hidden no-scrollbar"
              : "overflow-y-auto overscroll-y-contain no-scrollbar",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
