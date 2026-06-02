"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { SellCryptoRateConfirmSummary } from "@/components/product-mgt/sell-crypto-rate-confirm-summary";
import { SellCryptoRateSetupModal } from "@/components/product-mgt/sell-crypto-rate-setup-modal";
import type { ExchangeRateRow } from "@/components/product-mgt/product-mgt-types";
import {
  formatOurCommission,
  formatUpdatedDate,
  type MarkupFormValues,
} from "@/lib/product-mgt/rate-preview";
import { postConfigureSellCryptoRate } from "@/lib/admin-api/exchange-rates-api";

type FlowStep = "setup" | "confirm" | "success";

type SellCryptoRateUpdateFlowProps = {
  row: ExchangeRateRow | null;
  onClose: () => void;
  onApplied: (updatedRow: ExchangeRateRow) => void;
};

export function SellCryptoRateUpdateFlow({ row, onClose, onApplied }: SellCryptoRateUpdateFlowProps) {
  const [step, setStep] = useState<FlowStep>("setup");
  const [form, setForm] = useState<MarkupFormValues | null>(null);

  const reset = useCallback(() => {
    setStep("setup");
    setForm(null);
  }, []);

  useEffect(() => {
    if (row) reset();
  }, [row?.id, reset]);

  if (!row) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSetupSubmit = (values: MarkupFormValues) => {
    setForm(values);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!form) return;
    try {
      const cryptoSlug = row.currencyCode.toLowerCase();
      await postConfigureSellCryptoRate(cryptoSlug, {
        markupType: form.markupType,
        markupRate: parseFloat(form.markupRate) || 0,
      });

      const updated: ExchangeRateRow = {
        ...row,
        commissionType: form.markupType,
        ourCommission: formatOurCommission(form.markupType, form.markupRate),
        dateUpdated: formatUpdatedDate(),
      };
      onApplied(updated);
      setStep("success");
    } catch (e) {
      console.error("Failed to configure sell crypto rate:", e);
      alert(e instanceof Error ? e.message : "Failed to configure sell crypto rate");
    }
  };

  if (step === "setup") {
    return <SellCryptoRateSetupModal row={row} onClose={handleClose} onSubmit={handleSetupSubmit} />;
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
        <SellCryptoRateConfirmSummary form={form} />
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
          Markup rate.
        </p>
      </SuccessModal>
    );
  }

  return null;
}
