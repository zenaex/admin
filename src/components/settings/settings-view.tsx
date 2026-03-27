"use client";

import { useState } from "react";
import { ArrowDown2 } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { SettingsTabs, SettingsTabId } from "@/components/settings/settings-tabs";
import { SettingsProfileTab } from "@/components/settings/settings-profile-tab";
import { SettingsPasswordTab } from "@/components/settings/settings-password-tab";
import { SettingsPasswordPolicyTab } from "@/components/settings/settings-password-policy-tab";
import { SettingsAuthenticationTab } from "@/components/settings/settings-authentication-tab";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");

  return (
    <div>
      {/* Header row: title + search + action — all on one line */}
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-primary-text shrink-0 text-[20px] font-semibold tracking-tight">
          Settings
        </h1>
        <div className="flex min-w-0 flex-1 justify-center">
          <div className="h-10 w-[382px] shrink-0">
            <AuditTrailIconSearch variant="header" placeholder="Search here..." aria-label="Search" />
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-50"
          >
            Action
            <ArrowDown2 size={14} variant="Outline" color="currentColor" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="mt-8">
        <SettingsTabs active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-6">
        {activeTab === "profile" && <SettingsProfileTab />}
        {activeTab === "password" && <SettingsPasswordTab />}
        {activeTab === "password-policy" && <SettingsPasswordPolicyTab />}
        {activeTab === "authentication" && <SettingsAuthenticationTab />}
      </div>
    </div>
  );
}
