"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown2 } from "iconsax-react";
import {
  defaultPasswordPolicyUi,
  policyDtoToUi,
  type AdminPasswordPolicyUiState,
  type PolicyExpiryUnitUi,
} from "@/lib/admin-api/settings-policy-map";
import { getAdminSettingsPasswordPolicy, patchPasswordPolicyFromUiState } from "@/lib/admin-api/settings-api";
import { AdminApiError } from "@/lib/admin-api/client";
import { ErrorAlert } from "@/components/ui/error-alert";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-zinc-300 transition-colors"
      >
        <span
          className={`inline-block h-4 w-4 rounded-full shadow transition-transform ${
            checked ? "translate-x-4 bg-primary-green" : "translate-x-0.5 bg-white"
          }`}
        />
      </button>
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  );
}

function expiryMax(unit: PolicyExpiryUnitUi): number {
  if (unit === "Day") return 30;
  if (unit === "Week") return 52;
  return 12;
}

function expiryLabel(unit: PolicyExpiryUnitUi, n: number): string {
  const u = unit.toLowerCase();
  if (unit === "Day") return `${n} day${n === 1 ? "" : "s"}`;
  if (unit === "Week") return `${n} week${n === 1 ? "" : "s"}`;
  return `${n} month${n === 1 ? "" : "s"}`;
}

type ExpiryProps = {
  ui: AdminPasswordPolicyUiState;
  setUi: React.Dispatch<React.SetStateAction<AdminPasswordPolicyUiState>>;
  saving: boolean;
  onSave: () => void;
};

function ExpiryConfiguration({ ui, setUi, saving, onSave }: ExpiryProps) {
  const [open, setOpen] = useState(false);
  const max = expiryMax(ui.expiryUnit);
  const options = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-sm text-zinc-500">Set up duration by</p>
        <div className="flex gap-2">
          {(["Day", "Week", "Month"] as PolicyExpiryUnitUi[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setUi((prev) => {
                  const cap = expiryMax(u);
                  const nextCount = Math.min(prev.expiryCount, cap);
                  return { ...prev, expiryUnit: u, expiryCount: Math.max(1, nextCount) };
                });
              }}
              className={`rounded-full px-8 py-2.5 text-sm font-medium transition-colors ${
                ui.expiryUnit === u
                  ? "bg-primary-green font-semibold text-primary-text"
                  : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-300"
        >
          <span className="text-primary-text">{expiryLabel(ui.expiryUnit, ui.expiryCount)}</span>
          <ArrowDown2
            size={16}
            variant="Outline"
            color="currentColor"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            {options.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setUi((prev) => ({ ...prev, expiryCount: n }));
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-surface-subtle ${
                  ui.expiryCount === n ? "font-semibold text-primary-text" : "text-zinc-500"
                }`}
              >
                {expiryLabel(ui.expiryUnit, n)}
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="border-outline" />

      <Toggle
        checked={ui.reusablePassword}
        onChange={(v) => setUi((prev) => ({ ...prev, reusablePassword: v }))}
        label="Enable reusable password"
      />

      <div>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-full bg-primary-green px-6 py-2.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export function SettingsPasswordPolicyTab() {
  const [ui, setUi] = useState<AdminPasswordPolicyUiState>(() => defaultPasswordPolicyUi());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const dto = await getAdminSettingsPasswordPolicy();
      setUi(policyDtoToUi(dto));
    } catch (e) {
      setLoadError(e instanceof AdminApiError ? e.message : "Could not load password policy.");
      setUi(defaultPasswordPolicyUi());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePolicy = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const next = await patchPasswordPolicyFromUiState(ui);
      setUi(next);
    } catch (e) {
      setSaveError(e instanceof AdminApiError ? e.message : "Could not save password policy.");
    } finally {
      setSaving(false);
    }
  }, [ui]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading password policy…</p>;
  }

  return (
    <div>
      {loadError ? (
        <ErrorAlert error={loadError} onRetry={() => void load()} className="mb-4" />
      ) : null}

      {saveError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}

      <div className="w-[566px] max-w-full rounded-xl border border-outline bg-white p-6">
        <ExpiryConfiguration ui={ui} setUi={setUi} saving={saving} onSave={() => void savePolicy()} />
      </div>
    </div>
  );
}
