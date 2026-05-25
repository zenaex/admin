"use client";

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, DocumentUpload, DocumentDownload } from "iconsax-react";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { GiftcardTransactionDetails } from "@/components/transactions/transaction-details/giftcard-details";
import type { TxApprovalStatus } from "@/components/transactions/transaction-details/types";
import { TxDataBlockTable, TEXT, LINK } from "@/components/transactions/transaction-details/tx-data-block-table";
import {
  extractTransactionLogEntries,
  mapApiDetailToTransactionModel,
  type TransactionLogEntry,
} from "@/lib/admin-api/transaction-detail-mapper";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  postGiftcardSubmissionApprove,
  postGiftcardSubmissionDecline,
  postGiftcardSubmissionECode,
} from "@/lib/admin-api/giftcard-submissions-api";
import { getAdminTransactionDetail, getAdminTransactionLogs } from "@/lib/admin-api/transactions-api";
import { isLikelySuperAdminFromToken } from "@/lib/auth/jwt";
import { getAccessToken } from "@/lib/auth/token-storage";
import type {
  CryptoDetailVariant,
  EsimTransactionOutcome,
  TransactionDetailModel,
  UtilityDetailVariant,
} from "@/components/transactions/transaction-detail-model";

/* Tab config */
type DetailTab = "Transaction Details" | "Transaction Log";
const TABS: DetailTab[] = ["Transaction Details", "Transaction Log"];

/* ?????? Rejection reasons ?????? */
const REJECTION_REASONS = [
  "Invalid card",
  "Expired card",
  "Fraud suspected",
  "Incorrect amount",
  "Duplicate transaction",
  "Other",
];

/* ?????? Main view ?????? */
type TransactionDetailsViewProps = {
  id?: string;
};

function initialApprovalFor(tx: TransactionDetailModel): TxApprovalStatus {
  return tx.channel === "Giftcard" ? tx.giftcardInitialStatus : "Approved";
}

/**
 * The route page passes `key={id}` so this component remounts when the route id changes;
 * that lets state initializers handle per-transaction resets without effects.
 */
export function TransactionDetailsView({ id }: TransactionDetailsViewProps) {
  const reference = id?.trim() ?? "";

  const [tx, setTx] = useState<TransactionDetailModel | null>(null);
  const [logEntries, setLogEntries] = useState<TransactionLogEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(reference));
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<DetailTab>("Transaction Details");
  const [approvalStatus, setApprovalStatus] = useState<TxApprovalStatus>("Pending");
  const [actionOpen, setActionOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [eCodeLoading, setECodeLoading] = useState(false);
  const [eCodeError, setECodeError] = useState<string | null>(null);

  const canRevealECode = isLikelySuperAdminFromToken(getAccessToken());

  const loadDetail = useCallback(async () => {
    if (!reference) {
      setError("Missing transaction reference.");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [raw, logs] = await Promise.all([
        getAdminTransactionDetail(reference),
        getAdminTransactionLogs(reference).catch(() => [] as TransactionLogEntry[]),
      ]);
      const mapped = mapApiDetailToTransactionModel(raw, reference);
      setTx(mapped);
      setLogEntries(logs.length > 0 ? logs : extractTransactionLogEntries(raw));
      setApprovalStatus(initialApprovalFor(mapped));
    } catch (e) {
      setTx(null);
      setLogEntries([]);
      setError(e instanceof AdminApiError ? e.message : "Could not load transaction.");
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const isGiftcard = tx?.channel === "Giftcard";

  const giftcardCodeDisplay =
    revealedCode ??
    (tx?.code ? tx.code : canRevealECode && isGiftcard ? "••••••" : tx?.code ?? "");

  const requireGiftcardSubmissionId = (): string | null => {
    const id = tx?.giftcardSubmissionId?.trim();
    if (!id) {
      setActionError("Missing submission ID for this giftcard transaction.");
      return null;
    }
    return id;
  };

  const handleApproveConfirm = async () => {
    const submissionId = requireGiftcardSubmissionId();
    if (!submissionId) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await postGiftcardSubmissionApprove(submissionId);
      setShowApproveConfirm(false);
      await loadDetail();
      setShowSuccessModal(true);
    } catch (e) {
      setActionError(e instanceof AdminApiError ? e.message : "Could not approve submission.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    const submissionId = requireGiftcardSubmissionId();
    if (!submissionId) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await postGiftcardSubmissionDecline(submissionId, { reason });
      setShowRejectModal(false);
      await loadDetail();
      setShowSuccessModal(true);
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : "Could not decline submission.";
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevealECode = async () => {
    const submissionId = requireGiftcardSubmissionId();
    if (!submissionId) return;
    setECodeError(null);
    setECodeLoading(true);
    try {
      const { code } = await postGiftcardSubmissionECode(submissionId);
      setRevealedCode(code);
    } catch (e) {
      setECodeError(
        e instanceof AdminApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load e-code.",
      );
    } finally {
      setECodeLoading(false);
    }
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setActionOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-primary-text shadow-sm hover:bg-surface-subtle"
            aria-expanded={actionOpen}
            aria-label="Action"
          >
            Action
            <ArrowDown2 size={14} variant="Outline" color="currentColor" />
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

      {loading ? (
        <p className="text-sm text-zinc-500">Loading transaction?</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void loadDetail()}>
            Retry
          </button>{" "}
          <Link href="/dashboard/transactions" className="font-semibold underline">
            Back to list
          </Link>
        </div>
      ) : tx ? (
        <>
      {tx.hasMappedStatus ? (
        <StatusBanner
          {...(tx.channel === "Giftcard"
            ? { variant: "giftcard" as const, status: approvalStatus }
            : tx.channel === "Esim"
              ? { variant: "esim" as const, outcome: tx.esimOutcome }
              : { variant: "default" as const, outcome: tx.defaultOutcome })}
        />
      ) : null}

      <div className="mt-6">
        <UnderlineTabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => setActiveTab(id as DetailTab)}
        />
      </div>

      {activeTab === "Transaction Details" && (
        <TransactionDetailsTab
          approvalStatus={approvalStatus}
          tx={tx}
          giftcardCodeDisplay={giftcardCodeDisplay}
          canRevealECode={canRevealECode}
          onRevealECode={isGiftcard ? () => void handleRevealECode() : undefined}
          eCodeLoading={eCodeLoading}
          eCodeError={eCodeError}
        />
      )}
      {activeTab === "Transaction Log" && <TransactionLogTab entries={logEntries} />}

      {actionError && isGiftcard ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      {isGiftcard && approvalStatus === "Pending" && (
        <div className="sticky bottom-0 z-40 -mx-8 mt-8 flex items-center justify-center gap-4 border-t border-zinc-100 bg-white px-6 py-5">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => {
              setActionError(null);
              setShowRejectModal(true);
            }}
            className="h-12 min-w-[160px] rounded-full border border-zinc-200 bg-white px-8 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            No, Reject
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => {
              setActionError(null);
              setShowApproveConfirm(true);
            }}
            className="h-12 min-w-[180px] rounded-full bg-primary-green px-8 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Yes, Approve
          </button>
        </div>
      )}

      {showRejectModal && (
        <RejectModal
          onClose={() => {
            if (!actionLoading) setShowRejectModal(false);
          }}
          onSubmit={handleRejectSubmit}
          loading={actionLoading}
          error={actionError}
        />
      )}

      {showApproveConfirm && (
        <ConfirmModal
          title="Approve"
          message="Are you sure you want to approve this giftcard transaction?"
          confirmLabel={actionLoading ? "Approving…" : "Approve"}
          cancelLabel="Cancel"
          variant="approve"
          onConfirm={() => void handleApproveConfirm()}
          onCancel={() => {
            if (!actionLoading) setShowApproveConfirm(false);
          }}
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
        </>
      ) : null}
    </div>
  );
}

type StatusBannerProps =
  | { variant: "giftcard"; status: TxApprovalStatus }
  | { variant: "esim"; outcome: EsimTransactionOutcome }
  | { variant: "default"; outcome: EsimTransactionOutcome };

function OutcomeStatusBanner({ outcome }: { outcome: EsimTransactionOutcome }) {
  if (outcome === "Failed") {
    return (
      <div className="flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        <strong>Failed!</strong>
      </div>
    );
  }
  if (outcome === "Pending") {
    return (
      <div className="flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
        <strong>Pending!</strong>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-[#166534]">
      Approved!
    </div>
  );
}

function StatusBanner(props: StatusBannerProps) {
  if (props.variant === "esim" || props.variant === "default") {
    return <OutcomeStatusBanner outcome={props.outcome} />;
  }
  const { status } = props;
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
      {isApproved ? "Approved!" : "Pending Approval!"}
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

function CryptoCurrencyCell({ value }: { value: string }) {
  if (value.includes(" to ")) {
    const [left, right] = value.split(" to ");
    return (
      <span className="text-sm" style={{ color: TEXT }}>
        <span style={{ color: LINK }}>{left}</span>
        {" to "}
        <span style={{ color: LINK }}>{right}</span>
      </span>
    );
  }
  const currencyParts = value.split(" | ");
  const c0 = currencyParts[0] ?? "";
  const cRest = currencyParts.length > 1 ? ` | ${currencyParts.slice(1).join(" | ")}` : "";
  return (
    <span className="text-sm" style={{ color: TEXT }}>
      <span style={{ color: LINK }}>{c0}</span>
      {cRest}
    </span>
  );
}

function DepositDeviceSection({ tx }: { tx: TransactionDetailModel }) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
        Device Information
      </h2>
      <TxDataBlockTable
        headers={["Device", "Device ID", "Location", "Location Coordinate"]}
        row={[tx.device, tx.deviceId, tx.location, tx.locationCoordinate]}
      />
    </section>
  );
}

function WalletAddressCell({ address }: { address: string }) {
  if (!address.trim()) {
    return <span className="text-sm" style={{ color: TEXT }} />;
  }
  return (
    <Link
      href="#"
      className="underline underline-offset-2 hover:opacity-80"
      style={{ color: LINK }}
      onClick={(e) => e.preventDefault()}
    >
      {address}
    </Link>
  );
}

function utilityTypeLabel(variant: UtilityDetailVariant): string {
  switch (variant) {
    case "electricity":
      return "Electricity";
    case "data":
      return "Data";
    case "tv":
      return "TV";
  }
}

function cryptoTypeLabel(variant: CryptoDetailVariant): string {
  switch (variant) {
    case "buy":
      return "Buy Crypto";
    case "swap":
      return "Swap Crypto";
    case "sell_deposit":
      return "Sell Deposit";
  }
}

function CryptoTransactionDetailsContent({ tx }: { tx: TransactionDetailModel }) {
  const variant = tx.cryptoDetailVariant;
  const initiatedParts = tx.datedInitiated.split(" | ");
  const completedParts = tx.dateCompleted.split(" | ");
  const dateInitiatedCell = (
    <span key="di" className="text-sm" style={{ color: TEXT }}>
      <span style={{ color: LINK }}>{initiatedParts[0]}</span>
      {initiatedParts.length > 1 ? ` | ${initiatedParts.slice(1).join(" | ")}` : ""}
    </span>
  );
  const dateCompletedCell = (
    <span key="dc" className="text-sm" style={{ color: TEXT }}>
      <span style={{ color: LINK }}>{completedParts[0]}</span>
      {completedParts.length > 1 ? ` | ${completedParts.slice(1).join(" | ")}` : ""}
    </span>
  );
  const walletLink = <WalletAddressCell key="w" address={tx.walletAddress} />;

  const customerHeader = variant === "swap" ? "Customer" : "Customer Names";
  const channelLabel = tx.channel === "Deposit" || tx.channel === "Crypto" ? tx.channel : "Crypto";

  const row1 =
    variant === "swap"
      ? {
          headers: ["Transaction ID", customerHeader, "Channel", "Type", "Currency", "Amount Sent"] as const,
          row: [
            <TransactionIdLink key="txid" id={tx.transactionId} />,
            tx.customerName,
            channelLabel,
            cryptoTypeLabel(variant),
            <CryptoCurrencyCell key="cur" value={tx.currency} />,
            tx.amountSent,
          ] as ReactNode[],
        }
      : {
          headers: ["Transaction ID", customerHeader, "Channel", "Type", "Currency", "Amount (USD)"] as const,
          row: [
            <TransactionIdLink key="txid" id={tx.transactionId} />,
            tx.customerName,
            channelLabel,
            cryptoTypeLabel(variant),
            <CryptoCurrencyCell key="cur" value={tx.currency} />,
            tx.amountUsd,
          ] as ReactNode[],
        };

  const row2 = {
    headers: ["Amount Equivalent", "Date Initiated", "Date Completed", "Rate Given", "Provider", "Our Fee"] as const,
    row: [
      tx.amountEquivalent,
      dateInitiatedCell,
      dateCompletedCell,
      tx.rateGiven,
      tx.provider,
      tx.ourFee,
    ] as ReactNode[],
  };

  const recipient =
    variant === "swap"
      ? {
          headers: ["Wallet Address", "Network", "Coin Received", "Network Fee"] as const,
          row: [walletLink, tx.network, tx.coinReceived, tx.networkFee] as ReactNode[],
        }
      : {
          headers: ["Wallet Address", "Network", "Network Fee"] as const,
          row: [walletLink, tx.network, tx.networkFee] as ReactNode[],
        };

  return (
    <>
      <section className="mt-6">
        <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
          Transaction Details
        </h2>
        <TxDataBlockTable headers={[...row1.headers]} row={row1.row} />
        <TxDataBlockTable className="mt-6" headers={[...row2.headers]} row={row2.row} />
        {variant !== "swap" ? (
          <TxDataBlockTable className="mt-6" headers={["Balance After"]} row={[tx.balanceAfter]} />
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
          Recipient Details
        </h2>
        <TxDataBlockTable headers={[...recipient.headers]} row={recipient.row} />
      </section>

      <DepositDeviceSection tx={tx} />
    </>
  );
}

function EsimTransactionDetailsContent({ tx }: { tx: TransactionDetailModel }) {
  const timestamp = tx.datedInitiated;

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
            "Coverage",
            "Data Allowance",
            "Validity",
          ]}
          row={[
            <TransactionIdLink key="txid" id={tx.transactionId} />,
            tx.customerName,
            tx.esimChannelLabel,
            tx.esimCoverage,
            tx.esimDataAllowance,
            tx.esimValidity,
          ]}
        />
        <TxDataBlockTable
          className="mt-6"
          headers={["Validity", "Price (USD)", "Price (NGN)", "Provider", "Timestamp", "Balance After"]}
          row={[
            tx.esimValidity,
            tx.esimPriceUsd,
            tx.esimPriceNgn,
            tx.esimProvider,
            <TimeStampCell key="ts" value={timestamp} />,
            tx.esimBalanceAfter,
          ]}
        />
      </section>

      <DepositDeviceSection tx={tx} />
    </>
  );
}

function WithdrawalTransactionDetailsContent({ tx }: { tx: TransactionDetailModel }) {
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
            "Amount",
            "Fee",
            "Bank",
          ]}
          row={[
            <TransactionIdLink key="txid" id={tx.transactionId} />,
            tx.customerName,
            "Withdrawal",
            tx.withdrawalAmount,
            tx.withdrawalFee,
            tx.withdrawalBankName,
          ]}
        />
        <TxDataBlockTable
          className="mt-6"
          headers={["Account Name", "Account Number", "Timestamp", "Balance After"]}
          row={[
            tx.withdrawalAccountName,
            tx.withdrawalAccountNumber,
            <TimeStampCell key="ts" value={tx.withdrawalTimestamp} />,
            tx.withdrawalBalanceAfter,
          ]}
        />
      </section>
      <DepositDeviceSection tx={tx} />
    </>
  );
}

function EtradeTransactionDetailsContent({ tx }: { tx: TransactionDetailModel }) {
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
            "Asset",
            "Side",
            "Quantity",
          ]}
          row={[
            <TransactionIdLink key="txid" id={tx.transactionId} />,
            tx.customerName,
            "E-trade",
            tx.etradeSymbol,
            tx.etradeSide,
            tx.etradeQuantity,
          ]}
        />
        <TxDataBlockTable
          className="mt-6"
          headers={["Amount (NGN)", "Fee", "Timestamp", "Balance After"]}
          row={[
            tx.etradeAmountNgn,
            tx.etradeFee,
            <TimeStampCell key="ts" value={tx.etradeTimestamp} />,
            tx.etradeBalanceAfter,
          ]}
        />
      </section>
      <DepositDeviceSection tx={tx} />
    </>
  );
}

function DepositTransactionDetailsContent({ tx }: { tx: TransactionDetailModel }) {
  const v = tx.depositDetailVariant;

  if (v === "crypto") {
    return <CryptoTransactionDetailsContent tx={tx} />;
  }

  if (v === "utility") {
    const u = tx.utilityDetailVariant;
    const timestamp = tx.datedInitiated;
    const typeLabel = utilityTypeLabel(u);

    if (u === "electricity") {
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
                <TransactionIdLink key="txid" id={tx.transactionId} />,
                tx.customerName,
                "Utility",
                typeLabel,
                tx.product,
                tx.amount,
              ]}
            />
            <TxDataBlockTable
              className="mt-6"
              headers={["Timestamp", "Fee", "Provider", "Balance after"]}
              row={[
                <TimeStampCell key="ts" value={timestamp} />,
                tx.ourFee,
                tx.provider,
                tx.balanceAfter,
              ]}
            />
          </section>

          <section className="mt-8">
            <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
              Recipient Details
            </h2>
            <TxDataBlockTable
              headers={["Address", "Meter Number", "Account Name"]}
              row={[tx.address, tx.meterNumber, tx.accountName]}
            />
          </section>

          <DepositDeviceSection tx={tx} />
        </>
      );
    }

    if (u === "data") {
      return (
        <>
          <section className="mt-6">
            <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
              Transaction Details
            </h2>
            <TxDataBlockTable
              headers={["Transaction ID", "Customer", "Channel", "Type", "Product", "Amount"]}
              row={[
                <TransactionIdLink key="txid" id={tx.transactionId} />,
                tx.customerName,
                "Utility",
                typeLabel,
                tx.product,
                tx.amount,
              ]}
            />
            <TxDataBlockTable
              className="mt-6"
              headers={["Plan", "Timestamp", "Fee", "Cashback", "Provider", "Balance After"]}
              row={[
                tx.plan,
                <TimeStampCell key="ts" value={timestamp} />,
                tx.ourFee,
                tx.cashback,
                tx.provider,
                tx.balanceAfter,
              ]}
            />
          </section>

          <section className="mt-8">
            <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
              Recipient Details
            </h2>
            <TxDataBlockTable headers={["Phone Number"]} row={[tx.phoneNumber]} />
          </section>

          <DepositDeviceSection tx={tx} />
        </>
      );
    }

    /* tv */
    return (
      <>
        <section className="mt-6">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Transaction Details
          </h2>
          <TxDataBlockTable
            headers={["Transaction ID", "Customer", "Channel", "Type", "Product", "Plan"]}
            row={[
              <TransactionIdLink key="txid" id={tx.transactionId} />,
              tx.customerName,
              "Utility",
              typeLabel,
              tx.product,
              tx.plan,
            ]}
          />
          <TxDataBlockTable
            className="mt-6"
            headers={["Timestamp", "Amount", "Fee", "Provider", "Balance After"]}
            row={[
              <TimeStampCell key="ts" value={timestamp} />,
              tx.amount,
              tx.ourFee,
              tx.provider,
              tx.balanceAfter,
            ]}
          />
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Recipient Details
          </h2>
          <TxDataBlockTable
            headers={["Smartcard No", "Account Name"]}
            row={[tx.smartcardNo, tx.accountName]}
          />
        </section>

        <DepositDeviceSection tx={tx} />
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
            <TransactionIdLink key="txid" id={tx.transactionId} />,
            tx.customerName,
            "Utility",
            "Betting",
            tx.product,
            tx.amount,
          ]}
        />
        <TxDataBlockTable
          className="mt-6"
          headers={["Timestamp", "Fee", "Provider", "Balance After"]}
          row={[
            <TimeStampCell key="ts" value={tx.datedInitiated} />,
            tx.ourFee,
            tx.provider,
            tx.balanceAfter,
          ]}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
          Recipient Details
        </h2>
        <TxDataBlockTable
          headers={["Betting ID", "Account Name"]}
          row={[tx.bettingId, tx.accountName]}
        />
      </section>

      <DepositDeviceSection tx={tx} />
    </>
  );
}

/* ?????? Transaction Details Tab ?????? */
function TransactionDetailsTab({
  approvalStatus,
  tx,
  giftcardCodeDisplay,
  canRevealECode,
  onRevealECode,
  eCodeLoading,
  eCodeError,
}: {
  approvalStatus: TxApprovalStatus;
  tx: TransactionDetailModel;
  giftcardCodeDisplay: string;
  canRevealECode: boolean;
  onRevealECode?: () => void;
  eCodeLoading: boolean;
  eCodeError: string | null;
}) {
  switch (tx.channel) {
    case "Esim":
      return <EsimTransactionDetailsContent tx={tx} />;
    case "Giftcard":
      return (
        <GiftcardTransactionDetails
          approvalStatus={approvalStatus}
          model={{
            sessionId: tx.sessionId,
            customerName: tx.customerName,
            typeLabel: tx.giftcardType,
            code: tx.code,
            country: tx.country,
            amount: tx.amount,
            amountPaidOut: tx.amountPaidOut,
            dateUploaded: tx.dateUploaded,
            dateCompleted: tx.dateCompleted,
            rateFeeGiven: tx.rateFeeGiven,
            balanceAfterGift: tx.balanceAfterGift,
            opsInCharge: tx.opsInCharge,
            provider: tx.giftcardProvider,
          }}
          device={{
            device: tx.device,
            deviceId: tx.deviceId,
            location: tx.location,
            locationCoordinate: tx.locationCoordinate,
          }}
          rejectionMessage={tx.rejectionMessage}
          codeDisplay={giftcardCodeDisplay}
          canRevealECode={canRevealECode}
          onRevealECode={onRevealECode}
          eCodeLoading={eCodeLoading}
          eCodeError={eCodeError}
        />
      );
    case "Withdrawal":
      return <WithdrawalTransactionDetailsContent tx={tx} />;
    case "E-trade":
      return <EtradeTransactionDetailsContent tx={tx} />;
    default:
      return <DepositTransactionDetailsContent tx={tx} />;
  }
}

/* ?????? Transaction Log Tab ?????? */
function TransactionLogTab({ entries }: { entries: TransactionLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="mt-6 rounded-xl border border-outline bg-white px-6 py-8">
        <p className="text-sm text-zinc-500">No log entries for this transaction.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-outline bg-white px-6 py-8">
      <div className="relative">
        {entries.map((entry, idx) => {
          const isLast = idx === entries.length - 1;
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

function RejectModal({
  onClose,
  onSubmit,
  loading = false,
  error = null,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildReason = () => {
    const base = reason.trim();
    const extra = note.trim();
    if (!base) return "";
    if (extra) return `${base} — ${extra}`;
    return base;
  };

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
            ??
          </button>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const payload = buildReason();
            if (!payload) return;
            void onSubmit(payload);
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
              disabled
            />
            <div
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-400"
              aria-disabled
            >
              <DocumentUpload size={24} variant="Outline" color="currentColor" />
              <span className="font-medium">Upload Image</span>
              <span className="text-center text-xs">Not supported yet — decline sends reason only.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !reason.trim()}
            className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </form>
      </div>
    </div>
  );
}
