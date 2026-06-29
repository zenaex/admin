"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { GiftcardRateConfirmSummary } from "@/components/product-mgt/giftcard-rate-confirm-summary";
import { GiftcardRateSetupModal, type GiftcardRateFormValues } from "@/components/product-mgt/giftcard-rate-setup-modal";
import type { GiftcardBrand } from "@/components/product-mgt/product-mgt-types";
import { formatUpdatedDate } from "@/lib/product-mgt/rate-preview";
import type { MarkupType } from "@/lib/product-mgt/rate-preview";
import { postConfigureGiftcardRate, getGiftcardRatePreview, getCurrencySymbol, parseRmbRate } from "@/lib/admin-api/exchange-rates-api";

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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCategories, setPreviewCategories] = useState<{ category: string; vendorRate: number; finalRate: number }[] | null>(null);

  const reset = useCallback(() => {
    setStep("setup");
    setForm(null);
    setPreviewLoading(false);
    setPreviewCategories(null);
  }, []);

  useEffect(() => {
    if (brand) {
      reset();
      setActiveBrand(brand);
    }
  }, [brand?.id, reset]);

  useEffect(() => {
    if (step === "confirm" && form && activeBrand) {
      let cancelled = false;
      const fetchPreview = async () => {
        setPreviewLoading(true);
        try {
          const res = await getGiftcardRatePreview({
            rmbRate: parseRmbRate(form.rmbRate),
            markupType: form.commissionType,
            markupRate: parseFloat(form.commissionRate) || 0,
            categories: form.denominations.map((d) => ({
              category: d.category || d.label,
              vendorRate: parseFloat(d.vendorRate) || 0,
            })),
          });
          if (!cancelled) {
            setPreviewCategories(res.categories);
          }
        } catch (e) {
          console.error("Failed to load preview rates:", e);
        } finally {
          if (!cancelled) {
            setPreviewLoading(false);
          }
        }
      };
      void fetchPreview();
      return () => {
        cancelled = true;
      };
    } else {
      setPreviewCategories(null);
    }
  }, [step, form, activeBrand?.id]);

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

  const symbol = getCurrencySymbol(activeBrand.currency);

  const calculateFinalRate = (
    commissionType: MarkupType,
    commissionRate: string,
    vendorRate: string
  ) => {
    const rmb = parseRmbRate(form?.rmbRate || activeBrand.rmbRate);
    const vendor = parseFloat(vendorRate) || 0;
    const baseNgn = rmb * vendor;

    const commNum = parseFloat(commissionRate) || 0;
    let finalNgn = baseNgn;

    if (commissionType === "Percentage") {
      finalNgn = baseNgn * (1 - commNum / 100);
    } else if (commissionType === "Flat") {
      finalNgn = baseNgn - commNum;
    } else {
      const markup = Math.min((baseNgn * commNum) / 100, 50);
      finalNgn = baseNgn - markup;
    }
    return `${symbol}1/₦${finalNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            category: d.category || d.label,
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
          const preview = previewCategories?.find((pc) => pc.category === denom.category || pc.category === denom.label);
          
          const finalRateDisplay = preview
            ? `${symbol}1/₦${(preview.finalRate / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : calculateFinalRate(form.commissionType, form.commissionRate, updatedVendorRateClean);

          return {
            ...denom,
            vendorRate: `${symbol}${parseFloat(updatedVendorRateClean).toFixed(2)}`,
            finalRate: finalRateDisplay,
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
        disabled={previewLoading}
      >
        <div className="text-left w-full relative">
          {previewLoading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-3xl">
              <span className="text-xs font-semibold text-zinc-500">Loading live preview rates...</span>
            </div>
          )}
          <GiftcardRateConfirmSummary form={form} brand={activeBrand} previewCategories={previewCategories || undefined} />
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
