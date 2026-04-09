"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, CloseCircle } from "iconsax-react";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";

/* ── Types ── */
type TxApprovalStatus = "Approved" | "Pending";

/* ── Mock data ── */
const TX_DATA = {
  sessionId: "12324235334262526",
  customerName: "Naomi Selisu",
  channel: "Giftcard",
  type: "Ecode",
  code: "14292920204637",
  country: "United States | USD",
  amount: "$1,000.00",
  amountPaidOut: "₦ 1,000,000.00",
  dateUploaded: "Jan 6, 2026 | 9:32AM",
  dateCompleted: "Jan 6, 2026 | 9:32AM",
  rateFeeGiven: "1046/$1",
  provider: "Quidex",
};

const DEVICE_DATA = {
  device: "Iphone 15pro",
  deviceId: "c83738d83yedhd",
  location: "Ijebu Igbo, Ogun State",
  locationCoordinate: "Lat: 40748944",
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
  const [approvalStatus, setApprovalStatus] = useState<TxApprovalStatus>("Pending");

  /* Modal states */
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
    setApprovalStatus("Approved");
    setShowSuccessModal(true);
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
  };

  return (
    <div className="relative pb-28">
      {/* Breadcrumb + Action */}
      <div className="h-[66px] mb-6 flex items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/transactions" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Transactions
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Transaction Details</span>
        </div>

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Status Banner */}
      <StatusBanner status={approvalStatus} />

      {/* Tabs */}
      <div className="mt-6">
        <UnderlineTabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => setActiveTab(id as DetailTab)}
        />
      </div>

      {/* Tab content */}
      {activeTab === "Transaction Details" && (
        <TransactionDetailsTab isPending={approvalStatus === "Pending"} />
      )}
      {activeTab === "Transaction Log" && <TransactionLogTab />}

      {/* Action bar for Pending */}
      {approvalStatus === "Pending" && (
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

      {/* ── Modals ── */}

      {/* Reject Giftcard modal */}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onSubmit={handleRejectSubmit}
        />
      )}

      {/* Approve confirmation modal */}
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

      {/* Success modal */}
      {showSuccessModal && (
        <SuccessModal
          message="Giftcard transaction has been successfully approved"
          confirmLabel="Done"
          onContinue={handleSuccessDone}
        />
      )}
    </div>
  );
}

/* ── Status Banner ── */
function StatusBanner({ status }: { status: TxApprovalStatus }) {
  const isApproved = status === "Approved";
  return (
    <div
      className={`flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
        isApproved
          ? "border border-green-200 bg-green-50 text-green-700"
          : "border border-orange-200 bg-orange-50 text-orange-600"
      }`}
    >
      {isApproved ? "Approved!" : "Pending Approval !"}
    </div>
  );
}

/* ── Transaction Details Tab ── */
function TransactionDetailsTab({ isPending }: { isPending: boolean }) {
  return (
    <>
      {/* Transaction Details table */}
      <section className="mt-6">
        <h2 className="text-[18px] font-semibold text-primary-text">Transaction Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Session ID</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Customer Names</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Channel</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Type</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Code</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Country</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline font-medium text-secondary-green underline underline-offset-2">
                  {TX_DATA.sessionId}
                </td>
                <td className="px-4 py-5 border-r border-outline text-primary-text">{TX_DATA.customerName}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{TX_DATA.channel}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{TX_DATA.type}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{TX_DATA.code}</td>
                <td className="px-4 py-5 text-zinc-500">{TX_DATA.country}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Financial Details table */}
      <section className="mt-8">
        <div className="overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Amount</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Amount Paid out</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date Uploaded</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date Completed</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Rate / Fee Given</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Provider</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline text-primary-text font-medium">{TX_DATA.amount}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{TX_DATA.amountPaidOut}</td>
                <td className="px-4 py-5 border-r border-outline whitespace-nowrap text-zinc-500">{TX_DATA.dateUploaded}</td>
                <td className="px-4 py-5 border-r border-outline whitespace-nowrap text-zinc-500">{TX_DATA.dateCompleted}</td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{TX_DATA.rateFeeGiven}</td>
                <td className="px-4 py-5 text-zinc-500">{TX_DATA.provider}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Device Information */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-primary-text">Device Information</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Device</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Device ID</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Location</th>
                {!isPending && (
                  <th className="border-b border-outline px-4 py-3 font-medium">Location Coordinate</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-5 border-r border-outline text-primary-text font-medium underline underline-offset-2">
                  {DEVICE_DATA.device}
                </td>
                <td className="px-4 py-5 border-r border-outline text-zinc-500">{DEVICE_DATA.deviceId}</td>
                <td className={`px-4 py-5 text-zinc-500 ${!isPending ? "border-r border-outline" : ""}`}>
                  {DEVICE_DATA.location}
                </td>
                {!isPending && (
                  <td className="px-4 py-5 text-zinc-500">{DEVICE_DATA.locationCoordinate}</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
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
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-green text-xs font-bold text-primary-text">
                  {entry.step}
                </span>
                {!isLast && (
                  <div className="w-px flex-1 bg-zinc-200" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                <p className="text-sm font-semibold text-primary-text leading-8">{entry.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{entry.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Reject Modal ── */
function RejectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl mx-4">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Reject Giftcard</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {/* Reason for Rejection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Reason for Rejection</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="" disabled>Select reason</option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>

          {/* Input Label (note) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Input Label</label>
            <textarea
              className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Text"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            Reject
          </button>
        </form>
      </div>
    </div>
  );
}
