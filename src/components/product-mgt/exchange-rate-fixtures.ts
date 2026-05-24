import type {
  ExchangeRateRow,
  ExchangeRateSubTab,
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
