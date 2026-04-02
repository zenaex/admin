"use client";

import { ArrowUp, ArrowDown, Cards, BitcoinConvert, Gift, Electricity } from "iconsax-react";
import { TrendingUp, TrendingDown } from "lucide-react";

/* ── Payment Processed ── */
type PaymentItem = {
  label: string;
  amount: string;
  trend: "up" | "down";
  icon: React.ReactNode;
};

const PAYMENTS: PaymentItem[] = [
  {
    label: "Deposit",
    amount: "₦100,000,000",
    trend: "up",
    icon: <Cards size={20} variant="Outline" color="currentColor" />,
  },
  {
    label: "Crypto",
    amount: "₦100,000,000",
    trend: "down",
    icon: <BitcoinConvert size={20} variant="Outline" color="currentColor" />,
  },
  {
    label: "Giftcard",
    amount: "₦100,000,000",
    trend: "up",
    icon: <Gift size={20} variant="Outline" color="currentColor" />,
  },
  {
    label: "Utility/ VAS",
    amount: "₦100,000,000",
    trend: "down",
    icon: <Electricity size={20} variant="Outline" color="currentColor" />,
  },
];

function PaymentProcessed() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline bg-white p-5">
      <h3 className="text-[16px] font-semibold text-primary-text">Payment Processed</h3>

      <ul className="flex flex-col gap-2.5">
        {PAYMENTS.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-3 rounded-[10px] bg-surface-subtle px-3.5 py-3"
          >
            {/* Icon box */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              {item.icon}
            </span>

            {/* Label */}
            <span className="flex-1 text-[13px] text-zinc-400">{item.label}</span>

            {/* Amount + trend */}
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-primary-text">{item.amount}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  item.trend === "up" ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"
                }`}
              >
                {item.trend === "up" ? (
                  <TrendingUp size={19} color="#2E7D32" />
                ) : (
                  <TrendingDown size={19} color="#C62828" />
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Reusable ranked table ── */
type TableItem = { name: string; quantity: number };

function SimpleTable({ title, items }: { title: string; items: TableItem[] }) {
  return (
    <div className="flex flex-col rounded-xl border border-outline bg-white p-5">
      <h3 className="text-[16px] font-semibold text-primary-text">{title}</h3>

      {/* Column headers */}
      <div className="mt-3 flex items-center justify-between border-b border-outline pb-2">
        <span className="text-[12px] font-medium text-zinc-400">Name</span>
        <span className="text-[12px] font-medium text-zinc-400">Quantity</span>
      </div>

      <ul className="flex flex-col divide-y divide-outline">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-subtle text-[11px] font-semibold text-zinc-400">
                {i + 1}
              </span>
              <span className="text-[13px] text-primary-text">{item.name}</span>
            </div>
            <span className="text-[13px] font-medium text-primary-text">{item.quantity.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const GIFTCARDS: TableItem[] = [
  { name: "Amazon",      quantity: 1200 },
  { name: "Apple",       quantity: 1200 },
  { name: "Walmart",     quantity: 1200 },
  { name: "Googleplay",  quantity: 1200 },
  { name: "Xbox",        quantity: 1200 },
];

const UTILITY: TableItem[] = [
  { name: "MTN",        quantity: 1200 },
  { name: "EKEDC",      quantity: 1200 },
  { name: "Airtel",     quantity: 1200 },
  { name: "IKEDC",      quantity: 1200 },
  { name: "Sporty Bet", quantity: 1200 },
];

/* ── Exported section ── */
export function DashboardStatsSection() {
  return (
    <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "5fr 2fr 2fr" }}>
      <PaymentProcessed />
      <SimpleTable title="Top Selling Giftcards" items={GIFTCARDS} />
      <SimpleTable title="Top Utility Product" items={UTILITY} />
    </div>
  );
}
