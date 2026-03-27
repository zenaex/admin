"use client";

export type SettingsTabId = "profile" | "password" | "password-policy" | "authentication";

type SettingsTabsProps = {
  active: SettingsTabId;
  onChange: (id: SettingsTabId) => void;
};

const tabs: { id: SettingsTabId; label: string }[] = [
  { id: "profile",         label: "Profile"         },
  { id: "password",        label: "Password"        },
  { id: "password-policy", label: "Password Policy" },
  { id: "authentication",  label: "Authentication"  },
];

export function SettingsTabs({ active, onChange }: SettingsTabsProps) {
  return (
    <div className="flex items-baseline gap-8 border-b border-zinc-200">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <div key={tab.id} className="relative inline-flex w-fit flex-col">
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={[
                "text-sm font-medium leading-5 transition-colors",
                isActive
                  ? "mb-2 rounded-full border border-white bg-white px-5 py-2.5 text-secondary-green"
                  : "border-b-2 border-transparent pb-3 pt-2.5 text-zinc-500 hover:text-zinc-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
            {isActive && (
              <div className="pointer-events-none -mb-px h-0.5 w-full bg-secondary-green" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
