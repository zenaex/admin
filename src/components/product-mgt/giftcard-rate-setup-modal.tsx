"use client";

import { useEffect, useState } from "react";
import { CloseCircle } from "iconsax-react";
import type { GiftcardBrand } from "@/components/product-mgt/product-mgt-types";
import type { MarkupType } from "@/lib/product-mgt/rate-preview";

export type GiftcardRateFormValues = {
  brandId: string;
  rmbRate: string;
  commissionType: MarkupType;
  commissionRate: string;
  denominations: { id: string; label: string; vendorRate: string }[];
};

const COMMISSION_TYPES = ["Flat", "Percentage", "% capped @"] as const;

type GiftcardRateSetupModalProps = {
  brand: GiftcardBrand;
  brands: GiftcardBrand[];
  onClose: () => void;
  onSubmit: (values: GiftcardRateFormValues) => void;
};

export function GiftcardRateSetupModal({ brand, brands, onClose, onSubmit }: GiftcardRateSetupModalProps) {
  const [selectedBrand, setSelectedBrand] = useState<GiftcardBrand>(brand);

  const [form, setForm] = useState<GiftcardRateFormValues>(() => {
    return {
      brandId: brand.id,
      rmbRate: brand.rmbRate || "¥203.50",
      commissionType: (brand.commissionType as MarkupType) || "Flat",
      commissionRate: brand.ourCommission.replace(/[^\d.]/g, "") || "100",
      denominations: brand.denominations.map((d) => ({
        id: d.id,
        label: d.label,
        vendorRate: d.vendorRate.replace(/[^\d.]/g, "") || "5.18",
      })),
    };
  });

  useEffect(() => {
    setSelectedBrand(brand);
    setForm({
      brandId: brand.id,
      rmbRate: brand.rmbRate || "¥203.50",
      commissionType: (brand.commissionType as MarkupType) || "Flat",
      commissionRate: brand.ourCommission.replace(/[^\d.]/g, "") || "100",
      denominations: brand.denominations.map((d) => ({
        id: d.id,
        label: d.label,
        vendorRate: d.vendorRate.replace(/[^\d.]/g, "") || "5.18",
      })),
    });
  }, [brand.id]);

  const handleBrandChange = (brandId: string) => {
    const nextBrand = brands.find((b) => b.id === brandId);
    if (nextBrand) {
      setSelectedBrand(nextBrand);
      setForm({
        brandId: nextBrand.id,
        rmbRate: nextBrand.rmbRate || "¥203.50",
        commissionType: (nextBrand.commissionType as MarkupType) || "Flat",
        commissionRate: nextBrand.ourCommission.replace(/[^\d.]/g, "") || "100",
        denominations: nextBrand.denominations.map((d) => ({
          id: d.id,
          label: d.label,
          vendorRate: d.vendorRate.replace(/[^\d.]/g, "") || "5.18",
        })),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const getRmbRateDisplay = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    if (!cleaned) return "";
    const prefix = val.includes("$") ? "$" : val.includes("₦") ? "₦" : "¥";
    return `${prefix}${cleaned}`;
  };

  const getCommissionRateDisplay = (type: MarkupType, val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    if (!cleaned) return "";
    if (type === "Percentage") return `${cleaned}%`;
    return `₦${cleaned}`;
  };

  const getVendorRateDisplay = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    return cleaned ? `$${cleaned}` : "";
  };

  const modalTitle = selectedBrand.brandName.substring(0, 3) + "Rate Setup";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 py-10">
      <div className="relative mx-4 my-auto w-full max-w-sm rounded-3xl bg-white px-6 pb-7 pt-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">{modalTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        {/* Brand Selector Dropdown */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-primary-text">Select Giftcard Brand</label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-surface-subtle px-3.5 py-3 text-sm text-primary-text font-semibold outline-none focus:border-zinc-400"
              value={form.brandId}
              onChange={(e) => handleBrandChange(e.target.value)}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brandName} | {b.brandType} ({b.country === "United State" || b.country.startsWith("United State") ? "USA" : b.country})
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">RMB Rate</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={getRmbRateDisplay(form.rmbRate)}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                const prefix = e.target.value.includes("$") ? "$" : e.target.value.includes("₦") ? "₦" : "¥";
                setForm((f) => ({ ...f, rmbRate: `${prefix}${cleaned}` }));
              }}
              placeholder="e.g. ¥203.50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Commission Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.commissionType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    commissionType: e.target.value as MarkupType,
                  }))
                }
              >
                {COMMISSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "Flat" ? "Flat" : t === "Percentage" ? "Percentage" : "% capped @"}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Commission Rate</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={getCommissionRateDisplay(form.commissionType, form.commissionRate)}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                setForm((f) => ({ ...f, commissionRate: cleaned }));
              }}
              placeholder={form.commissionType === "Percentage" ? "e.g. 20%" : "e.g. 100"}
            />
          </div>

          {/* Vendor's Rate Section */}
          <div className="pt-2">
            <h3 className="mb-3 text-[16px] font-bold text-primary-text">Vendor's Rate</h3>
            <div className="space-y-4">
              {form.denominations.map((denom, index) => (
                <div key={denom.id}>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">{denom.label}</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                    value={getVendorRateDisplay(denom.vendorRate)}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                      setForm((f) => {
                        const updatedDenoms = [...f.denominations];
                        updatedDenoms[index] = { ...updatedDenoms[index], vendorRate: cleaned };
                        return { ...f, denominations: updatedDenoms };
                      });
                    }}
                    placeholder="e.g. $5.18"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
