"use client";

import { useState } from "react";
import { ArrowDown2 } from "iconsax-react";

type PolicySubTab = "expiry" | "length" | "combination";
type DurationUnit = "Day" | "Week" | "Month";

const DURATION_OPTIONS: Record<DurationUnit, string[]> = {
  Day: Array.from({ length: 30 }, (_, i) => `${i + 1} day${i > 0 ? "s" : ""}`),
  Week: Array.from({ length: 52 }, (_, i) => `${i + 1} week${i > 0 ? "s" : ""}`),
  Month: Array.from({ length: 12 }, (_, i) => `${i + 1} month${i > 0 ? "s" : ""}`),
};

/* ── Toggle switch matching the existing StatusToggle style ── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
          checked ? "bg-zinc-300" : "bg-zinc-300"
        }`}
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

/* ── Expiry Configuration sub-tab ── */
function ExpiryConfiguration() {
  const [unit, setUnit] = useState<DurationUnit>("Month");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [reusable, setReusable] = useState(false);

  const options = DURATION_OPTIONS[unit];
  const placeholder = `Select the number of ${unit.toLowerCase()}s`;

  return (
    <div className="space-y-5">
      {/* Duration unit picker */}
      <div>
        <p className="mb-3 text-sm text-zinc-500">Set up duration by</p>
        <div className="flex gap-2">
          {(["Day", "Week", "Month"] as DurationUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => { setUnit(u); setSelected(""); }}
              className={`rounded-full px-8 py-2.5 text-sm font-medium transition-colors ${
                unit === u
                  ? "bg-primary-green text-primary-text font-semibold"
                  : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Number dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-300"
        >
          <span className={selected ? "text-primary-text" : ""}>{selected || placeholder}</span>
          <ArrowDown2
            size={16}
            variant="Outline"
            color="currentColor"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setSelected(opt); setOpen(false); }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50 ${
                  selected === opt ? "font-semibold text-primary-text" : "text-zinc-500"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="border-zinc-100" />

      {/* Enable reusable password toggle */}
      <Toggle checked={reusable} onChange={setReusable} label="Enable reusable password" />

      {/* Save button */}
      <div>
        <button
          type="button"
          className="rounded-full bg-primary-green px-6 py-2.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ── Password Length sub-tab ── */
function PasswordLength() {
  const [minChar, setMinChar] = useState("");
  const [maxChar, setMaxChar] = useState("");
  const [openMin, setOpenMin] = useState(false);
  const [openMax, setOpenMax] = useState(false);

  const minOptions = Array.from({ length: 20 }, (_, i) => `${i + 1}`);
  const maxOptions = Array.from({ length: 32 }, (_, i) => `${i + 1}`);

  return (
    <div className="space-y-4">
      {/* Min character dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpenMin((o) => !o); setOpenMax(false); }}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-colors hover:border-zinc-300"
        >
          <span className={minChar ? "text-primary-text" : "text-zinc-400"}>
            {minChar ? `${minChar} characters` : "Select minimum character"}
          </span>
          <ArrowDown2 size={16} variant="Outline" color="currentColor" className={`transition-transform ${openMin ? "rotate-180" : ""}`} />
        </button>
        {openMin && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            {minOptions.map((opt) => (
              <button key={opt} type="button"
                onClick={() => { setMinChar(opt); setOpenMin(false); }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50 ${minChar === opt ? "font-semibold text-primary-text" : "text-zinc-500"}`}
              >
                {opt} characters
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Max character dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpenMax((o) => !o); setOpenMin(false); }}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-colors hover:border-zinc-300"
        >
          <span className={maxChar ? "text-primary-text" : "text-zinc-400"}>
            {maxChar ? `${maxChar} characters` : "Select maximum character"}
          </span>
          <ArrowDown2 size={16} variant="Outline" color="currentColor" className={`transition-transform ${openMax ? "rotate-180" : ""}`} />
        </button>
        {openMax && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            {maxOptions.map((opt) => (
              <button key={opt} type="button"
                onClick={() => { setMaxChar(opt); setOpenMax(false); }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50 ${maxChar === opt ? "font-semibold text-primary-text" : "text-zinc-500"}`}
              >
                {opt} characters
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          className="rounded-full bg-primary-green px-6 py-2.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ── Combination Setting sub-tab ── */
function CombinationSetting() {
  const [digitOnly, setDigitOnly] = useState(true);
  const [alphabetOnly, setAlphabetOnly] = useState(true);
  const [alphanumeric, setAlphanumeric] = useState(false);

  return (
    <div className="space-y-4">
      {[
        { label: "Set up digit only", checked: digitOnly, onChange: setDigitOnly },
        { label: "Set up alphabet only", checked: alphabetOnly, onChange: setAlphabetOnly },
        { label: "Alphanumeric and character", checked: alphanumeric, onChange: setAlphanumeric },
      ].map(({ label, checked, onChange }) => (
        <label key={label} className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
          />
          <span className="text-sm text-primary-text">{label}</span>
        </label>
      ))}

      <div className="pt-1">
        <button
          type="button"
          className="rounded-full bg-primary-green px-6 py-2.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ── Main Password Policy Tab ── */
export function SettingsPasswordPolicyTab() {
  const [subTab, setSubTab] = useState<PolicySubTab>("expiry");

  const tabs: { id: PolicySubTab; label: string }[] = [
    { id: "expiry", label: "Expiry Configuration" },
    { id: "length", label: "Password Length" },
    { id: "combination", label: "Combination Setting" },
  ];

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="mb-6 flex items-center gap-6 rounded-full border border-zinc-100 bg-white px-5 py-3.5">
        {tabs.map(({ id, label }) => {
          const active = subTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`text-sm transition-colors ${
                active
                  ? "rounded-full bg-zinc-200 px-4.5 py-1.5 font-semibold text-primary-text"
                  : "font-medium text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content card */}
      <div className="w-[566px] rounded-xl border border-zinc-100 bg-white p-6">
        {subTab === "expiry" && <ExpiryConfiguration />}
        {subTab === "length" && <PasswordLength />}
        {subTab === "combination" && <CombinationSetting />}
      </div>
    </div>
  );
}
