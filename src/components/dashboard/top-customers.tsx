"use client";

import Image from "next/image";
import { ExportSquare } from "iconsax-react";

type Customer = {
  name: string;
  handle: string;
  initials?: string;
  avatarColor?: string;
  badge?: string;
  badgePath?: string;
};

const CUSTOMERS: Customer[] = [
  { 
    name: "Roscoly Jibola", 
    handle: "@roscolyla", 
    badgePath: "/1F3C6_Trophy_01_01.svg" 
  },
  { 
    name: "Adunni Salu", 
    handle: "@adunnidollars", 
    badgePath: "/1F3C5_SportsMedal_01_02.svg" 
  },
  { 
    name: "Samochino Tunde", 
    handle: "@Sammooooooo", 
    initials: "ST", 
    badgePath: "/image 1.svg" 
  },
  { 
    name: "Okunola Eleniyan", 
    handle: "@Okunmoneyyy", 
    initials: "OE", 
    badgePath: "/Image.svg" 
  },
  { 
    name: "Adesubomi Fetuga", 
    handle: "@oloweeko", 
    badgePath: "/Image.svg" 
  },
  { 
    name: "Wonuola Fetuga", 
    handle: "@swankyyyyyyy", 
    badgePath: "/Image.svg" 
  },
];

function Avatar({ customer }: { customer: Customer }) {
  if (customer.initials) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-black"
        style={{ backgroundColor: customer.avatarColor ?? "#F7F7F7" }}
      >
        {customer.initials}
      </div>
    );
  }
  /* Placeholder circle for customers without a real image */
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[11px] font-semibold text-black">
      {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}

export function TopCustomers() {
  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-outline bg-primary-green/5  p-5 w-full min-w-0 h-full">
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
        {CUSTOMERS.map((customer) => (
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
            {customer.badgePath ? (
              <div className="shrink-0">
                <Image 
                  src={customer.badgePath} 
                  alt="rank badge" 
                  width={24} 
                  height={24} 
                  className="object-contain"
                />
              </div>
            ) : (
              <span className="text-[20px] leading-none shrink-0">{customer.badge}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
