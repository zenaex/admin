// Shared type definitions for the product management features
export type ProductTab = "All" | "Utility" | "Crypto" | "Giftcard" | "E-sim";
export type ProductStatus = "Active" | "Inactive";

export type ProductRow = {
  id: string;
  productName: string;
  productCategory: string;
  commissionType: string;
  commissionRate: string;
  cap: string;
  switchProvider: string;
  status: ProductStatus;
};

export type ProductMgtMainTab = "products" | "exchange-rates";

export type ExchangeRateSubTab = "fiat" | "sell-crypto" | "swap-crypto" | "giftcard";

export type SwapPairMeta = {
  baseCode: string;
  baseName: string;
  quoteCode: string;
  quoteName: string;
};

export type ExchangeRateRow = {
  id: string;
  currencyCode: string;
  currencyName: string;
  countryCode?: string | null;
  /** Swap Crypto rows: two-asset pair metadata */
  swapPair?: SwapPairMeta;
  commissionType: string;
  ourCommission: string;
  baseRate: string;
  finalRate: string;
  dateUpdated: string;
};

export type GiftcardStatus = "Active" | "Inactive";

export type GiftcardDenomination = {
  id: string;
  label: string;
  vendorRate: string;
  finalRate: string;
  dateUpdated: string;
  status: GiftcardStatus;
};

export type GiftcardBrand = {
  id: string;
  brandName: string;
  brandType: "E-code" | "Physical";
  country: string;
  countryCode: string;
  commissionType: string;
  ourCommission: string;
  rmbRate: string;
  iconUrl?: string;
  denominations: GiftcardDenomination[];
};

export type ProductMgtStats = {
  totalProducts: string;
  activeProducts: string;
  totalCrypto: string;
  totalCurrencies: string;
};
