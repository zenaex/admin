"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowDown2, ArrowLeft2, ArrowRight2, DocumentDownload } from "iconsax-react";

import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { ErrorAlert } from "@/components/ui/error-alert";
import type { EtradeTransactionDetail, EtradeDetailOutcome } from "@/components/e-trades/etrade-mock-transactions";
import { formatAdminApiError } from "@/lib/admin-api/client";
import {
  approveAdminEtrade,
  getAdminEtradeDetail,
  rejectAdminEtrade,
} from "@/lib/admin-api/etrades-api";

const BORDER = "#EEEEEE";
const HEADER_BG = "#F9F9F9";
const TEXT = "#333333";
const LINK = "#4A6FA5";

const DETAIL_TABS = [
  { id: "requests", label: "Requests" },
  { id: "transaction-details", label: "Transaction Details" },
];

function printEtradeReceipt(detail: EtradeTransactionDetail, outcome: string) {
  const statusText = outcome === "approved"
    ? "Successful"
    : outcome === "pending"
      ? "Pending Approval"
      : "Failed";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${detail.id}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 40px;
      color: #0A0A0A;
      background: #FFFFFF;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #E8EBEE;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0A0A0A;
      margin-bottom: 8px;
    }
    .title {
      font-size: 14px;
      color: #777F89;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .amount-box {
      text-align: center;
      background: #F7F7F7;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .amount-label {
      font-size: 13px;
      color: #777F89;
      margin-bottom: 6px;
    }
    .amount-value {
      font-size: 32px;
      font-weight: 800;
      color: #0A0A0A;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 40px;
    }
    .details-row {
      border-bottom: 1px solid #E8EBEE;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .details-label {
      padding: 16px 0;
      font-size: 14px;
      color: #777F89;
      width: 40%;
    }
    .details-value {
      padding: 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: #0A0A0A;
      text-align: right;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9E9E9E;
      margin-top: 60px;
      border-top: 1px solid #E8EBEE;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ZENAEX EXCHANGE</div>
    <div class="title">Transaction Receipt</div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Trade Amount</div>
    <div class="amount-value">${detail.tradeAmount || "—"}</div>
  </div>

  <table class="details-table">
    <tr class="details-row">
      <td class="details-label">Trade ID / Ref</td>
      <td class="details-value">${detail.id}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">Session ID</td>
      <td class="details-value">${detail.sessionId || "—"}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">Customer Name</td>
      <td class="details-value">${detail.customerName || "—"}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">Channel</td>
      <td class="details-value">${detail.channel}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">Request Details</td>
      <td class="details-value">${detail.requestDetails || "—"}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">Rate / Fee</td>
      <td class="details-value">${detail.rateFee || "—"}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">NGN Equivalent</td>
      <td class="details-value">${detail.ngnEquivalent || "—"}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">Date Initiated</td>
      <td class="details-value">${detail.dateInitiated || "—"}</td>
    </tr>
    <tr class="details-row">
      <td class="details-label">Status</td>
      <td class="details-value">${statusText}</td>
    </tr>
  </table>

  <div class="footer">
    <p>Thank you for trading with Zenaex Exchange.</p>
    <p>This is an automated transaction receipt.</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups to download the receipt.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    try {
      win.print();
    } catch (e) {
      console.error("Print failed:", e);
    }
  }, 300);
}

type EtradeTransactionDetailViewProps = {
  transactionId: string;
};

export function EtradeTransactionDetailView({ transactionId }: EtradeTransactionDetailViewProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<EtradeTransactionDetail | null>(null);
  const [outcome, setOutcome] = useState<EtradeDetailOutcome>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDeclined, setSuccessDeclined] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminEtradeDetail(transactionId);
      setDetail(data);
      setOutcome(data.outcome);
    } catch (e) {
      setError(formatAdminApiError(e, "Could not load transaction."));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleApproveSubmit = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await approveAdminEtrade(transactionId);
      setShowApproveConfirm(false);
      setOutcome("approved");
      setSuccessDeclined(false);
      setShowSuccessModal(true);
      await loadDetail();
    } catch (e) {
      setActionError(formatAdminApiError(e, "Could not approve trade."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineSubmit = async () => {
    const reason = rejectReason.trim();
    if (!reason) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await rejectAdminEtrade(transactionId, reason);
      setShowDeclineConfirm(false);
      setOutcome("failed");
      setSuccessDeclined(true);
      setShowSuccessModal(true);
      setRejectReason("");
      await loadDetail();
    } catch (e) {
      setActionError(formatAdminApiError(e, "Could not decline trade."));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="mt-8 text-center text-sm text-zinc-500">Loading transaction…</p>;
  }

  if (error || !detail) {
    return (
      <div className="mt-6">
        <ErrorAlert error={error ?? "Transaction not found."} onRetry={() => void loadDetail()} />
      </div>
    );
  }

  const displayOutcome = detail.outcome;
  const isPending = displayOutcome === "pending";
  const banner = bannerForOutcome(displayOutcome);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden relative">
      <header className="sticky top-0 z-20 shrink-0 bg-background mb-6">
        <div className="flex h-[66px] items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
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
              className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text transition-colors hover:bg-surface-subtle"
              aria-expanded={actionOpen}
            >
              Action
              <ArrowDown2 size={12} variant="Outline" color="currentColor" />
            </button>
            {actionOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActionOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-[200px] overflow-hidden rounded-[12px] border border-zinc-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-[10px] bg-background px-2.5 py-2 text-left text-[14px] text-primary-text hover:bg-zinc-200"
                    onClick={() => {
                      setActionOpen(false);
                      printEtradeReceipt(detail!, outcome);
                    }}
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

      <div
        className={[
          "mt-6 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]",
          isPending ? "pb-24" : "pb-8",
        ].join(" ")}
      >
        <section>
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Transaction Details
          </h2>
          <TransactionDetailsGrid detail={detail} />
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
      {isPending && (
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
      {actionError ? (
        <div className="mt-4 px-2">
          <ErrorAlert error={actionError} onRetry={() => setActionError(null)} />
        </div>
      ) : null}

      {showDeclineConfirm && (
        <ConfirmModal
          title="Decline Etrade"
          confirmLabel={actionLoading ? "Declining…" : "Decline"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleDeclineSubmit()}
          onCancel={() => {
            setShowDeclineConfirm(false);
            setRejectReason("");
          }}
        >
          <p className="mb-3 text-center text-sm text-zinc-400">
            Are you sure you want to decline this etrade request?
          </p>
          <label className="block text-xs font-medium text-zinc-500" htmlFor="etrade-reject-reason">
            Reason (required)
          </label>
          <textarea
            id="etrade-reject-reason"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-primary-text outline-none focus:border-zinc-400"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter decline reason"
          />
        </ConfirmModal>
      )}

      {showApproveConfirm && (
        <ConfirmModal
          title="Approve Etrade"
          message="Are you sure you want to approve this etrade request?"
          confirmLabel={actionLoading ? "Approving…" : "Approve"}
          cancelLabel="Cancel"
          variant="approve"
          onConfirm={() => void handleApproveSubmit()}
          onCancel={() => setShowApproveConfirm(false)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          message={
            successDeclined
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

function TransactionDetailsGrid({ detail }: { detail: EtradeTransactionDetail }) {
  const cellBorder = `1px solid ${BORDER}`;
  const thBase = "px-4 py-3 text-left text-xs font-semibold align-middle";
  const tdBase = "px-4 py-4 text-left text-sm font-normal align-top";

  const isApproved = detail.outcome === "approved";
  const isPending = detail.outcome === "pending";

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
    <PipeHighlightedCell key="dc" value={isPending ? "—" : detail.dateCompleted} />,
  ];

  const rows: { headers: string[]; cells: ReactNode[] }[] = [
    { headers: row1Headers, cells: row1Cells },
    { headers: row2Headers, cells: row2Cells },
  ];

  if (!isPending) {
    rows.push({
      headers: ["Ops in Charge", "Approved By", "Date Approved", "\u00a0", "\u00a0"],
      cells: [
        <PipeHighlightedCell key="ops" value={detail.opsInCharge} />,
        isApproved ? <PipeHighlightedCell key="ab" value={detail.approvedBy} /> : "—",
        <PipeHighlightedCell key="da" value={isApproved ? detail.dateApproved : "—"} />,
        "\u00a0",
        "\u00a0",
      ],
    });
  } else {
    rows.push({
      headers: ["Ops in Charge", "\u00a0", "\u00a0", "\u00a0", "\u00a0"],
      cells: [<PipeHighlightedCell key="ops" value={detail.opsInCharge} />, "\u00a0", "\u00a0", "\u00a0", "\u00a0"],
    });
  }

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
