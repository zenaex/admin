"use client";

export type AuditTrailTabId = "internal" | "customers";

type AuditTrailTabsProps = {
  active: AuditTrailTabId;
  onChange: (id: AuditTrailTabId) => void;
};

const AUDIT_TABS: { id: AuditTrailTabId; label: string }[] = [
  { id: "internal", label: "Internal Users" },
  { id: "customers", label: "Customers" },
];

export function AuditTrailTabs({ active, onChange }: AuditTrailTabsProps) {
  return (
    <UnderlineTabs
      tabs={AUDIT_TABS}
      active={active}
      onChange={onChange as (id: string) => void}
    />
  );
}

/* ── Generic reusable underline tab bar ── */
type UnderlineTabsProps = {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
};

export function UnderlineTabs({ tabs, active, onChange }: UnderlineTabsProps) {
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
