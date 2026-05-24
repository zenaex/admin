"use client";

import type { ProductMgtMainTab } from "@/components/product-mgt/product-mgt-types";

type ProductMgtMainTabsProps = {
  tabs: { id: ProductMgtMainTab; label: string }[];
  active: ProductMgtMainTab;
  onChange: (id: ProductMgtMainTab) => void;
};

/** Segmented pill switcher: Products | Exchange Rates (centered, fixed width) */
export function ProductMgtMainTabs({ tabs, active, onChange }: ProductMgtMainTabsProps) {
  return (
    <div className="flex w-full justify-center">
      <div
        className="inline-flex w-[min(100%,22rem)] rounded-full bg-zinc-100 p-1 sm:w-[24rem]"
        role="tablist"
        aria-label="Product management sections"
      >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={[
              "flex-1 rounded-full px-4 py-2.5 text-sm transition-all duration-200",
              isActive
                ? "bg-white font-semibold text-primary-text shadow-sm"
                : "font-medium text-zinc-400 hover:text-zinc-600",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
