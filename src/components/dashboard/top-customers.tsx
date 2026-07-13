"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import Image from "next/image";
import { ExportSquare } from "iconsax-react";
import { getAdminDashboardTopCustomers, type NormalizedTopCustomer } from "@/lib/admin-api/dashboard-api";

function getBadgePath(index: number): string {
  if (index === 0) return "/1F3C6_Trophy_01_01.svg";
  if (index === 1) return "/1F3C5_SportsMedal_01_02.svg";
  if (index === 2) return "/image 1.svg";
  return "/Image.svg";
}

function Avatar({ customer }: { customer: NormalizedTopCustomer }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[12px] font-semibold text-black"
    >
      {customer.initials || customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}

export function TopCustomers({ dateRange }: { dateRange?: DateRange }) {
  const [customers, setCustomers] = useState<NormalizedTopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateRange) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const fromStr = dateRange.from ? dateRange.from.toISOString() : undefined;
        const toStr = dateRange.to ? dateRange.to.toISOString() : undefined;
        const res = await getAdminDashboardTopCustomers(fromStr, toStr);
        if (active) {
          setCustomers(res);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load top customers.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [dateRange]);

  return (
    <div
      className="flex flex-col gap-4 rounded-[20px] bg-white p-5 w-full min-w-0 h-full bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('/Leaderboard.svg')" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-primary-text">Top Customers</h3>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[12px] font-medium underline text-primary-text transition-colors"
        >
          Explore data
          <ExportSquare size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* List / states */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 min-h-[300px]">
          Loading customers...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-center p-4 text-xs text-red-500 min-h-[300px]">
          {error}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 min-h-[300px]">
          No customers found.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-outline">
          {customers.map((customer, index) => (
            <li key={customer.handle} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar customer={customer} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-primary-text leading-tight">
                    {customer.name}
                  </p>
                  <p className="truncate text-[11px] text-zinc-400 mt-0.5">{customer.handle}</p>
                </div>
              </div>
              <div className="shrink-0">
                <Image
                  src={getBadgePath(index)}
                  alt="rank badge"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
