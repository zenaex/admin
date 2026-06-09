/**
 * Backend monetary amounts for NGN (and NGN-denominated fields) are returned in kobo.
 * Convert for display with `/100`; convert back when posting with `*100`.
 */
export const KOBO_PER_NAIRA = 100;

export function koboToMajor(kobo: number): number {
  return kobo / KOBO_PER_NAIRA;
}

export function majorToKobo(major: number): number {
  return Math.round(major * KOBO_PER_NAIRA);
}

export function pickKobo(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

export function pickStringField(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function formatNgnMajor(major: number): string {
  return `₦${major.toLocaleString()}`;
}

export function formatKoboAsNgn(kobo: number | undefined): string {
  if (kobo === undefined) return "";
  return formatNgnMajor(koboToMajor(kobo));
}

export function formatKoboAmountDisplay(kobo: number | undefined, currency?: string): string {
  if (kobo === undefined) return "";
  const major = koboToMajor(kobo);
  const cur = (currency || "NGN").trim().toUpperCase();
  if (!cur || cur === "NGN" || cur === "₦" || cur === "NAIRA") return formatNgnMajor(major);
  return `${cur} ${major.toLocaleString()}`;
}

/**
 * Read a kobo field and format for UI, or pass through a pre-formatted string from the API.
 */
export function pickAndFormatMoneyField(
  o: Record<string, unknown>,
  keys: string[],
  currency = "NGN",
): string {
  const kobo = pickKobo(o, keys);
  if (kobo !== undefined) return formatKoboAmountDisplay(kobo, currency);
  const preformatted = pickStringField(o, keys);
  if (!preformatted) return "";
  if (/^[₦$€£¥]/.test(preformatted) || /[/,]/.test(preformatted)) return preformatted;
  const asNum = Number(preformatted.replace(/[^\d.-]/g, ""));
  if (Number.isFinite(asNum) && preformatted.replace(/[^\d.-]/g, "") !== "") {
    return formatKoboAmountDisplay(asNum, currency);
  }
  return preformatted;
}

/** Like `pickAndFormatMoneyField`, but searches nested blocks first. */
export function pickAndFormatMoneyFromBlocks(
  o: Record<string, unknown>,
  blocks: Record<string, unknown>[],
  keys: string[],
  currency = "NGN",
): string {
  for (const block of blocks) {
    const kobo = pickKobo(block, keys);
    if (kobo !== undefined) return formatKoboAmountDisplay(kobo, currency);
  }
  return pickAndFormatMoneyField(o, keys, currency);
}

/** Summary/list numeric amounts from API are kobo → major for charts and stat cards. */
export function koboSummaryToMajor(value: number | string | undefined): number | string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return koboToMajor(value);
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return undefined;
    if (/^[₦$]/.test(t) || t.includes("/")) return t;
    const n = Number(t.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n) && t.replace(/[^\d.-]/g, "") !== "") return koboToMajor(n);
    return t;
  }
  return undefined;
}

export function parseMajorAmountInput(input: string): number {
  const n = Number(input.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function parseMajorAmountInputAsKobo(input: string): number {
  return majorToKobo(parseMajorAmountInput(input));
}
