"use client";

import { useState } from "react";
import { SettingsHeader } from "@/components/settings/settings-header";
import { SettingsTabs, SettingsTabId } from "@/components/settings/settings-tabs";
import { SettingsProfileTab } from "@/components/settings/settings-profile-tab";
import { SettingsPasswordTab } from "@/components/settings/settings-password-tab";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");

  return (
    <div>
      <SettingsHeader />

      <div className="mt-6 rounded-xl px-6 pt-5 pb-6">
        <SettingsTabs active={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === "profile" && <SettingsProfileTab />}
          {activeTab === "password" && <SettingsPasswordTab />}
          {activeTab === "password-policy" && (
            <p className="text-sm text-zinc-400">Password policy settings coming soon.</p>
          )}
          {activeTab === "authentication" && (
            <p className="text-sm text-zinc-400">Authentication settings coming soon.</p>
          )}
        </div>
      </div>
    </div>
  );
}
