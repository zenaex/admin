"use client";

import { useState } from "react";
import { CloseCircle } from "iconsax-react";
import { SuccessModal } from "@/components/provider/provider-modals";
import { AdminApiError } from "@/lib/admin-api/client";
import { postUploadRateSheet } from "@/lib/admin-api/exchange-rates-api";

type GiftcardRateSheetUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function GiftcardRateSheetUploadModal({ open, onClose, onSuccess }: GiftcardRateSheetUploadModalProps) {
  const [csvUrl, setCsvUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCsvUrl("");
    setError(null);
    setLoading(false);
    setShowSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUpload = async () => {
    const url = csvUrl.trim();
    if (!url) {
      setError("Enter a publicly accessible CSV URL.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await postUploadRateSheet({ csvUrl: url });
      setShowSuccess(true);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <SuccessModal
        message="Gift card rate sheet submitted successfully."
        confirmLabel="Done"
        onContinue={() => {
          onSuccess?.();
          handleClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white px-6 pb-6 pt-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Add Rate Sheet</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        <p className="mb-4 text-sm text-zinc-500">
          Provide a public CSV URL. The wallet service downloads and processes the file from that link.
        </p>

        <label className="mb-1.5 block text-sm font-medium text-primary-text" htmlFor="rate-sheet-csv-url">
          CSV URL
        </label>
        <input
          id="rate-sheet-csv-url"
          type="url"
          value={csvUrl}
          onChange={(e) => setCsvUrl(e.target.value)}
          placeholder="https://storage.example.com/rates/giftcard-2026-06.csv"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
        />

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="flex-1 rounded-full border border-zinc-200 bg-white py-3 text-sm font-semibold text-primary-text hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !csvUrl.trim()}
            onClick={() => void handleUpload()}
            className="flex-1 rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
