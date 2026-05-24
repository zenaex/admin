const CRYPTO_ICON_BY_CODE: Record<string, string> = {
  BTC: "https://cdn-icons-png.flaticon.com/128/5968/5968260.png",
  BNB: "https://cdn-icons-png.flaticon.com/128/14446/14446125.png",
  ADA: "https://cdn-icons-png.flaticon.com/128/10464/10464556.png",
  ETH: "https://cdn-icons-png.flaticon.com/128/16147/16147705.png",
  DOGE: "https://cdn-icons-png.flaticon.com/128/8744/8744148.png",
  TRX: "https://cdn-icons-png.flaticon.com/128/14446/14446268.png",
  SOL: "https://cdn-icons-png.flaticon.com/128/14446/14446237.png",
  USDT: "https://cdn-icons-png.flaticon.com/128/14446/14446252.png",
  USDC: "https://cdn-icons-png.flaticon.com/128/14446/14446284.png",
};

export function getCryptoIconUrl(code: string): string | undefined {
  const key = code.trim().toUpperCase();
  return CRYPTO_ICON_BY_CODE[key];
}
