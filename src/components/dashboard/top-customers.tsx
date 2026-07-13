"use client";

import { ExportSquare } from "iconsax-react";
import type { NormalizedTopCustomer } from "@/lib/admin-api/dashboard-api";

const FALLBACK_CUSTOMERS: NormalizedTopCustomer[] = [
  { name: "Roscoly Jibola",    handle: "@roscolyla",      initials: "RJ" },
  { name: "Adunni Salu",       handle: "@adunnidollars",  initials: "AS" },
  { name: "Samochino Tunde",   handle: "@Sammooooooo",    initials: "ST" },
  { name: "Okunola Eleniyan",  handle: "@Okunmoneyyy",    initials: "OE" },
  { name: "Adesubomi Fetuga",  handle: "@oloweeko",       initials: "AF" },
  { name: "Wonuola Fetuga",    handle: "@swankyyyyyyy",   initials: "WF" },
];

function Avatar({ customer }: { customer: NormalizedTopCustomer }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[12px] font-semibold text-black"
    >
      {customer.initials || customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}

export function TopCustomers({ apiData }: { apiData?: NormalizedTopCustomer[] | null }) {
  const customers = apiData && apiData.length > 0 ? apiData : FALLBACK_CUSTOMERS;

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

      {/* List */}
      <ul className="flex flex-col divide-y divide-outline">
        {customers.map((customer) => (
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
          </li>
        ))}
      </ul>
    </div>
  );
}
