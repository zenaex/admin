"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowDown2 } from "iconsax-react";

import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { getEtradeTransactionDetail } from "@/components/e-trades/etrade-mock-transactions";

const BORDER = "#EEEEEE";
const HEADER_BG = "#F9F9F9";
const TEXT = "#333333";
const LINK = "#4A6FA5";

const DETAIL_TABS = [
  { id: "requests", label: "Requests" },
  { id: "transaction-details", label: "Transaction Details" },
];

type EtradeTransactionDetailViewProps = {
  transactionId: string;
};

export function EtradeTransactionDetailView({ transactionId }: EtradeTransactionDetailViewProps) {
  const router = useRouter();
  const detail = getEtradeTransactionDetail(transactionId);
  const [actionOpen, setActionOpen] = useState(false);

  const countryParts = detail.country.split(" | ");
  const countryLeft = countryParts[0] ?? detail.country;
  const countryRight = countryParts.length > 1 ? ` | ${countryParts.slice(1).join(" | ")}` : "";

  const dateParts = detail.dateCompleted.split(" | ");
  const dateLeft = dateParts[0] ?? detail.dateCompleted;
  const dateRight = dateParts.length > 1 ? ` | ${dateParts.slice(1).join(" | ")}` : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link href="/dashboard/e-trades" className="font-medium text-secondary-green hover:underline">
              Etrade
            </Link>
            <span aria-hidden className="text-zinc-400">
              /
            </span>
            <span className="text-primary-text">Transaction Details</span>
          </nav>

          <div className="relative">
            <button
              type="button"
              onClick={() => setActionOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-primary-text transition-colors hover:bg-surface-subtle"
              aria-expanded={actionOpen}
            >
              Action
              <ArrowDown2 size={16} variant="Outline" color="currentColor" />
            </button>
            {actionOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActionOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full px-4 py-2.5 text-left text-sm text-primary-text hover:bg-zinc-50"
                    onClick={() => setActionOpen(false)}
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    className="flex w-full px-4 py-2.5 text-left text-sm text-primary-text hover:bg-zinc-50"
                    onClick={() => setActionOpen(false)}
                  >
                    Print
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800">
          Approved!
        </div>

        <div className="mt-6">
          <UnderlineTabs
            tabs={DETAIL_TABS}
            active="transaction-details"
            onChange={(id) => {
              if (id === "requests") {
                router.push("/dashboard/e-trades?tab=requests");
              }
            }}
          />
        </div>
      </header>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]">
        <div>
          {/* Session overview */}
          <DataBlockTable
            headers={["Session ID", "Customer Names", "Channel", "Type", "Country"]}
            row={[
              <Link
                key="sid"
                href="#"
                className="underline underline-offset-2 hover:opacity-80"
                style={{ color: LINK }}
                onClick={(e) => e.preventDefault()}
              >
                {detail.sessionId}
              </Link>,
              detail.customerName,
              detail.channel,
              detail.type,
              <span key="country" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{countryLeft}</span>
                {countryRight}
              </span>,
            ]}
          />

          {/* Transaction row */}
          <DataBlockTable
            className="mt-6"
            headers={["Trade Amount", "Date Completed", "Rate / Fee Given", "Provider"]}
            row={[
              detail.tradeAmount,
              <span key="dt" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{dateLeft}</span>
                {dateRight}
              </span>,
              detail.rateFee,
              detail.provider,
            ]}
          />
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Device Information
          </h2>
          <DataBlockTable
            headers={["Device", "Device ID", "Location", "Location Coordinate"]}
            row={[detail.device, detail.deviceId, detail.location, detail.locationCoordinate]}
          />
        </section>
      </div>
    </div>
  );
}

function DataBlockTable({
  headers,
  row,
  className = "",
  collapseTopBorder = false,
}: {
  headers: string[];
  row: ReactNode[];
  className?: string;
  /** Stack block under another: omit top border on header row to avoid a double rule. */
  collapseTopBorder?: boolean;
}) {
  const cellBorder = `1px solid ${BORDER}`;
  const thBase =
    "px-4 py-3 text-left text-xs font-semibold align-middle";
  const tdBase = "px-4 py-4 text-left text-sm font-normal align-top";
  const n = headers.length;

  return (
    <div
      className={["w-full overflow-hidden rounded-xl bg-white", className].filter(Boolean).join(" ")}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ backgroundColor: HEADER_BG }}>
            {headers.map((h, i) => (
              <th
                key={h}
                className={[
                  thBase,
                  !collapseTopBorder && i === 0 ? "rounded-tl-xl" : "",
                  !collapseTopBorder && i === n - 1 ? "rounded-tr-xl" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  color: TEXT,
                  borderBottom: cellBorder,
                  borderRight: i < n - 1 ? cellBorder : "none",
                  borderTop: collapseTopBorder ? "none" : cellBorder,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white">
            {row.map((cell, i) => (
              <td
                key={i}
                className={[
                  tdBase,
                  i === 0 ? "rounded-bl-xl" : "",
                  i === n - 1 ? "rounded-br-xl" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  color: TEXT,
                  borderBottom: cellBorder,
                  borderRight: i < n - 1 ? cellBorder : "none",
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
