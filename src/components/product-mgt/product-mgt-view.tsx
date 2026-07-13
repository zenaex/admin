"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardReceive, CardSend, ChartSquare, WalletMoney } from "iconsax-react";
import { ExchangeRatesPanel } from "@/components/product-mgt/exchange-rates-panel";
import { ProductMgtMainTabs } from "@/components/product-mgt/product-mgt-main-tabs";
import { PRODUCT_MGT_STATS } from "@/components/product-mgt/product-mgt-stats";
import type { ProductMgtMainTab, ProductMgtStats } from "@/components/product-mgt/product-mgt-types";
import { ProductsPanel } from "@/components/product-mgt/products-panel";
import { ProviderHeader } from "@/components/provider/provider-header";
import { StatCard } from "@/components/ui/stat-card";
import { getAdminProductsSummary } from "@/lib/admin-api/products-api";

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
  const [stats, setStats] = useState<ProductMgtStats>(PRODUCT_MGT_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    setMainTab(parseMainTab(tabFromUrl));
  }, [tabFromUrl]);

  useEffect(() => {
    setStatsLoading(true);
    getAdminProductsSummary()
      .then((data) => setStats(data))
      .catch((err) => console.error("Error loading product stats summary:", err))
      .finally(() => setStatsLoading(false));
  }, []);

  const setTab = (id: ProductMgtMainTab) => {
    setMainTab(id);
    const qs = id === "products" ? "" : `?tab=${id}`;
    router.replace(`/dashboard/product-mgt${qs}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-6">
      <ProviderHeader title="Product & Rate Management" />

      <div className="flex gap-3">
        <StatCard
          label="Total Products"
          loading={statsLoading}
          value={stats.totalProducts}
          accentColor="var(--color-primary-green)"
          icon={<WalletMoney size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Active Products"
          loading={statsLoading}
          value={stats.activeProducts}
          accentColor="var(--color-vivid-azure)"
          icon={<CardReceive size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Crypto"
          loading={statsLoading}
          value={stats.totalCrypto}
          accentColor="var(--color-primary-green)"
          icon={<ChartSquare size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Currencies"
          loading={statsLoading}
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
