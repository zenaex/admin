"use client";

import { useState } from "react";
import { SettingsPasswordReset } from "@/components/settings/settings-password-reset";
import { ResetRequestsTable } from "@/components/settings/settings-reset-requests";

type PasswordSubTab = "reset" | "requests";

export function SettingsPasswordTab() {
  const [subTab, setSubTab] = useState<PasswordSubTab>("reset");

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="mb-6 flex items-center gap-6 rounded-full border border-zinc-100 bg-white px-5 py-3.5">
        {(["reset", "requests"] as PasswordSubTab[]).map((id) => {
          const label = id === "reset" ? "Password Reset" : "Reset Requests";
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

      {subTab === "reset" && <SettingsPasswordReset />}
      {subTab === "requests" && <ResetRequestsTable />}
    </div>
  );
}
