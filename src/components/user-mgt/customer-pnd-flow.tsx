"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloseCircle } from "iconsax-react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { AdminApiError } from "@/lib/admin-api/client";
import { postCustomerAddPnd, postCustomerRemovePnd } from "@/lib/admin-api/users-api";

export type CustomerPndFlowMode = "add" | "remove";

type CustomerPndFlowProps = {
  mode: CustomerPndFlowMode;
  accountId: string;
  onClose: () => void;
  onApplied: () => void | Promise<void>;
};

type Step = "form" | "confirm" | "success";

export function CustomerPndFlow({ mode, accountId, onClose, onApplied }: CustomerPndFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(mode === "add" ? "form" : "confirm");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "add") {
        await postCustomerAddPnd(accountId, { reason: reason.trim() });
      } else {
        await postCustomerRemovePnd(accountId);
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

  if (step === "form" && mode === "add") {
    return (
      <AddPndReasonModal
        loading={loading}
        error={error}
        reason={reason}
        onReasonChange={setReason}
        onClose={onClose}
        onSubmit={() => {
          if (!reason.trim()) return;
          setError(null);
          setStep("confirm");
        }}
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
          title={isAdd ? "Add Post No Debit" : "Remove PND"}
          message={
            isAdd
              ? "Are you sure you want to add a PND to this customer?"
              : "Are you sure you want to remove PND from this customer?"
          }
          confirmLabel={loading ? "Please wait…" : isAdd ? "Yes, Add" : "Yes, Remove"}
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
        ? "The customer has been successfully placed on PND."
        : "The customer has been successfully removed from PND.";
    return (
      <SuccessModal message={message} confirmLabel="Go Back Home" onContinue={handleGoHome} />
    );
  }

  return null;
}

function AddPndReasonModal({
  reason,
  onReasonChange,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  reason: string;
  onReasonChange: (v: string) => void;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-[17px] font-bold text-brand-navy">Add Post No Debit</h2>
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
            <label className="mb-2 block text-sm font-medium text-zinc-700">Reason for PND</label>
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
            disabled={loading || !reason.trim()}
            className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
