"use client";

type ProductMgtSubTabsProps = {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
};

/** Second-level tabs: white active pill + dark underline on full-width divider */
export function ProductMgtSubTabs({ tabs, active, onChange }: ProductMgtSubTabsProps) {
  return (
    <div className="border-b border-zinc-200">
      <div className="flex flex-wrap items-end gap-8" role="tablist">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className="group relative pb-3 pt-0.5"
            >
              <span
                className={[
                  "inline-block text-sm transition-colors",
                  isActive
                    ? "rounded-full bg-white px-4 py-1.5 font-semibold text-primary-text shadow-sm"
                    : "font-medium text-zinc-400 group-hover:text-zinc-600",
                ].join(" ")}
              >
                {tab.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-text"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
