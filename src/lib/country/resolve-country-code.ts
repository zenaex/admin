/** ISO 3166-1 alpha-2 from currency or country hints. */
const CURRENCY_TO_ISO: Record<string, string> = {
  USD: "US",
  GHS: "GH",
  KES: "KE",
  ZAR: "ZA",
  XOF: "SN",
  NGN: "NG",
  GBP: "GB",
  BTC: "",
  ETH: "",
  USDT: "US",
};

const NAME_TO_ISO: Record<string, string> = {
  "united states": "US",
  "us dollars": "US",
  ghana: "GH",
  "ghana cedis": "GH",
  kenya: "KE",
  "kenyan shillings": "KE",
  "south africa": "ZA",
  "south african rands": "ZA",
  "cfa franc": "SN",
  nigeria: "NG",
  "united kingdom": "GB",
};

export function currencyCodeToCountryCode(currencyCode: string): string | null {
  const code = currencyCode.trim().toUpperCase();
  if (!code) return null;
  return CURRENCY_TO_ISO[code] ?? null;
}

export function resolveCountryCodeFromLabel(label: string): string | null {
  const t = label.trim().toLowerCase();
  if (!t) return null;
  for (const [key, iso] of Object.entries(NAME_TO_ISO)) {
    if (t.includes(key)) return iso;
  }
  return null;
}

export function resolveCountryCode(currencyCode: string, currencyName?: string): string | null {
  return (
    currencyCodeToCountryCode(currencyCode) ||
    (currencyName ? resolveCountryCodeFromLabel(currencyName) : null)
  );
}
