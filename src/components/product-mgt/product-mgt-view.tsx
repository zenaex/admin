"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardReceive, CardSend, ChartSquare, WalletMoney } from "iconsax-react";
import { ExchangeRatesPanel } from "@/components/product-mgt/exchange-rates-panel";
import { ProductMgtMainTabs } from "@/components/product-mgt/product-mgt-main-tabs";
import { PRODUCT_MGT_STATS } from "@/components/product-mgt/product-mgt-stats";
import type { ProductMgtMainTab } from "@/components/product-mgt/product-mgt-types";
import { ProductsPanel } from "@/components/product-mgt/products-panel";
import { ProviderHeader } from "@/components/provider/provider-header";
import { StatCard } from "@/components/ui/stat-card";

const MAIN_TABS: { id: ProductMgtMainTab; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "exchange-rates", label: "Exchange Rates" },
];

function parseMainTab(value: string | null): ProductMgtMainTab {
  if (value === "exchange-rates") return "exchange-rates";
  return "products";
}

export function ProductMgtView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get("tab") ?? null;
  const [mainTab, setMainTab] = useState<ProductMgtMainTab>(() => parseMainTab(tabFromUrl));

  useEffect(() => {
    setMainTab(parseMainTab(tabFromUrl));
  }, [tabFromUrl]);

  const setTab = (id: ProductMgtMainTab) => {
    setMainTab(id);
    const qs = id === "products" ? "" : `?tab=${id}`;
    router.replace(`/dashboard/product-mgt${qs}`, { scroll: false });
  };

  const stats = PRODUCT_MGT_STATS;

  return (
    <div>
      <ProviderHeader title="Product & Rate Management" />

      <div className="mt-6 flex gap-3">
        <StatCard
          label="Total Products"
          value={stats.totalProducts}
          accentColor="var(--color-primary-green)"
          icon={<WalletMoney size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Active Products"
          value={stats.activeProducts}
          accentColor="var(--color-vivid-azure)"
          icon={<CardReceive size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Crypto"
          value={stats.totalCrypto}
          accentColor="var(--color-primary-green)"
          icon={<ChartSquare size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Currencies"
          value={stats.totalCurrencies}
          accentColor="var(--color-failed)"
          icon={<CardSend size={20} variant="Outline" color="currentColor" />}
        />
      </div>

      <div className="mt-6">
        <ProductMgtMainTabs tabs={MAIN_TABS} active={mainTab} onChange={setTab} />
      </div>

      {mainTab === "products" ? <ProductsPanel /> : <ExchangeRatesPanel />}
    </div>
  );
}
