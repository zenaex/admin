import type {
  ExchangeRateRow,
  ExchangeRateSubTab,
  GiftcardBrand,
  GiftcardDenomination,
  SwapPairMeta,
} from "@/components/product-mgt/product-mgt-types";

const DATE_SAMPLE = "Jan 6, 2026 | 9:32AM";

const FIAT_ROWS: ExchangeRateRow[] = [
  {
    id: "rate-usd",
    currencyCode: "USD",
    currencyName: "US Dollars",
    countryCode: "US",
    commissionType: "—",
    ourCommission: "—",
    baseRate: "—",
    finalRate: "$1/₦1000",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-ghs",
    currencyCode: "GHS",
    currencyName: "Ghana Cedis",
    countryCode: "GH",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "₦1/₵0.00086",
    finalRate: "₦1/₵0.00086",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-kes",
    currencyCode: "KES",
    currencyName: "Kenyan Shillings",
    countryCode: "KE",
    commissionType: "Percentage",
    ourCommission: "10%",
    baseRate: "₦1/₵0.00086",
    finalRate: "₦1/₵0.00086",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-zar",
    currencyCode: "ZAR",
    currencyName: "South African Rands",
    countryCode: "ZA",
    commissionType: "% capped @",
    ourCommission: "10%@₦50",
    baseRate: "₦1/₵0.00086",
    finalRate: "₦1/₵0.00086",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-xof",
    currencyCode: "XOF",
    currencyName: "CFA Franc",
    countryCode: "SN",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "₦1/₵0.00086",
    finalRate: "₦1/₵0.00086",
    dateUpdated: DATE_SAMPLE,
  },
];

const SELL_CRYPTO_ROWS: ExchangeRateRow[] = [
  {
    id: "rate-btc-sell",
    currencyCode: "BTC",
    currencyName: "Bitcoin",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-bnb-sell",
    currencyCode: "BNB",
    currencyName: "Binance Coin",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-ada-sell",
    currencyCode: "ADA",
    currencyName: "Cardano",
    commissionType: "Percentage",
    ourCommission: "10%",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-eth-sell",
    currencyCode: "ETH",
    currencyName: "Ethereum",
    commissionType: "% capped @",
    ourCommission: "10%@₦50",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-doge-sell",
    currencyCode: "DOGE",
    currencyName: "Dogecoin",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-trx-sell",
    currencyCode: "TRX",
    currencyName: "Tron",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-sol-sell",
    currencyCode: "SOL",
    currencyName: "Solana",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-usdt-sell",
    currencyCode: "USDT",
    currencyName: "Tether USD",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-usdc-sell",
    currencyCode: "USDC",
    currencyName: "USD Coin",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  },
];

function swapCryptoRow(
  id: string,
  pair: SwapPairMeta,
  ourCommission = "10% | 10%",
): ExchangeRateRow {
  return {
    id,
    swapPair: pair,
    currencyCode: `${pair.baseCode} ⇆ ${pair.quoteCode}`,
    currencyName: `${pair.baseName} & ${pair.quoteName}`,
    commissionType: "Percentage",
    ourCommission,
    baseRate: "—",
    finalRate: "—",
    dateUpdated: DATE_SAMPLE,
  };
}

const SWAP_CRYPTO_ROWS: ExchangeRateRow[] = [
  swapCryptoRow("rate-swap-btc-eth", {
    baseCode: "BTC",
    baseName: "Bitcoin",
    quoteCode: "ETH",
    quoteName: "Ethereum",
  }),
  swapCryptoRow("rate-swap-bnb-eth", {
    baseCode: "BNB",
    baseName: "Binance Coin",
    quoteCode: "ETH",
    quoteName: "Ethereum",
  }),
  swapCryptoRow("rate-swap-btc-usdt", {
    baseCode: "BTC",
    baseName: "Bitcoin",
    quoteCode: "USDT",
    quoteName: "Tether USD",
  }),
  swapCryptoRow("rate-swap-sol-usdt", {
    baseCode: "SOL",
    baseName: "Solana",
    quoteCode: "USDT",
    quoteName: "Tether USD",
  }),
  swapCryptoRow("rate-swap-eth-usdc", {
    baseCode: "ETH",
    baseName: "Ethereum",
    quoteCode: "USDC",
    quoteName: "USD Coin",
  }),
];

const GIFTCARD_ROWS: ExchangeRateRow[] = [
  {
    id: "rate-gift-us",
    currencyCode: "USD",
    currencyName: "US Giftcard",
    countryCode: "US",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    baseRate: "$1/₦1000",
    finalRate: "$1/₦1050",
    dateUpdated: DATE_SAMPLE,
  },
  {
    id: "rate-gift-uk",
    currencyCode: "GBP",
    currencyName: "UK Giftcard",
    countryCode: "GB",
    commissionType: "Percentage",
    ourCommission: "2%",
    baseRate: "£1/₦1200",
    finalRate: "£1/₦1224",
    dateUpdated: DATE_SAMPLE,
  },
];

export const EXCHANGE_RATE_SUB_TABS: { id: ExchangeRateSubTab; label: string; sectionTitle: string }[] = [
  { id: "fiat", label: "Fiat", sectionTitle: "Fiat Currencies" },
  { id: "sell-crypto", label: "Sell Crypto", sectionTitle: "Sell Crypto" },
  { id: "swap-crypto", label: "Swap Crypto", sectionTitle: "Swap Crypto" },
  { id: "giftcard", label: "Giftcard", sectionTitle: "Giftcard" },
];

export function getExchangeRateRows(subTab: ExchangeRateSubTab): ExchangeRateRow[] {
  switch (subTab) {
    case "fiat":
      return FIAT_ROWS;
    case "sell-crypto":
      return SELL_CRYPTO_ROWS;
    case "swap-crypto":
      return SWAP_CRYPTO_ROWS;
    case "giftcard":
      return GIFTCARD_ROWS;
    default:
      return FIAT_ROWS;
  }
}

/* ── Giftcard brand icons (CDN) ── */
const GIFTCARD_BRAND_ICONS: Record<string, string> = {
  Apple: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/giftcard-email-melted-select-2021?wid=600&hei=600&fmt=png-alpha&.v=cmFiSThEbmZYZWVpRG00T0ExbSszU3A4MlMxaGc1aS9hTndmYXZ0SnpULy9uYUsvSnlTVzV4bm9DUDN2emtpOHV5NVU0QmM2b3hmeWJWTTVtN1o5ZnVpSkJSbnVKUTBZd083SHpOZElaVmwrYWpGdS9XeFgvbS9ITnNYOEhYaG4",
  Amazon: "https://icon2.cleanpng.com/lnd/20241213/pz/74d97a469873774f841633779c982d.webp",
  "Google Play": "https://cdn-icons-png.flaticon.com/128/888/888857.png",
  Steam: "https://cdn-icons-png.flaticon.com/128/3670/3670382.png",
  Razer: "https://cdn-icons-png.flaticon.com/128/5969/5969184.png",
};

export function getGiftcardBrandIcon(brandName: string): string | undefined {
  const key = Object.keys(GIFTCARD_BRAND_ICONS).find((k) =>
    brandName.toLowerCase().startsWith(k.toLowerCase()),
  );
  return key ? GIFTCARD_BRAND_ICONS[key] : undefined;
}

type GiftcardBrandFixture = Omit<GiftcardBrand, "denominations"> & {
  denominations: Omit<GiftcardDenomination, "category">[];
};

/* ── Giftcard brands (hierarchical fixture data) ── */
const GIFTCARD_BRANDS: GiftcardBrandFixture[] = [
  {
    id: "gc-apple-ecode",
    brandName: "Apple",
    brandType: "E-code",
    country: "United State",
    countryCode: "US",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    rmbRate: "¥203.50",
    iconUrl: GIFTCARD_BRAND_ICONS.Apple,
    denominations: [
      {
        id: "gc-apple-ecode-20-49",
        label: "Apple Ecode | $20 - $49",
        vendorRate: "$5.18",
        finalRate: "$1/₦1200",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-apple-ecode-50",
        label: "Amazon Ecode | $50",
        vendorRate: "Percentage",
        finalRate: "$1/₦1200",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-apple-ecode-100-200",
        label: "Amazon Ecode | $100/200",
        vendorRate: "% capped @",
        finalRate: "$1/₦1200",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-apple-ecode-150-450",
        label: "Amazon Ecode | $150/250/350/450",
        vendorRate: "Flat",
        finalRate: "$1/₦1200",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-apple-ecode-300-450",
        label: "Amazon Ecode | $300/250/350/450",
        vendorRate: "¥6.30",
        finalRate: "$1/₦1200",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
    ],
  },
  {
    id: "gc-amazon-physical",
    brandName: "Amazon",
    brandType: "Physical",
    country: "United State",
    countryCode: "US",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    rmbRate: "$1/ ₦1350",
    iconUrl: GIFTCARD_BRAND_ICONS.Amazon,
    denominations: [
      {
        id: "gc-amazon-phys-25",
        label: "Amazon Physical | $25",
        vendorRate: "$4.20",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-amazon-phys-50",
        label: "Amazon Physical | $50",
        vendorRate: "Flat",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-amazon-phys-100",
        label: "Amazon Physical | $100",
        vendorRate: "Percentage",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
    ],
  },
  {
    id: "gc-apple-physical",
    brandName: "Apple",
    brandType: "Physical",
    country: "United State",
    countryCode: "US",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    rmbRate: "$1/ ₦1350",
    iconUrl: GIFTCARD_BRAND_ICONS.Apple,
    denominations: [
      {
        id: "gc-apple-phys-25",
        label: "Apple Physical | $25",
        vendorRate: "$3.80",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-apple-phys-50",
        label: "Apple Physical | $50",
        vendorRate: "Flat",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
    ],
  },
  {
    id: "gc-google-physical",
    brandName: "Google Play",
    brandType: "Physical",
    country: "United State",
    countryCode: "US",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    rmbRate: "$1/ ₦1350",
    iconUrl: GIFTCARD_BRAND_ICONS["Google Play"],
    denominations: [
      {
        id: "gc-google-phys-25",
        label: "Google Play Physical | $25",
        vendorRate: "$4.00",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
      {
        id: "gc-google-phys-50",
        label: "Google Play Physical | $50",
        vendorRate: "Flat",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
    ],
  },
  {
    id: "gc-amazon-physical-2",
    brandName: "Amazon",
    brandType: "Physical",
    country: "United State",
    countryCode: "US",
    commissionType: "Flat",
    ourCommission: "₦50 FLAT",
    rmbRate: "$1/ ₦1350",
    iconUrl: GIFTCARD_BRAND_ICONS.Amazon,
    denominations: [
      {
        id: "gc-amazon-phys2-25",
        label: "Amazon Physical | $25",
        vendorRate: "$4.50",
        finalRate: "$1/₦1350",
        dateUpdated: DATE_SAMPLE,
        status: "Active",
      },
    ],
  },
];

export function getGiftcardBrands(): GiftcardBrand[] {
  return GIFTCARD_BRANDS.map((brand) => ({
    ...brand,
    denominations: brand.denominations.map((d) => ({
      ...d,
      category: d.label,
    })),
  }));
}

