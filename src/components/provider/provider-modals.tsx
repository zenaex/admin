"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CloseCircle, TickCircle } from "iconsax-react";

type ConfirmModalProps = {
  title: string;
  message?: string;
  /** Replaces default message paragraph when set */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "approve";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  message = "",
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const iconColor = variant === "approve" ? "var(--color-secondary-green)" : "var(--color-failed)";
  const confirmCls =
    variant === "approve"
      ? "flex-1 rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
      : "flex-1 rounded-full bg-red-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative mx-4 w-full max-w-sm rounded-3xl bg-white px-6 pb-8 pt-4 shadow-xl">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-zinc-200" />

        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-outline">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-[3px]"
            style={{ borderColor: iconColor }}
          >
            <span className="text-[22px] font-bold leading-none" style={{ color: iconColor }}>
              !
            </span>
          </div>
        </div>

        <h2 className="mb-2 text-center text-[20px] font-bold text-primary-text">{title}</h2>
        {children ? (
          <div className="mb-7">{children}</div>
        ) : message ? (
          <p className="mb-7 text-center text-sm text-zinc-400">{message}</p>
        ) : (
          <div className="mb-7" />
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-outline py-3.5 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-200"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={confirmCls}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type EditProductCommissionModalProps = {
  productName: string;
  initial: { commissionType: string; commissionRate: string; cap: string };
  onClose: () => void;
  onSave: (form: { commissionType: string; commissionRate: string; cap: string }) => Promise<void>;
};

const COMMISSION_TYPES = ["Flat", "Percentage", "% capped @"];

export function EditProductCommissionModal({
  productName,
  initial,
  onClose,
  onSave,
}: EditProductCommissionModalProps) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save commission.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Edit Commission</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Product</label>
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-primary-text">
              {productName}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Commission Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.commissionType}
                onChange={(e) => setForm((f) => ({ ...f, commissionType: e.target.value }))}
              >
                {COMMISSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={form.commissionRate}
              onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
              placeholder="e.g. 200"
            />
          </div>

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
            disabled={saving}
            className="mt-2 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

type EditProviderEmailModalProps = {
  initialEmail: string;
  onClose: () => void;
  onSave: (email: string) => Promise<void>;
};

export function EditProviderEmailModal({ initialEmail, onClose, onSave }: EditProviderEmailModalProps) {
  const [email, setEmail] = useState(initialEmail === "—" ? "" : initialEmail);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update email.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Update Email</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Email Address</label>
            <input
              type="email"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

type SuccessModalProps = {
  message?: string;
  /** Replaces default message when set */
  children?: ReactNode;
  confirmLabel?: string;
  onContinue: () => void;
};

export function SuccessModal({
  message,
  children,
  confirmLabel = "Continue",
  onContinue,
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onContinue} />
      <div className="relative mx-4 w-full max-w-sm rounded-3xl bg-white px-6 pb-8 pt-4 shadow-xl">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-zinc-200" />

        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-outline">
          <TickCircle size={56} variant="Outline" color="var(--color-secondary-green)" />
        </div>

        <h2 className="mb-2 text-center text-[20px] font-bold text-primary-text">Successful</h2>
        {children ? (
          <div className="mb-7">{children}</div>
        ) : message ? (
          <p className="mb-7 text-center text-sm text-zinc-400">{message}</p>
        ) : (
          <div className="mb-7" />
        )}

        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
