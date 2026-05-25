"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { FiatRateConfirmSummary } from "@/components/product-mgt/fiat-rate-confirm-summary";
import { FiatRateSetupModal } from "@/components/product-mgt/fiat-rate-setup-modal";
import type { ExchangeRateRow } from "@/components/product-mgt/product-mgt-types";
import {
  buildRatePreview,
  formatOurCommission,
  formatUpdatedDate,
  type RateFormValues,
} from "@/lib/product-mgt/rate-preview";

type FlowStep = "setup" | "confirm" | "success";

type FiatRateUpdateFlowProps = {
  row: ExchangeRateRow | null;
  onClose: () => void;
  onApplied: (updatedRow: ExchangeRateRow) => void;
};

export function FiatRateUpdateFlow({ row, onClose, onApplied }: FiatRateUpdateFlowProps) {
  const [step, setStep] = useState<FlowStep>("setup");
  const [form, setForm] = useState<RateFormValues | null>(null);
  const [appliedPreview, setAppliedPreview] = useState<string>("");

  const reset = useCallback(() => {
    setStep("setup");
    setForm(null);
    setAppliedPreview("");
  }, []);

  useEffect(() => {
    if (row) reset();
  }, [row?.id, reset]);

  if (!row) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSetupSubmit = (values: RateFormValues) => {
    setForm(values);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!form) return;
    const preview = buildRatePreview(form, row.currencyCode);
    const updated: ExchangeRateRow = {
      ...row,
      commissionType: form.markupType,
      ourCommission: formatOurCommission(form.markupType, form.markupRate),
      baseRate: preview.baseRateForRow,
      finalRate: preview.finalRateForRow,
      dateUpdated: formatUpdatedDate(),
    };
    setAppliedPreview(preview.finalRateDisplay);
    onApplied(updated);
    setStep("success");
  };

  if (step === "setup") {
    return <FiatRateSetupModal row={row} onClose={handleClose} onSubmit={handleSetupSubmit} />;
  }

  if (step === "confirm" && form) {
    return (
      <ConfirmModal
        title={`Update ${row.currencyCode} Rate`}
        variant="approve"
        confirmLabel="Update"
        onConfirm={handleConfirm}
        onCancel={() => setStep("setup")}
      >
        <FiatRateConfirmSummary form={form} currencyCode={row.currencyCode} />
      </ConfirmModal>
    );
  }

  if (step === "success") {
    return (
      <SuccessModal onContinue={handleClose}>
        <p className="text-center text-sm text-zinc-400">
          You have updated{" "}
          <span className="font-semibold text-primary-text">
            {row.currencyName} ({row.currencyCode})
          </span>{" "}
          rate to{" "}
          <span className="font-semibold text-primary-text">{appliedPreview}</span>.
        </p>
      </SuccessModal>
    );
  }

  return null;
}
