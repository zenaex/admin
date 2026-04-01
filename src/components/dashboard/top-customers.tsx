"use client";

import { ExportSquare } from "iconsax-react";

type Customer = {
  name: string;
  handle: string;
  initials?: string;
  avatarColor?: string;
  badge: string;
};

const CUSTOMERS: Customer[] = [
  { name: "Roscoly Jibola",    handle: "@roscolyla",      badge: "🥇" },
  { name: "Adunni Salu",       handle: "@adunnidollars",  badge: "🥈" },
  { name: "Samochino Tunde",   handle: "@Sammooooooo",    initials: "ST", avatarColor: "#E8F4FF", badge: "⭐" },
  { name: "Okunola Eleniyan",  handle: "@Okunmoneyyy",    initials: "OE", avatarColor: "#EEF0F4", badge: "💎" },
  { name: "Adesubomi Fetuga",  handle: "@oloweeko",       badge: "🔮" },
  { name: "Wonuola Fetuga",    handle: "@swankyyyyyyy",   badge: "🌙" },
];

function Avatar({ customer }: { customer: Customer }) {
  if (customer.initials) {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-primary-text"
        style={{ backgroundColor: customer.avatarColor ?? "#E8EBEE" }}
      >
        {customer.initials}
      </div>
    );
  }
  /* Placeholder circle for customers without a real image */
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EBEE] text-[11px] font-semibold text-zinc-500">
      {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}

export function TopCustomers() {
  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-outline bg-[#FFFDF7] p-5 w-full min-w-0 h-full">
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
            <span className="text-[20px] leading-none shrink-0">{customer.badge}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
