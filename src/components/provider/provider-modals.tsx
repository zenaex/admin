"use client";

import { useState } from "react";
import { CloseCircle, TickCircle } from "iconsax-react";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white px-6 pb-8 pt-4 shadow-xl mx-4">
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-zinc-200" />

        {/* Warning icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-red-600">
            <span className="text-[22px] font-bold leading-none text-red-600">!</span>
          </div>
        </div>

        {/* Text */}
        <h2 className="mb-2 text-center text-[20px] font-bold text-primary-text">{title}</h2>
        <p className="mb-7 text-center text-sm text-zinc-400">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-zinc-100 py-3.5 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type AddProductModalProps = {
  product: { productName: string; commissionType: string; commissionRate: string; cap: string };
  onClose: () => void;
  onSuccess: () => void;
};

const COMMISSION_TYPES = ["Flat", "Percentage", "% capped @"];
const PRODUCT_OPTIONS = [
  "EKEDC Postpaid", "Spectranet Data", "Global 139", "MTN Airtime",
  "Glo Airtime", "IKEDC Postpaid", "DSTV Subscription", "Startimes",
];

export function AddProductModal({ product, onClose, onSuccess }: AddProductModalProps) {
  const [form, setForm] = useState({
    product: product.productName,
    commissionType: product.commissionType,
    commissionRate: product.commissionRate,
    cap: product.cap === "-" ? "" : product.cap,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl mx-4">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Add Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Product</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.product}
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
              >
                {PRODUCT_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>

          {/* Commission Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Commission Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.commissionType}
                onChange={(e) => setForm((f) => ({ ...f, commissionType: e.target.value }))}
              >
                {COMMISSION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>

          {/* Commission Rate */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Commission Rate</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={form.commissionRate}
              onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
              placeholder="e.g. 200"
            />
          </div>

          {/* CAP */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">CAP</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={form.cap}
              onChange={(e) => setForm((f) => ({ ...f, cap: e.target.value }))}
              placeholder="e.g. ₦5000"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

type SuccessModalProps = {
  message: string;
  onContinue: () => void;
};

export function SuccessModal({ message, onContinue }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onContinue} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white px-6 pb-8 pt-4 shadow-xl mx-4">
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-zinc-200" />

        {/* Success icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <TickCircle size={56} variant="Outline" color="#013220" />
        </div>

        {/* Text */}
        <h2 className="mb-2 text-center text-[20px] font-bold text-primary-text">Successful</h2>
        <p className="mb-7 text-center text-sm text-zinc-400">{message}</p>

        {/* Button */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
