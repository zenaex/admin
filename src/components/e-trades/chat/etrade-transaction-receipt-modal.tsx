"use client";

import { CloseCircle } from "iconsax-react";

type EtradeTransactionReceiptModalProps = {
  open: boolean;
  onClose: () => void;
  onEndTrade: () => void;
};

export function EtradeTransactionReceiptModal({
  open,
  onClose,
  onEndTrade,
}: EtradeTransactionReceiptModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="etrade-receipt-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white px-6 pb-8 pt-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="etrade-receipt-title" className="text-lg font-bold text-primary-text">
            Transaction Receipt
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        <div className="space-y-3">
          <ReadOnlyField label="Session ID" value="ETrade-8778908" />
          <ReadOnlyField label="Date" value="Jan 6, 2026" />
          <ReadOnlyField label="Trade Amount" value="$10,000.00 = ₦10,460,000.00" />
          <ReadOnlyField label="Rate / Fee Given" value="1046/51" />

          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500">Customer Name</label>
            <input
              type="text"
              readOnly
              defaultValue="Naomi Salisu"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-primary-text outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500">Type</label>
            <input
              type="text"
              readOnly
              defaultValue="Request for BOA"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-primary-text outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-500">Country</label>
            <input
              type="text"
              readOnly
              defaultValue="United States | USD"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-primary-text outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onEndTrade}
          className="mt-8 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          End Trade
        </button>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-zinc-500">{label}</p>
      <div className="rounded-lg bg-zinc-100 px-3 py-2.5 text-sm text-primary-text">{value}</div>
    </div>
  );
}
