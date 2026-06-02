"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloseCircle, DocumentUpload } from "iconsax-react";
import { SuccessModal } from "@/components/provider/provider-modals";
import { AdminApiError } from "@/lib/admin-api/client";
import { uploadGiftcardRateSheet, isGiftcardRateSheetFile } from "@/lib/admin-api/exchange-rates-api";

type GiftcardRateSheetUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function GiftcardRateSheetUploadModal({ open, onClose, onSuccess }: GiftcardRateSheetUploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!open) return null;

  const reset = () => {
    setFile(null);
    setError(null);
    setIsDragOver(false);
    setLoading(false);
    setShowSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickFile = (next: File | null) => {
    if (!next) return;
    if (!isGiftcardRateSheetFile(next)) {
      setError("Please choose a CSV or Excel file.");
      return;
    }
    setError(null);
    setFile(next);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Select a CSV or Excel file to upload.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await uploadGiftcardRateSheet(file);
      setShowSuccess(true);
    } catch (e) {
      setError(
        e instanceof AdminApiError ? e.message : e instanceof Error ? e.message : "Upload failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <SuccessModal
        message="Gift card rate sheet uploaded successfully."
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

        <p className="mb-4 text-sm text-zinc-500">Upload a CSV or Excel file to update gift card rates.</p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={onFileChange}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition-colors ${
            isDragOver ? "border-primary-green bg-primary-green/5" : "border-zinc-200"
          }`}
        >
          <DocumentUpload size={28} variant="Outline" color="currentColor" className="text-zinc-400" />
          <span className="text-sm font-semibold text-primary-text">
            {file ? file.name : "Click to upload or drag and drop"}
          </span>
          <span className="text-xs text-zinc-500">CSV or Excel (.xlsx, .xls)</span>
        </button>

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
            disabled={loading || !file}
            onClick={() => void handleUpload()}
            className="flex-1 rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
