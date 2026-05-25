"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { SwapCryptoRateConfirmSummary } from "@/components/product-mgt/swap-crypto-rate-confirm-summary";
import { SwapCryptoRateSetupModal } from "@/components/product-mgt/swap-crypto-rate-setup-modal";
import type { ExchangeRateRow } from "@/components/product-mgt/product-mgt-types";
import {
  formatSwapPairOurCommission,
  formatUpdatedDate,
  type SwapPairFormValues,
} from "@/lib/product-mgt/rate-preview";

type FlowStep = "setup" | "confirm" | "success";

type SwapCryptoRateUpdateFlowProps = {
  row: ExchangeRateRow | null;
  onClose: () => void;
  onApplied: (updatedRow: ExchangeRateRow) => void;
};

export function SwapCryptoRateUpdateFlow({ row, onClose, onApplied }: SwapCryptoRateUpdateFlowProps) {
  const [step, setStep] = useState<FlowStep>("setup");
  const [form, setForm] = useState<SwapPairFormValues | null>(null);

  const reset = useCallback(() => {
    setStep("setup");
    setForm(null);
  }, []);

  useEffect(() => {
    if (row) reset();
  }, [row?.id, reset]);

  if (!row?.swapPair) return null;

  const pair = row.swapPair;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSetupSubmit = (values: SwapPairFormValues) => {
    setForm(values);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!form) return;
    const updated: ExchangeRateRow = {
      ...row,
      commissionType: form.markupType,
      ourCommission: formatSwapPairOurCommission(form),
      dateUpdated: formatUpdatedDate(),
    };
    onApplied(updated);
    setStep("success");
  };

  if (step === "setup") {
    return (
      <SwapCryptoRateSetupModal
        pair={pair}
        row={row}
        onClose={handleClose}
        onSubmit={handleSetupSubmit}
      />
    );
  }

  if (step === "confirm" && form) {
    return (
      <ConfirmModal
        title={`Update ${pair.baseCode} & ${pair.quoteCode} Pairing Rate`}
        variant="approve"
        confirmLabel="Update"
        onConfirm={handleConfirm}
        onCancel={() => setStep("setup")}
      >
        <SwapCryptoRateConfirmSummary pair={pair} form={form} />
      </ConfirmModal>
    );
  }

  if (step === "success") {
    return (
      <SuccessModal onContinue={handleClose}>
        <p className="text-center text-sm text-zinc-400">
          You have updated{" "}
          <span className="font-semibold text-primary-text">
            {pair.baseName} ({pair.baseCode})
          </span>{" "}
          &{" "}
          <span className="font-semibold text-primary-text">
            {pair.quoteName} ({pair.quoteCode})
          </span>{" "}
          pairing rates.
        </p>
      </SuccessModal>
    );
  }

  return null;
}
