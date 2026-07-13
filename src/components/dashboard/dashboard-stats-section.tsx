"use client";

import { Cards, BitcoinConvert, TicketStar, ReceiptItem } from "iconsax-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { NormalizedPaymentItem, NormalizedTableItem } from "@/lib/admin-api/dashboard-api";

/* ── Fallback data ── */
const FALLBACK_PAYMENTS: NormalizedPaymentItem[] = [
  { label: "Deposit",    amount: "₦100,000,000", trend: "up" },
  { label: "Crypto",     amount: "₦100,000,000", trend: "down" },
  { label: "Giftcard",   amount: "₦100,000,000", trend: "up" },
  { label: "Utility/ VAS", amount: "₦100,000,000", trend: "down" },
];

const FALLBACK_GIFTCARDS: NormalizedTableItem[] = [
  { name: "Amazon",    quantity: 1200 },
  { name: "Apple",     quantity: 1200 },
  { name: "Walmart",   quantity: 1200 },
  { name: "Googleplay", quantity: 1200 },
  { name: "Xbox",      quantity: 1200 },
];

const FALLBACK_UTILITY: NormalizedTableItem[] = [
  { name: "MTN",       quantity: 1200 },
  { name: "EKEDC",     quantity: 1200 },
  { name: "Airtel",    quantity: 1200 },
  { name: "IKEDC",     quantity: 1200 },
  { name: "Sporty Bet", quantity: 1200 },
];

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  deposit:  <Cards size={24} variant="Outline" color="currentColor" />,
  crypto:   <BitcoinConvert size={24} variant="Outline" color="currentColor" />,
  giftcard: <TicketStar size={24} variant="Outline" color="currentColor" />,
  gift_card: <TicketStar size={24} variant="Outline" color="currentColor" />,
  "gift-card": <TicketStar size={24} variant="Outline" color="currentColor" />,
  utility:  <ReceiptItem size={24} variant="Outline" color="currentColor" />,
  vas:      <ReceiptItem size={24} variant="Outline" color="currentColor" />,
};

function iconForLabel(label: string): React.ReactNode {
  return PAYMENT_ICONS[label.toLowerCase()] ?? <Cards size={24} variant="Outline" color="currentColor" />;
}

/* ── Payment Processed ── */
function PaymentProcessed({
  items,
  className = "",
  style,
}: {
  items: NormalizedPaymentItem[];
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-white p-5 h-full ${className}`}
      style={style}
    >
      <h3 className="text-[18px] font-semibold text-primary-text">Payment Processed</h3>

      <ul className="flex flex-col gap-[10px] flex-1">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-[10px] rounded-[20px] bg-surface-subtle px-[24px] py-[20px] h-[80px] w-full"
          >
            {/* Icon box */}
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary-text shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
              {iconForLabel(item.label)}
            </span>

            {/* Label */}
            <span className="flex-1 text-[18px] font-medium" style={{ color: "#777F89" }}>
              {item.label}
            </span>

            {/* Amount + trend */}
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-bold text-primary-text">{item.amount}</span>
              <span
                className={`flex h-[32px] w-[44px] items-center justify-center rounded-[20px] px-[10px] py-[4px] ${
                  item.trend === "up" ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"
                }`}
              >
                {item.trend === "up" ? (
                  <TrendingUp size={20} color="#2E7D32" />
                ) : (
                  <TrendingDown size={20} color="#C62828" />
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
function SimpleTable({
  title,
  items,
  style,
  className = "",
}: {
  title: string;
  items: NormalizedTableItem[];
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-[12px] bg-white overflow-hidden h-full ${className}`}
      style={style}
    >
      {/* Card Title */}
      <div className="px-5 pt-[22px] pb-[18px]">
        <h3 className="text-[18px] font-semibold text-primary-text leading-tight">{title}</h3>
      </div>

      {/* Full-width Header Row */}
      <div className="flex items-center justify-between bg-surface-subtle px-5 py-2.5 border-b border-outline">
        <span className="text-[13px] font-medium text-zinc-400">Name</span>
        <span className="text-[13px] font-medium text-zinc-400">Quantity</span>
      </div>

      {/* List Content */}
      <ul className="flex flex-col flex-1">
        {items.map((item, i) => (
          <li
            key={item.name}
            className={`flex items-center justify-between px-5 py-5 border-b border-outline ${
              i === items.length - 1 ? "border-b-0" : ""
            }`}
          >
            <span
              className="text-[15px] font-semibold text-primary-text"
              style={{ fontFamily: "Gilmer, sans-serif", lineHeight: "150%" }}
            >
              {item.name}
            </span>
            <span
              className="text-[15px] font-semibold text-primary-text"
              style={{ fontFamily: "Gilmer, sans-serif", lineHeight: "150%" }}
            >
              {item.quantity.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Exported section ── */
export function DashboardStatsSection({
  paymentProcessed,
  topGiftcards,
  topUtility,
}: {
  paymentProcessed?: NormalizedPaymentItem[] | null;
  topGiftcards?: NormalizedTableItem[] | null;
  topUtility?: NormalizedTableItem[] | null;
}) {
  const cardStyle: React.CSSProperties = {
    height: "450px",
    opacity: 1,
  };

  const tableStyle: React.CSSProperties = {
    ...cardStyle,
    width: "292px",
  };

  const payments = paymentProcessed && paymentProcessed.length > 0 ? paymentProcessed : FALLBACK_PAYMENTS;
  const giftcards = topGiftcards && topGiftcards.length > 0 ? topGiftcards : FALLBACK_GIFTCARDS;
  const utility = topUtility && topUtility.length > 0 ? topUtility : FALLBACK_UTILITY;

  return (
    <div className="mt-4 flex flex-wrap gap-4 items-stretch">
      <PaymentProcessed className="flex-1 min-w-[320px]" style={cardStyle} items={payments} />
      <SimpleTable title="Top Selling Giftcards" className="flex-1 min-w-[292px] max-w-[400px]" items={giftcards} style={tableStyle} />
      <SimpleTable title="Top Utility Product" className="flex-1 min-w-[292px] max-w-[400px]" items={utility} style={tableStyle} />
    </div>
  );
}
