"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown2, ArrowLeft2, ArrowRight2, DocumentDownload } from "iconsax-react";

import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import {
  getEtradeTransactionDetail,
  parseEtradeDetailOutcome,
  type EtradeTransactionDetail,
  type EtradeDetailOutcome,
} from "@/components/e-trades/etrade-mock-transactions";

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
  const searchParams = useSearchParams();
  const outcomeOverride = parseEtradeDetailOutcome(searchParams?.get("outcome"));
  const detail = useMemo(
    () => getEtradeTransactionDetail(transactionId, outcomeOverride),
    [transactionId, outcomeOverride],
  );

  const [outcome, setOutcome] = useState<EtradeDetailOutcome>(detail.outcome);
  const [actionOpen, setActionOpen] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const banner = bannerForOutcome(outcome);

  const handleApproveSubmit = () => {
    setShowApproveConfirm(false);
    setOutcome("approved");
    setShowSuccessModal(true);
  };

  const handleDeclineSubmit = () => {
    setShowDeclineConfirm(false);
    setOutcome("failed");
    setShowSuccessModal(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden relative">
      <header className="sticky top-0 z-20 shrink-0 bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <Link
              href="/dashboard/e-trades"
              className="inline-flex items-center gap-1 text-primary-text hover:underline"
            >
              <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
              Etrade
            </Link>
            <ArrowRight2 size={14} variant="Outline" color="currentColor" />
            <span className="text-primary-text">Transaction Details</span>
          </div>

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
                <div className="absolute right-0 top-full z-50 mt-2 w-[200px] overflow-hidden rounded-[12px] border border-zinc-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[14px] text-primary-text hover:bg-zinc-50"
                    onClick={() => setActionOpen(false)}
                  >
                    <DocumentDownload size={16} variant="Outline" color="currentColor" />
                    Download Receipt
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div
          className={[
            "mt-4 flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold",
            banner.className,
          ].join(" ")}
        >
          {banner.label}
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

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 pb-24 [-webkit-overflow-scrolling:touch]">
        <section>
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Transaction Details
          </h2>
          <TransactionDetailsGrid detail={detail} outcome={outcome} />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Device Information
          </h2>
          <DataBlockTable
            headers={["Device", "Device ID", "Location", "Coordinate"]}
            row={[detail.device, detail.deviceId, detail.location, detail.locationCoordinate]}
          />
        </section>
      </div>

      {/* Sticky Bottom Actions Bar for Pending requests */}
      {outcome === "pending" && (
        <div className="sticky bottom-0 z-40 -mx-8 mt-auto flex items-center justify-center gap-4 border-t border-zinc-100 bg-white px-6 py-5">
          <button
            type="button"
            onClick={() => setShowDeclineConfirm(true)}
            className="h-12 min-w-[160px] rounded-full border border-zinc-200 bg-white px-8 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-50"
          >
            Decline Trade
          </button>
          <button
            type="button"
            onClick={() => setShowApproveConfirm(true)}
            className="h-12 min-w-[180px] rounded-full bg-[#C1FF00] px-8 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90 shadow-sm"
          >
            Approve Trade
          </button>
        </div>
      )}

      {/* Modals */}
      {showDeclineConfirm && (
        <ConfirmModal
          title="Decline Etrade"
          message="Are you sure you want to decline this etrade request?"
          confirmLabel="Decline"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleDeclineSubmit}
          onCancel={() => setShowDeclineConfirm(false)}
        />
      )}

      {showApproveConfirm && (
        <ConfirmModal
          title="Approve Etrade"
          message="Are you sure you want to approve this etrade request?"
          confirmLabel="Approve"
          cancelLabel="Cancel"
          variant="approve"
          onConfirm={handleApproveSubmit}
          onCancel={() => setShowApproveConfirm(false)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          message={
            outcome === "failed"
              ? "Etrade transaction has been declined"
              : "Etrade transaction has been successfully approved"
          }
          confirmLabel="Done"
          onContinue={() => {
            setShowSuccessModal(false);
            router.push("/dashboard/e-trades?tab=requests");
          }}
        />
      )}
    </div>
  );
}

function bannerForOutcome(outcome: EtradeDetailOutcome): { label: string; className: string } {
  switch (outcome) {
    case "approved":
      return { label: "Successful", className: "bg-green-50 text-[#166534]" };
    case "pending":
      return { label: "Pending Approval", className: "border border-orange-200 bg-orange-50 text-orange-600" };
    case "failed":
      return { label: "Failed", className: "border border-red-100 bg-red-50 text-red-700" };
    default:
      return { label: "Successful", className: "bg-green-50 text-[#166534]" };
  }
}

function splitPipeHighlight(value: string) {
  const parts = value.split(" | ");
  const left = parts[0] ?? value;
  const right = parts.length > 1 ? ` | ${parts.slice(1).join(" | ")}` : "";
  return { left, right };
}

function PipeHighlightedCell({ value }: { value: string }) {
  if (value === "—" || value.trim() === "") {
    return (
      <span className="text-sm" style={{ color: TEXT }}>
        {value}
      </span>
    );
  }
  const { left, right } = splitPipeHighlight(value);
  return (
    <span className="text-sm" style={{ color: TEXT }}>
      <span style={{ color: LINK }}>{left}</span>
      {right}
    </span>
  );
}

function TransactionDetailsGrid({
  detail,
  outcome,
}: {
  detail: EtradeTransactionDetail;
  outcome: EtradeDetailOutcome;
}) {
  const cellBorder = `1px solid ${BORDER}`;
  const thBase = "px-4 py-3 text-left text-xs font-semibold align-middle";
  const tdBase = "px-4 py-4 text-left text-sm font-normal align-top";

  const isApproved = outcome === "approved";
  const isPending = outcome === "pending";

  const row1Headers = ["Session ID", "Customer Names", "Channel", "Request Details", "Country"];
  const row1Cells: ReactNode[] = [
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
    detail.requestDetails,
    <PipeHighlightedCell key="country" value={detail.country} />,
  ];

  const row2Headers = ["Trade Amount", "Rate/Fee", "NGN Equivalent", "Date Initiated", "Date Completed"];
  const row2Cells: ReactNode[] = [
    detail.tradeAmount,
    detail.rateFee,
    detail.ngnEquivalent,
    <PipeHighlightedCell key="di" value={detail.dateInitiated} />,
    <PipeHighlightedCell key="dc" value={isPending ? "—" : detail.dateInitiated} />,
  ];

  const row3Headers = ["Ops in Charge", "Approved By", "Date Approved", "\u00a0", "\u00a0"];
  const row3Cells: ReactNode[] = [
    detail.opsInCharge,
    isApproved ? "Ezekiel Olajolo" : "—",
    <PipeHighlightedCell key="da" value={isApproved ? detail.dateInitiated : "—"} />,
    "\u00a0",
    "\u00a0",
  ];

  const rows: { headers: string[]; cells: ReactNode[] }[] = [
    { headers: row1Headers, cells: row1Cells },
    { headers: row2Headers, cells: row2Cells },
    { headers: row3Headers, cells: row3Cells },
  ];

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white">
      <table className="w-full border-collapse text-left">
        <tbody>
          {rows.map((block, blockIdx) => {
            const isFirst = blockIdx === 0;
            const isLast = blockIdx === rows.length - 1;
            const nH = block.headers.length;
            const nC = block.cells.length;
            return (
              <FragmentRows
                key={blockIdx}
                headers={block.headers}
                cells={block.cells}
                thBase={thBase}
                tdBase={tdBase}
                cellBorder={cellBorder}
                isFirst={isFirst}
                isLast={isLast}
                nH={nH}
                nC={nC}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FragmentRows({
  headers,
  cells,
  thBase,
  tdBase,
  cellBorder,
  isFirst,
  isLast,
  nH,
  nC,
}: {
  headers: string[];
  cells: ReactNode[];
  thBase: string;
  tdBase: string;
  cellBorder: string;
  isFirst: boolean;
  isLast: boolean;
  nH: number;
  nC: number;
}) {
  return (
    <>
      <tr style={{ backgroundColor: HEADER_BG }}>
        {headers.map((h, i) => (
          <th
            key={`h-${h}-${i}`}
            className={[
              thBase,
              isFirst && i === 0 ? "rounded-tl-xl" : "",
              isFirst && i === nH - 1 ? "rounded-tr-xl" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              color: TEXT,
              borderBottom: cellBorder,
              borderRight: i < nH - 1 ? cellBorder : "none",
              borderTop: isFirst ? cellBorder : "none",
            }}
          >
            {h}
          </th>
        ))}
      </tr>
      <tr className="bg-white">
        {cells.map((cell, i) => (
          <td
            key={`c-${i}`}
            className={[
              tdBase,
              isLast && i === 0 ? "rounded-bl-xl" : "",
              isLast && i === nC - 1 ? "rounded-br-xl" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              color: TEXT,
              borderBottom: cellBorder,
              borderRight: i < nC - 1 ? cellBorder : "none",
            }}
          >
            {cell}
          </td>
        ))}
      </tr>
    </>
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
  const thBase = "px-4 py-3 text-left text-xs font-semibold align-middle";
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
