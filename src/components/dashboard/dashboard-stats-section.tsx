"use client";

import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Cards, BitcoinConvert, TicketStar, ReceiptItem } from "iconsax-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  getAdminDashboardPaymentSummary,
  getAdminDashboardTopGiftcards,
  getAdminDashboardTopUtility,
  type NormalizedPaymentItem,
  type NormalizedTableItem,
} from "@/lib/admin-api/dashboard-api";

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
  loading,
  error,
  className = "",
  style,
}: {
  items: NormalizedPaymentItem[];
  loading: boolean;
  error: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-white p-5 h-full ${className}`}
      style={style}
    >
      <h3 className="text-[18px] font-semibold text-primary-text">Payment Processed</h3>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          Loading summary...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-center p-4 text-sm text-red-500">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          No payments processed.
        </div>
      ) : (
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
      )}
    </div>
  );
}

/* ── Reusable ranked table ── */
function SimpleTable({
  title,
  items,
  loading,
  error,
  style,
  className = "",
}: {
  title: string;
  items: NormalizedTableItem[];
  loading: boolean;
  error: string | null;
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
        {loading ? (
          <div className="flex flex-1 items-center justify-center p-5 text-sm text-zinc-400">
            Loading...
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center text-center p-4 text-xs text-red-500">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-5 text-sm text-zinc-400">
            No data available.
          </div>
        ) : (
          items.map((item, i) => (
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
          ))
        )}
      </ul>
    </div>
  );
}

/* ── Exported section ── */
export function DashboardStatsSection({
  dateRange,
}: {
  dateRange?: DateRange;
}) {
  const [payments, setPayments] = useState<NormalizedPaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [giftcards, setGiftcards] = useState<NormalizedTableItem[]>([]);
  const [giftcardsLoading, setGiftcardsLoading] = useState(true);
  const [giftcardsError, setGiftcardsError] = useState<string | null>(null);

  const [utility, setUtility] = useState<NormalizedTableItem[]>([]);
  const [utilityLoading, setUtilityLoading] = useState(true);
  const [utilityError, setUtilityError] = useState<string | null>(null);

  useEffect(() => {
    if (!dateRange) return;
    let active = true;

    const loadPayments = async () => {
      setPaymentsLoading(true);
      setPaymentsError(null);
      try {
        const fromStr = dateRange.from ? dateRange.from.toISOString() : undefined;
        const toStr = dateRange.to ? dateRange.to.toISOString() : undefined;
        const res = await getAdminDashboardPaymentSummary(fromStr, toStr);
        if (active) setPayments(res);
      } catch (err) {
        if (active) setPaymentsError(err instanceof Error ? err.message : "Failed to load payments.");
      } finally {
        if (active) setPaymentsLoading(false);
      }
    };

    const loadGiftcards = async () => {
      setGiftcardsLoading(true);
      setGiftcardsError(null);
      try {
        const fromStr = dateRange.from ? dateRange.from.toISOString() : undefined;
        const toStr = dateRange.to ? dateRange.to.toISOString() : undefined;
        const res = await getAdminDashboardTopGiftcards(fromStr, toStr);
        if (active) setGiftcards(res);
      } catch (err) {
        if (active) setGiftcardsError(err instanceof Error ? err.message : "Failed to load giftcards.");
      } finally {
        if (active) setGiftcardsLoading(false);
      }
    };

    const loadUtility = async () => {
      setUtilityLoading(true);
      setUtilityError(null);
      try {
        const fromStr = dateRange.from ? dateRange.from.toISOString() : undefined;
        const toStr = dateRange.to ? dateRange.to.toISOString() : undefined;
        const res = await getAdminDashboardTopUtility(fromStr, toStr);
        if (active) setUtility(res);
      } catch (err) {
        if (active) setUtilityError(err instanceof Error ? err.message : "Failed to load utility products.");
      } finally {
        if (active) setUtilityLoading(false);
      }
    };

    void loadPayments();
    void loadGiftcards();
    void loadUtility();

    return () => {
      active = false;
    };
  }, [dateRange]);

  const cardStyle: React.CSSProperties = {
    height: "450px",
    opacity: 1,
  };

  const tableStyle: React.CSSProperties = {
    ...cardStyle,
    width: "292px",
  };

  return (
    <div className="mt-4 flex flex-wrap gap-4 items-stretch">
      <PaymentProcessed
        className="flex-1 min-w-[320px]"
        style={cardStyle}
        items={payments}
        loading={paymentsLoading}
        error={paymentsError}
      />
      <SimpleTable
        title="Top Selling Giftcards"
        className="flex-1 min-w-[292px] max-w-[400px]"
        items={giftcards}
        loading={giftcardsLoading}
        error={giftcardsError}
        style={tableStyle}
      />
      <SimpleTable
        title="Top Utility Product"
        className="flex-1 min-w-[292px] max-w-[400px]"
        items={utility}
        loading={utilityLoading}
        error={utilityError}
        style={tableStyle}
      />
    </div>
  );
}
