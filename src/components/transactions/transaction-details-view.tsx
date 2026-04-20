"use client";

import React, { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, DocumentUpload } from "iconsax-react";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";

/* ── Table styling (aligned with E-trade detail tables) ── */
const BORDER = "#EEEEEE";
const HEADER_BG = "#F9F9F9";
const TEXT = "#333333";
const LINK = "#4A6FA5";

/* ── Types ── */
type TxApprovalStatus = "Approved" | "Pending" | "Rejected";

/** Deposit / non-giftcard transaction detail layout (switch in `TX_DATA.depositDetailVariant`). */
type DepositDetailVariant = "crypto" | "tv" | "utility_electricity" | "utility_betting";

/* ── Mock data: use channel "Giftcard" (+ optional status Pending/Rejected) for giftcard tables & image placeholders. ── */
const TX_DATA = {
  channel: "Giftcard" as "Deposit" | "Giftcard",
  /** When `channel` is `"Deposit"`, pick TV / Utility / crypto layout. */
  depositDetailVariant: "tv" as DepositDetailVariant,
  transactionId: "12324235334252526",
  customerName: "Naomi Salisu",
  typeDeposit: "Sell Deposit",
  currency: "Bitcoin | BTC",
  amountUsd: "$30, 000.00",
  amountEquivalent: "80.005 BTC",
  datedInitiated: "Jan 6, 2026 | 9:32AM",
  dateCompleted: "Jan 6, 2026 | 9:32AM",
  rateGiven: "B1=$96832.01",
  provider: "Quidex",
  ourFee: "$2.01",
  balanceAfter: "$30, 000.00",
  sessionId: "12324235334262526",
  typeGift: "Physical Card",
  code: "14292920204637",
  country: "United States | USD",
  amount: "$1,000.00",
  amountPaidOut: "₦ 1,000,000.00",
  dateUploaded: "Jan 6, 2026 | 9:32AM",
  rateFeeGiven: "1045/$1",
  balanceAfterGift: "$1,000,000.00",
  opsInCharge: "Florence Arinze",
};

const RECIPIENT_DATA = {
  walletAddress: "12324235334252526",
  network: "Tron",
  networkFee: "$2.10",
};

const RECIPIENT_TV = {
  smartcardNo: "472242353543",
  accountName: "Okunola Roscoly",
};

const RECIPIENT_UTILITY_ELECTRICITY = {
  address: "10, Olajolo Stree, Ajah, Lagos",
  meterNumber: "472242353543",
  accountName: "Okunola Roscoly",
};

const RECIPIENT_UTILITY_BETTING = {
  bettingId: "472242353543",
  accountName: "Okunola Roscoly",
};

const TX_TIMESTAMP = "Jan 6, 2026 | 9:32AM";

const DEVICE_DATA = {
  device: "Iphone 15pro",
  deviceId: "c83738d83yedhd",
  location: "Ijebu Igbo, Ogun State",
  locationCoordinate: "Lat: 40'748944",
};

/** Device row for giftcard (physical card) detail — matches product copy. */
const DEVICE_DATA_GIFT = {
  device: "iPhone 15pro",
  deviceId: "cd3738d83yedhd",
  location: "Ijebu Igbo, Ogun State",
  locationCoordinate: "Lat: 40.748944",
};

/* ── Tab config ── */
type DetailTab = "Transaction Details" | "Transaction Log";
const TABS: DetailTab[] = ["Transaction Details", "Transaction Log"];

/* ── Rejection reasons ── */
const REJECTION_REASONS = [
  "Invalid card",
  "Expired card",
  "Fraud suspected",
  "Incorrect amount",
  "Duplicate transaction",
  "Other",
];

/* ── Main view ── */
type TransactionDetailsViewProps = {
  id?: string;
};

export function TransactionDetailsView({ id: _id }: TransactionDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("Transaction Details");
  const [approvalStatus, setApprovalStatus] = useState<TxApprovalStatus>(() =>
    TX_DATA.channel === "Giftcard" ? "Rejected" : "Approved",
  );

  const isGiftcard = TX_DATA.channel === "Giftcard";

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleApproveConfirm = () => {
    setShowApproveConfirm(false);
    setApprovalStatus("Approved");
    setShowSuccessModal(true);
  };

  const handleRejectSubmit = () => {
    setShowRejectModal(false);
    setApprovalStatus("Rejected");
    setShowSuccessModal(true);
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="relative pb-28">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/transactions" className="inline-flex items-center gap-1 text-primary-text hover:underline">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Transactions
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Transaction Details</span>
        </div>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-primary-text shadow-sm hover:bg-surface-subtle"
        >
          Action
          <ArrowDown2 size={14} variant="Outline" color="currentColor" />
        </button>
      </div>

      <StatusBanner status={approvalStatus} />

      <div className="mt-6">
        <UnderlineTabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => setActiveTab(id as DetailTab)}
        />
      </div>

      {activeTab === "Transaction Details" && <TransactionDetailsTab />}
      {activeTab === "Transaction Log" && <TransactionLogTab />}

      {isGiftcard && approvalStatus === "Pending" && (
        <div className="sticky bottom-0 z-40 -mx-8 mt-8 flex items-center justify-center gap-4 border-t border-zinc-100 bg-white px-6 py-5">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="h-12 min-w-[160px] rounded-full border border-zinc-200 bg-white px-8 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-50"
          >
            No, Reject
          </button>
          <button
            type="button"
            onClick={() => setShowApproveConfirm(true)}
            className="h-12 min-w-[180px] rounded-full bg-primary-green px-8 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            Yes, Approve
          </button>
        </div>
      )}

      {showRejectModal && (
        <RejectModal onClose={() => setShowRejectModal(false)} onSubmit={handleRejectSubmit} />
      )}

      {showApproveConfirm && (
        <ConfirmModal
          title="Approve"
          message="Are you sure you want to approve this giftcard transaction?"
          confirmLabel="Approve"
          cancelLabel="Cancel"
          variant="approve"
          onConfirm={handleApproveConfirm}
          onCancel={() => setShowApproveConfirm(false)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          message={
            approvalStatus === "Rejected"
              ? "Giftcard transaction has been rejected"
              : "Giftcard transaction has been successfully approved"
          }
          confirmLabel="Done"
          onContinue={handleSuccessDone}
        />
      )}
    </div>
  );
}

function GiftcardImagePlaceholder() {
  return (
    <div
      className="flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100/80 px-4 py-10 text-center"
      role="img"
      aria-label="Image placeholder"
    >
      <div className="h-12 w-16 rounded-md border border-zinc-300 bg-zinc-200/80" aria-hidden />
      <span className="text-xs font-medium text-zinc-500">Image preview placeholder</span>
    </div>
  );
}

function StatusBanner({ status }: { status: TxApprovalStatus }) {
  if (status === "Rejected") {
    return (
      <div className="flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        Rejected!
      </div>
    );
  }
  const isApproved = status === "Approved";
  return (
    <div
      className={`flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
        isApproved ? "bg-green-50 text-[#166534]" : "border border-orange-200 bg-orange-50 text-orange-600"
      }`}
    >
      {isApproved ? "Approved!" : "Pending Approval !"}
    </div>
  );
}

function TimeStampCell({ value }: { value: string }) {
  const parts = value.split(" | ");
  return (
    <span className="text-sm" style={{ color: TEXT }}>
      <span style={{ color: LINK }}>{parts[0]}</span>
      {parts.length > 1 ? ` | ${parts.slice(1).join(" | ")}` : ""}
    </span>
  );
}

function TransactionIdLink({ id }: { id: string }) {
  return (
    <Link
      href="#"
      className="underline underline-offset-2 hover:opacity-80"
      style={{ color: LINK }}
      onClick={(e) => e.preventDefault()}
    >
      {id}
    </Link>
  );
}

function DepositDeviceSection() {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
        Device Information
      </h2>
      <TxDataBlockTable
        headers={["Device", "Device ID", "Location", "Location Coordinate"]}
        row={[DEVICE_DATA.device, DEVICE_DATA.deviceId, DEVICE_DATA.location, DEVICE_DATA.locationCoordinate]}
      />
    </section>
  );
}

function DepositTransactionDetailsContent() {
  const v = TX_DATA.depositDetailVariant;

  if (v === "crypto") {
    const currencyParts = TX_DATA.currency.split(" | ");
    const c0 = currencyParts[0] ?? "";
    const cRest = currencyParts.length > 1 ? ` | ${currencyParts.slice(1).join(" | ")}` : "";
    const initiatedParts = TX_DATA.datedInitiated.split(" | ");
    const completedParts = TX_DATA.dateCompleted.split(" | ");

    return (
      <>
        <section className="mt-6">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Transaction Details
          </h2>
          <TxDataBlockTable
            headers={[
              "Transaction ID",
              "Customer Names",
              "Channnel",
              "Type",
              "Currency",
              "Amount (USD)",
            ]}
            row={[
              <TransactionIdLink key="txid" id={TX_DATA.transactionId} />,
              TX_DATA.customerName,
              TX_DATA.channel,
              TX_DATA.typeDeposit,
              <span key="cur" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{c0}</span>
                {cRest}
              </span>,
              TX_DATA.amountUsd,
            ]}
          />
          <TxDataBlockTable
            className="mt-6"
            headers={[
              "Amount Equivalent",
              "Dated Initiated",
              "Date Completed",
              "Rate Given",
              "Provider",
              "Our Fee",
            ]}
            row={[
              TX_DATA.amountEquivalent,
              <span key="di" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{initiatedParts[0]}</span>
                {initiatedParts.length > 1 ? ` | ${initiatedParts.slice(1).join(" | ")}` : ""}
              </span>,
              <span key="dc" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{completedParts[0]}</span>
                {completedParts.length > 1 ? ` | ${completedParts.slice(1).join(" | ")}` : ""}
              </span>,
              TX_DATA.rateGiven,
              TX_DATA.provider,
              TX_DATA.ourFee,
            ]}
          />
          <TxDataBlockTable className="mt-6" headers={["Balance After"]} row={[TX_DATA.balanceAfter]} />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Recipient Details
          </h2>
          <TxDataBlockTable
            headers={["Wallet Addresss", "Network", "Network Fee"]}
            row={[
              <Link
                key="w"
                href="#"
                className="underline underline-offset-2 hover:opacity-80"
                style={{ color: LINK }}
                onClick={(e) => e.preventDefault()}
              >
                {RECIPIENT_DATA.walletAddress}
              </Link>,
              RECIPIENT_DATA.network,
              RECIPIENT_DATA.networkFee,
            ]}
          />
        </section>

        <DepositDeviceSection />
      </>
    );
  }

  if (v === "tv") {
    return (
      <>
        <section className="mt-6">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Transaction Details
          </h2>
          <TxDataBlockTable
            headers={[
              "Transaction ID",
              "Customer Names",
              "Channnel",
              "Type",
              "Product",
              "Plan",
            ]}
            row={[
              <TransactionIdLink key="txid" id={TX_DATA.transactionId} />,
              TX_DATA.customerName,
              "Utility",
              "TV",
              "DSTV",
              "DSTV Compact plus",
            ]}
          />
          <TxDataBlockTable
            className="mt-6"
            headers={["Timestamp", "Amount", "Fee", "Provider", "Balance After"]}
            row={[
              <TimeStampCell key="ts" value={TX_TIMESTAMP} />,
              "₦20,000.00",
              "₦30.00",
              "Ringo",
              "₦30,000.00",
            ]}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Recipient Details
          </h2>
          <TxDataBlockTable
            headers={["Smartcard No", "Account Name"]}
            row={[RECIPIENT_TV.smartcardNo, RECIPIENT_TV.accountName]}
          />
        </section>

        <DepositDeviceSection />
      </>
    );
  }

  if (v === "utility_electricity") {
    return (
      <>
        <section className="mt-6">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Transaction Details
          </h2>
          <TxDataBlockTable
            headers={[
              "Transaction ID",
              "Customer Names",
              "Channel",
              "Type",
              "Product",
              "Amount",
            ]}
            row={[
              <TransactionIdLink key="txid" id={TX_DATA.transactionId} />,
              TX_DATA.customerName,
              "Utility",
              "Electricity",
              "EKEDC",
              "₦30,000.00",
            ]}
          />
          <TxDataBlockTable
            className="mt-6"
            headers={["Timestamp", "Fee", "Provider", "Balance after"]}
            row={[
              <TimeStampCell key="ts" value={TX_TIMESTAMP} />,
              "₦30.00",
              "Ringo",
              "₦30,000.00",
            ]}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Recipient Details
          </h2>
          <TxDataBlockTable
            headers={["Address", "Meter Number", "Account Name"]}
            row={[
              RECIPIENT_UTILITY_ELECTRICITY.address,
              RECIPIENT_UTILITY_ELECTRICITY.meterNumber,
              RECIPIENT_UTILITY_ELECTRICITY.accountName,
            ]}
          />
        </section>

        <DepositDeviceSection />
      </>
    );
  }

  /* utility_betting */
  return (
    <>
      <section className="mt-6">
        <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
          Transaction Details
        </h2>
        <TxDataBlockTable
          headers={[
            "Transaction ID",
            "Customer Names",
            "Channel",
            "Type",
            "Product",
            "Amount",
          ]}
          row={[
            <TransactionIdLink key="txid" id={TX_DATA.transactionId} />,
            TX_DATA.customerName,
            "Utility",
            "Betting",
            "Sporty bet",
            "₦30,000.00",
          ]}
        />
        <TxDataBlockTable
          className="mt-6"
          headers={["Timestamp", "Fee", "Provider", "Balance After"]}
          row={[
            <TimeStampCell key="ts" value={TX_TIMESTAMP} />,
            "₦30.00",
            "Ringo",
            "₦30,000.00",
          ]}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
          Recipient Details
        </h2>
        <TxDataBlockTable
          headers={["Betting ID", "Account Name"]}
          row={[RECIPIENT_UTILITY_BETTING.bettingId, RECIPIENT_UTILITY_BETTING.accountName]}
        />
      </section>

      <DepositDeviceSection />
    </>
  );
}

/* ── Transaction Details Tab ── */
function TransactionDetailsTab() {
  const isGiftcard = TX_DATA.channel === "Giftcard";

  if (isGiftcard) {
    const countryParts = TX_DATA.country.split(" | ");
    const countryLeft = countryParts[0] ?? "";
    const countryRest = countryParts.length > 1 ? ` | ${countryParts.slice(1).join(" | ")}` : "";
    const du = TX_DATA.dateUploaded.split(" | ");
    const dc = TX_DATA.dateCompleted.split(" | ");

    return (
      <>
        <section className="mt-6">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Transaction Details
          </h2>
          <TxDataBlockTable
            headers={[
              "Session ID",
              "Customer Names",
              "Channel",
              "Type",
              "Country",
              "Amount",
            ]}
            row={[
              <Link
                key="tid"
                href="#"
                className="underline underline-offset-2 hover:opacity-80"
                style={{ color: LINK }}
                onClick={(e) => e.preventDefault()}
              >
                {TX_DATA.sessionId}
              </Link>,
              TX_DATA.customerName,
              "Giftcard",
              TX_DATA.typeGift,
              <span key="co" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{countryLeft}</span>
                {countryRest}
              </span>,
              TX_DATA.amount,
            ]}
          />
          <TxDataBlockTable
            className="mt-6"
            headers={[
              "Amount Paid out",
              "Date Uploaded",
              "Date Completed",
              "Rate / Fee Given",
              "Balance after",
              "Ops in charge",
            ]}
            row={[
              TX_DATA.amountPaidOut,
              <span key="du" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{du[0]}</span>
                {du.length > 1 ? ` | ${du.slice(1).join(" | ")}` : ""}
              </span>,
              <span key="dc" className="text-sm" style={{ color: TEXT }}>
                <span style={{ color: LINK }}>{dc[0]}</span>
                {dc.length > 1 ? ` | ${dc.slice(1).join(" | ")}` : ""}
              </span>,
              TX_DATA.rateFeeGiven,
              TX_DATA.balanceAfterGift,
              TX_DATA.opsInCharge,
            ]}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Device Information
          </h2>
          <TxDataBlockTable
            headers={["Device", "Device ID", "Location", "Location Coordinate"]}
            row={[
              DEVICE_DATA_GIFT.device,
              DEVICE_DATA_GIFT.deviceId,
              DEVICE_DATA_GIFT.location,
              DEVICE_DATA_GIFT.locationCoordinate,
            ]}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Rejection Attachment
          </h2>
          <GiftcardImagePlaceholder />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Physical Card Image
          </h2>
          <GiftcardImagePlaceholder />
        </section>
      </>
    );
  }

  return <DepositTransactionDetailsContent />;
}

function TxDataBlockTable({
  headers,
  row,
  className = "",
  collapseTopBorder = false,
}: {
  headers: string[];
  row: ReactNode[];
  className?: string;
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

/* ── Transaction Log Tab ── */
const LOG_ENTRIES = [
  { step: 1, title: "Ralph Edwards Initiated the Transaction", date: "Jan 6, 2026 | 9:32AM" },
  { step: 2, title: "System verifying Giftcard", date: "Jan 6, 2026 | 9:32AM" },
  { step: 3, title: "Giftcard verified by system and approved manually by Ezekiel Olajolo", date: "Jan 6, 2026 | 9:32AM" },
  { step: 4, title: "Funds sent to customers wallet", date: "Jan 6, 2026 | 9:32AM" },
  { step: 5, title: "Transaction Completed", date: "Jan 6, 2026 | 9:32AM" },
];

function TransactionLogTab() {
  return (
    <section className="mt-6 rounded-xl border border-outline bg-white px-6 py-8">
      <div className="relative">
        {LOG_ENTRIES.map((entry, idx) => {
          const isLast = idx === LOG_ENTRIES.length - 1;
          return (
            <div key={entry.step} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-green text-xs font-bold text-primary-text">
                  {entry.step}
                </span>
                {!isLast && <div className="w-px flex-1 bg-zinc-200" />}
              </div>

              <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                <p className="text-sm font-semibold leading-8 text-primary-text">{entry.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{entry.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RejectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-[17px] font-bold text-brand-navy">Reject Giftcard</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg leading-none text-primary-text transition-colors hover:bg-zinc-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Reason for Rejection</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="" disabled>
                  Select reason
                </option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 5l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Additional Details</label>
            <textarea
              className="min-h-[100px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Text"
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50/80"
            >
              <DocumentUpload size={28} variant="Outline" color="currentColor" />
              <span className="font-medium">Upload Image</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            Reject
          </button>
        </form>
      </div>
    </div>
  );
}
