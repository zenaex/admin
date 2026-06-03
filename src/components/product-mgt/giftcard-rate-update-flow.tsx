"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { GiftcardRateConfirmSummary } from "@/components/product-mgt/giftcard-rate-confirm-summary";
import { GiftcardRateSetupModal, type GiftcardRateFormValues } from "@/components/product-mgt/giftcard-rate-setup-modal";
import type { GiftcardBrand } from "@/components/product-mgt/product-mgt-types";
import { formatUpdatedDate } from "@/lib/product-mgt/rate-preview";
import type { MarkupType } from "@/lib/product-mgt/rate-preview";
import { postConfigureGiftcardRate } from "@/lib/admin-api/exchange-rates-api";

type FlowStep = "setup" | "confirm" | "success";

type GiftcardRateUpdateFlowProps = {
  brand: GiftcardBrand | null;
  brands: GiftcardBrand[];
  onClose: () => void;
  onApplied: (updatedBrand: GiftcardBrand) => void;
};

export function GiftcardRateUpdateFlow({ brand, brands, onClose, onApplied }: GiftcardRateUpdateFlowProps) {
  const [step, setStep] = useState<FlowStep>("setup");
  const [form, setForm] = useState<GiftcardRateFormValues | null>(null);
  const [activeBrand, setActiveBrand] = useState<GiftcardBrand | null>(null);

  const reset = useCallback(() => {
    setStep("setup");
    setForm(null);
  }, []);

  useEffect(() => {
    if (brand) {
      reset();
      setActiveBrand(brand);
    }
  }, [brand?.id, reset]);

  if (!brand || !activeBrand) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSetupSubmit = (values: GiftcardRateFormValues) => {
    const chosen = brands.find((b) => b.id === values.brandId) || activeBrand;
    setForm(values);
    setActiveBrand(chosen);
    setStep("confirm");
  };

  const calculateFinalRate = (
    commissionType: MarkupType,
    commissionRate: string,
    vendorRate: string
  ) => {
    const commNum = parseFloat(commissionRate) || 0;
    let finalNgn = 1200;
    if (commissionType === "Percentage") {
      const baseNgn = 1500;
      finalNgn = baseNgn * (1 - commNum / 100);
    } else if (commissionType === "Flat") {
      const baseNgn = 1300;
      finalNgn = baseNgn - commNum;
    } else {
      const baseNgn = 1250;
      finalNgn = baseNgn - commNum;
    }
    return `$1/₦${finalNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleConfirm = async () => {
    if (!form || !activeBrand) return;

    try {
      await postConfigureGiftcardRate(activeBrand.id, {
        rmbRate: form.rmbRate,
        markupType: form.commissionType,
        markupRate: form.commissionRate,
        categories: form.denominations.map((d) => {
          const existing = activeBrand.denominations.find((denom) => denom.id === d.id);
          return {
            category: d.label,
            vendorRate: parseFloat(d.vendorRate) || 0,
            isActive: existing?.status !== "Inactive",
          };
        }),
      });

      const commValueDisplay =
        form.commissionType === "Percentage"
          ? `${form.commissionRate}%`
          : form.commissionType === "% capped @"
            ? `${form.commissionRate}%@₦50`
            : `₦${parseFloat(form.commissionRate || "100").toLocaleString()} FLAT`;

      const updatedBrand: GiftcardBrand = {
        ...activeBrand,
        commissionType: form.commissionType,
        ourCommission: commValueDisplay,
        rmbRate: form.rmbRate,
        denominations: activeBrand.denominations.map((denom) => {
          const formDenom = form.denominations.find((fd) => fd.id === denom.id);
          const updatedVendorRateClean = formDenom ? formDenom.vendorRate : denom.vendorRate.replace(/[^\d.]/g, "");

          return {
            ...denom,
            vendorRate: `$${parseFloat(updatedVendorRateClean).toFixed(2)}`,
            finalRate: calculateFinalRate(form.commissionType, form.commissionRate, updatedVendorRateClean),
            dateUpdated: formatUpdatedDate(),
          };
        }),
      };

      onApplied(updatedBrand);
      setStep("success");
    } catch (e) {
      console.error("Failed to configure giftcard rate:", e);
      alert(e instanceof Error ? e.message : "Failed to configure giftcard rate");
    }
  };

  const countryDisplay = activeBrand.country === "United State" || activeBrand.country.startsWith("United State") ? "USA" : activeBrand.country;
  const typeText = activeBrand.brandType === "E-code" ? "Ecode" : `Physical card (${countryDisplay})`;

  if (step === "setup") {
    return <GiftcardRateSetupModal brand={activeBrand} brands={brands} onClose={handleClose} onSubmit={handleSetupSubmit} />;
  }

  if (step === "confirm" && form) {
    return (
      <ConfirmModal
        title="Update Giftcard Rate"
        variant="approve"
        confirmLabel="Update"
        onConfirm={handleConfirm}
        onCancel={() => setStep("setup")}
      >
        <div className="text-left w-full">
          <GiftcardRateConfirmSummary form={form} brand={activeBrand} />
        </div>
      </ConfirmModal>
    );
  }

  if (step === "success") {
    return (
      <SuccessModal onContinue={handleClose}>
        <p className="text-center text-sm text-zinc-400">
          You have updated{" "}
          <span className="font-semibold text-primary-text">
            {activeBrand.brandName} {typeText}
          </span>{" "}
          rates.
        </p>
      </SuccessModal>
    );
  }

  return null;
}
