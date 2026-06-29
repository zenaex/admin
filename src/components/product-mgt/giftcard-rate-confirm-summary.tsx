"use client";

import type { GiftcardRateFormValues } from "@/components/product-mgt/giftcard-rate-setup-modal";
import type { GiftcardBrand } from "@/components/product-mgt/product-mgt-types";
import type { MarkupType } from "@/lib/product-mgt/rate-preview";
import { getCurrencySymbol, parseRmbRate } from "@/lib/admin-api/exchange-rates-api";

type GiftcardRateConfirmSummaryProps = {
  form: GiftcardRateFormValues;
  brand: GiftcardBrand;
  previewCategories?: { category: string; vendorRate: number; finalRate: number }[];
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-primary-text">{value}</span>
    </div>
  );
}

export function GiftcardRateConfirmSummary({ form, brand, previewCategories }: GiftcardRateConfirmSummaryProps) {
  const countryDisplay = brand.country === "United State" || brand.country.startsWith("United State") ? "USA" : brand.country;
  const brandTypeDisplay = brand.brandType === "E-code" ? "Ecode" : brand.brandType;
  const commTypeLabel =
    form.commissionType === "Flat"
      ? "Flat Rate"
      : form.commissionType === "Percentage"
        ? "Percentage Rate"
        : "% Capped @";

  const commValueDisplay =
    form.commissionType === "Percentage"
      ? `${form.commissionRate}%`
      : form.commissionType === "% capped @"
        ? `${form.commissionRate}%@₦50`
        : `₦${parseFloat(form.commissionRate || "100").toLocaleString()}`;

  const symbol = getCurrencySymbol(brand.currency);

  const calculateFinalRate = (
    commissionType: MarkupType,
    commissionRate: string,
    vendorRate: string
  ) => {
    const rmb = parseRmbRate(form.rmbRate);
    const vendor = parseFloat(vendorRate) || 0;
    const baseNgn = rmb * vendor;

    const commNum = parseFloat(commissionRate) || 0;
    let finalNgn = baseNgn;

    // Calculate exchange rate in Naira using the custom commission rules
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

  return (
    <div className="rounded-3xl bg-surface-subtle p-5 text-left border border-zinc-100">
      {/* Upper Info Grid */}
      <div className="space-y-1">
        <SummaryRow label="Gift Card" value={`${brand.brandName} | ${countryDisplay}`} />
        <SummaryRow label="Type" value={brandTypeDisplay} />
        <SummaryRow label="Commission Type" value={commTypeLabel} />
        <SummaryRow label="Our Commission" value={commValueDisplay} />
      </div>

      {/* Dashed Separator */}
      <div className="my-4 border-t border-dashed border-zinc-200" />

      {/* Card Category & Rates Section */}
      <div>
        <h3 className="mb-3 text-[15px] font-bold text-primary-text">Card Category & Rates</h3>
        
        {/* Simple aligned list table */}
        <div className="w-full">
          {/* Table Head */}
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 py-1">
            <span className="w-1/2">Card Category</span>
            <span className="w-1/4 text-center">Vendor's Rate</span>
            <span className="w-1/4 text-right">Final Rate</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-zinc-100 mt-1">
            {form.denominations.map((denom) => {
              const preview = previewCategories?.find(
                (pc) => pc.category === denom.category || pc.category === denom.label
              );
              
              const vendorRateNum = preview 
                ? preview.vendorRate / 100 
                : parseFloat(denom.vendorRate || "0");
                
              const finalRateDisplay = preview
                ? `${symbol}1/₦${(preview.finalRate / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : calculateFinalRate(form.commissionType, form.commissionRate, denom.vendorRate);

              const formattedVendorRate = `${symbol}${vendorRateNum.toFixed(2)}`;

              return (
                <div key={denom.id} className="flex items-center justify-between text-xs py-2.5">
                  <span className="w-1/2 font-medium text-zinc-500">{denom.label}</span>
                  <span className="w-1/4 text-center font-medium text-primary-text">{formattedVendorRate}</span>
                  <span className="w-1/4 text-right font-bold text-primary-text">{finalRateDisplay}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
