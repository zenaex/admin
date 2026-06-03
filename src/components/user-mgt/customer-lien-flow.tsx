"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloseCircle } from "iconsax-react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { AdminApiError } from "@/lib/admin-api/client";
import { postCustomerPlaceLien, postCustomerRemoveLien } from "@/lib/admin-api/users-api";

export type CustomerLienFlowMode = "add" | "remove";

const LIEN_TYPE_OPTIONS = [
  "Regulatory hold",
  "Fraud investigation",
  "Court order",
  "Dispute",
  "Compliance review",
  "Other",
] as const;

type CustomerLienFlowProps = {
  mode: CustomerLienFlowMode;
  accountId: string;
  walletId?: string;
  onClose: () => void;
  onApplied: () => void | Promise<void>;
};

type Step = "form" | "confirm" | "success";

export function CustomerLienFlow({ mode, accountId, walletId, onClose, onApplied }: CustomerLienFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(mode === "add" ? "form" : "confirm");
  const [amount, setAmount] = useState("");
  const [lienType, setLienType] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "add") {
        await postCustomerPlaceLien(accountId, {
          amount: amount.trim(),
          lienType: lienType.trim(),
          reason: reason.trim(),
          ...(walletId ? { walletId } : {}),
        });
      } else {
        await postCustomerRemoveLien(accountId, walletId ? { walletId } : undefined);
      }
      await onApplied();
      setStep("success");
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    onClose();
    router.push("/dashboard/user-mgt/customers");
  };

  const formValid = Boolean(amount.trim() && lienType.trim() && reason.trim());

  if (step === "form" && mode === "add") {
    return (
      <AddLienFormModal
        amount={amount}
        lienType={lienType}
        reason={reason}
        loading={loading}
        error={error}
        onAmountChange={setAmount}
        onLienTypeChange={setLienType}
        onReasonChange={setReason}
        onClose={onClose}
        onSubmit={() => {
          if (!formValid) return;
          setError(null);
          setStep("confirm");
        }}
        formValid={formValid}
      />
    );
  }

  if (step === "confirm") {
    const isAdd = mode === "add";
    return (
      <>
        {error ? (
          <div className="fixed inset-x-0 top-4 z-[60] mx-auto max-w-md px-4">
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700" role="alert">
              {error}
            </p>
          </div>
        ) : null}
        <ConfirmModal
          title={isAdd ? "Place Lien" : "Remove Lien"}
          message={
            isAdd
              ? "Are you sure you want to place this customer wallet on Lien?"
              : "Are you sure you want to release lien on this wallet?"
          }
          confirmLabel={loading ? "Please wait…" : isAdd ? "Yes, Place" : "Yes, Remove"}
          cancelLabel="Cancel"
          variant={isAdd ? "danger" : "approve"}
          onConfirm={() => void handleConfirm()}
          onCancel={() => {
            if (loading) return;
            if (isAdd) setStep("form");
            else onClose();
          }}
        />
      </>
    );
  }

  if (step === "success") {
    const message =
      mode === "add"
        ? "The customer wallet has been successfully placed on Lien."
        : "You have successfully released lien on this wallet.";
    return (
      <SuccessModal message={message} confirmLabel="Go Back Home" onContinue={handleGoHome} />
    );
  }

  return null;
}

function AddLienFormModal({
  amount,
  lienType,
  reason,
  onAmountChange,
  onLienTypeChange,
  onReasonChange,
  loading,
  error,
  onClose,
  onSubmit,
  formValid,
}: {
  amount: string;
  lienType: string;
  reason: string;
  onAmountChange: (v: string) => void;
  onLienTypeChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
  formValid: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-[17px] font-bold text-brand-navy">Add Lien To Wallet</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 disabled:opacity-50"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
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
            onSubmit();
          }}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Amount</label>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              value={amount}
              disabled={loading}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="Enter Amount"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Lien Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={lienType}
                disabled={loading}
                onChange={(e) => onLienTypeChange(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select reason
                </option>
                {LIEN_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
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
            <label className="mb-2 block text-sm font-medium text-zinc-700">Reason for Lien</label>
            <textarea
              className="min-h-[120px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              value={reason}
              disabled={loading}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Text"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formValid}
            className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
