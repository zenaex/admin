export type CryptoOption = {
  code: string;
  name: string;
};

export const CRYPTO_OPTIONS: CryptoOption[] = [
  { code: "BTC", name: "Bitcoin" },
  { code: "BNB", name: "Binance Coin" },
  { code: "ADA", name: "Cardano" },
  { code: "ETH", name: "Ethereum" },
  { code: "DOGE", name: "Dogecoin" },
  { code: "TRX", name: "Tron" },
  { code: "SOL", name: "Solana" },
  { code: "USDT", name: "Tether USD" },
  { code: "USDC", name: "USD Coin" },
];

export function findCryptoOption(code: string): CryptoOption | undefined {
  return CRYPTO_OPTIONS.find((c) => c.code === code);
}
