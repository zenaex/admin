"use client";

import { useRef, useState } from "react";

import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const collapseTimerRef = useRef<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-3">
      <main className="flex gap-4">
        <div
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
          <DashboardSidebar
            collapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed((current) => !current)}
          />
        </div>
        <section className="flex-1 rounded-[22px] bg-white/70 p-8">
          <h1 className="text-primary-text text-[34px] font-semibold">Dashboard</h1>
          <p className="mt-2 text-zinc-600">
            Sidebar is ready. Main dashboard content comes next.
          </p>
        </section>
      </main>
    </div>
  );
}
