"use client";

import { useEffect, useState } from "react";
import { CloseCircle } from "iconsax-react";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  getAdminReferralConfig,
  saveAdminReferralConfig,
} from "@/lib/admin-api/referrals-api";
import type { AdminReferralConfigForm, ReferralThresholdType } from "@/lib/admin-api/types";

const THRESHOLD_OPTIONS: { label: string; value: ReferralThresholdType }[] = [
  { label: "Transaction number", value: "transaction_count" },
  { label: "Amount spent", value: "amount_spent" },
  { label: "Sign-up count", value: "signup_count" },
];

type ConfigureEarningsModalProps = {
  onClose: () => void;
  onSave: () => void;
};

export function ConfigureEarningsModal({ onClose, onSave }: ConfigureEarningsModalProps) {
  const [form, setForm] = useState<AdminReferralConfigForm | null>(null);
  const [configExists, setConfigExists] = useState(false);
  const [allowedProductsText, setAllowedProductsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminReferralConfig();
        if (cancelled) return;
        setConfigExists(res.exists);
        setForm(res.form);
        setAllowedProductsText(res.form.allowedProducts.join(", "));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof AdminApiError ? e.message : "Could not load configuration.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchForm = (patch: Partial<AdminReferralConfigForm>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const payload: AdminReferralConfigForm = {
        ...form,
        cycleSize: Number.parseInt(String(form.cycleSize), 10) || 10,
        maxDaysFromOnboarding: Number.parseInt(String(form.maxDaysFromOnboarding), 10) || 30,
        allowedProducts: allowedProductsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await saveAdminReferralConfig(payload, { exists: configExists });
      onSave();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not save configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Configure Earnings</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        {loading || !form ? (
          <p className="text-sm text-zinc-500">Loading configuration…</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            {!configExists ? (
              <p className="text-xs text-zinc-500">No active configuration yet. Saving will create the first config.</p>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Threshold Type</label>
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.thresholdType}
                onChange={(e) => patchForm({ thresholdType: e.target.value as ReferralThresholdType })}
              >
                {THRESHOLD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Min transaction amount</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.minTransactionAmount}
                onChange={(e) => patchForm({ minTransactionAmount: e.target.value })}
                placeholder="e.g. 100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Cycle size</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.cycleSize}
                onChange={(e) => patchForm({ cycleSize: Number(e.target.value) || 0 })}
                placeholder="e.g. 10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Max days from onboarding</label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.maxDaysFromOnboarding}
                onChange={(e) => patchForm({ maxDaysFromOnboarding: Number(e.target.value) || 0 })}
                placeholder="e.g. 30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Allowed products</label>
              <input
                type="text"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={allowedProductsText}
                onChange={(e) => setAllowedProductsText(e.target.value)}
                placeholder="Comma-separated slugs (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-text">Currency</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                  value={form.currency}
                  onChange={(e) => patchForm({ currency: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-text">Reward currency</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                  value={form.rewardCurrency}
                  onChange={(e) => patchForm({ rewardCurrency: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Reward amount</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.rewardAmount}
                onChange={(e) => patchForm({ rewardAmount: e.target.value })}
                placeholder="e.g. 5000"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : configExists ? "Update" : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
