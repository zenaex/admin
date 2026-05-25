export type MarkupType = "Flat" | "Percentage" | "% capped @";

export type RateFormValues = {
  baseRate: string;
  markupType: MarkupType;
  markupRate: string;
};

/** Sell crypto flow — markup only (no base rate). */
export type MarkupFormValues = {
  markupType: MarkupType;
  markupRate: string;
};

/** Swap crypto pair — bidirectional markup rates. */
export type SwapPairFormValues = {
  markupType: MarkupType;
  baseToQuoteRate: string;
  quoteToBaseRate: string;
};

const NGN_BASE = {
  code: "NGN",
  name: "Nigeria Naira",
  countryCode: "NG",
} as const;

export function parseNumericInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseMarkupFromRow(
  commissionType: string,
  ourCommission: string,
): Pick<RateFormValues, "markupType" | "markupRate"> {
  const type = commissionType.trim();
  if (type === "Flat" || type === "Percentage" || type === "% capped @") {
    const rate =
      parseNumericInput(ourCommission) !== null
        ? String(parseNumericInput(ourCommission))
        : ourCommission.replace(/[^\d.]/g, "") || "200";
    return { markupType: type, markupRate: rate || "200" };
  }
  return { markupType: "Flat", markupRate: "200" };
}

export function parseBaseRateFromRow(baseRate: string): string {
  const n = parseNumericInput(baseRate);
  if (n !== null) return String(n);
  const slashMatch = baseRate.match(/₦([\d,.]+)/);
  if (slashMatch) {
    const fromSlash = parseNumericInput(slashMatch[1]);
    if (fromSlash !== null) return String(fromSlash);
  }
  return "200";
}

export function parseFormFromRow(row: {
  commissionType: string;
  ourCommission: string;
  baseRate: string;
}): RateFormValues {
  const { markupType, markupRate } = parseMarkupFromRow(row.commissionType, row.ourCommission);
  return {
    baseRate: parseBaseRateFromRow(row.baseRate),
    markupType,
    markupRate,
  };
}

export function formatOurCommission(markupType: MarkupType, markupRate: string): string {
  const n = parseNumericInput(markupRate) ?? 0;
  if (markupType === "Percentage") return `${n}%`;
  if (markupType === "% capped @") return `${n}%@₦50`;
  return `₦${n.toLocaleString()} FLAT`;
}

/** Display strings for confirm summary (GHS example: ₵1/₦120.00 + flat 50 → ₵1/₦170.00). */
export function buildRatePreview(form: RateFormValues, targetCurrencyCode: string) {
  const baseNum = parseNumericInput(form.baseRate) ?? 200;
  const markupNum = parseNumericInput(form.markupRate) ?? 0;

  let finalNgn = baseNum;
  if (form.markupType === "Percentage") {
    finalNgn = baseNum + (baseNum * markupNum) / 100;
  } else if (form.markupType === "Flat" || form.markupType === "% capped @") {
    finalNgn = baseNum + markupNum;
  }

  const targetSymbol =
    targetCurrencyCode === "GHS"
      ? "₵"
      : targetCurrencyCode === "USD"
        ? "$"
        : targetCurrencyCode === "GBP"
          ? "£"
          : "";

  const baseRateDisplay = targetSymbol
    ? `${targetSymbol}1/₦${baseNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₦1/${targetCurrencyCode} ${baseNum}`;

  const finalRateDisplay = targetSymbol
    ? `${targetSymbol}1/₦${finalNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₦1/${targetCurrencyCode} ${finalNgn}`;

  return {
    baseRateDisplay,
    markupTypeLabel: form.markupType === "Flat" ? "Flat Rate" : form.markupType,
    ourMarkupDisplay:
      form.markupType === "Flat"
        ? `₦${markupNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : form.markupType === "Percentage"
          ? `${markupNum}%`
          : `${markupNum}%@₦50`,
    finalRateDisplay,
    baseRateForRow: baseRateDisplay,
    finalRateForRow: finalRateDisplay,
  };
}

export function parseMarkupFormFromRow(row: {
  commissionType: string;
  ourCommission: string;
}): MarkupFormValues {
  return parseMarkupFromRow(row.commissionType, row.ourCommission);
}

export function formatMarkupTypeLabel(markupType: MarkupType): string {
  if (markupType === "Flat") return "Flat Rate";
  if (markupType === "Percentage") return "Percentage Rate";
  return markupType;
}

export function formatMarkupRateDisplay(markupType: MarkupType, markupRate: string): string {
  const n = parseNumericInput(markupRate) ?? 0;
  if (markupType === "Percentage") return `${n}%`;
  if (markupType === "% capped @") return `${n}%@₦50`;
  return `₦${n.toLocaleString()} FLAT`;
}

export function markupRateInputValue(markupType: MarkupType, markupRate: string): string {
  const n = parseNumericInput(markupRate);
  if (n === null) return markupRate;
  if (markupType === "Percentage") return `${n}%`;
  return String(n);
}

function parseMarkupTypeFromRow(commissionType: string): MarkupType {
  const type = commissionType.trim();
  if (type === "Flat" || type === "Percentage" || type === "% capped @") return type;
  return "Percentage";
}

function parseRatePart(value: string, fallback = "20"): string {
  const n = parseNumericInput(value);
  if (n !== null) return String(n);
  return fallback;
}

export function parseSwapPairFormFromRow(row: {
  commissionType: string;
  ourCommission: string;
}): SwapPairFormValues {
  const parts = row.ourCommission.split("|").map((p) => p.trim());
  return {
    markupType: parseMarkupTypeFromRow(row.commissionType),
    baseToQuoteRate: parseRatePart(parts[0] ?? "20%"),
    quoteToBaseRate: parseRatePart(parts[1] ?? parts[0] ?? "20%"),
  };
}

export function formatSwapPairOurCommission(form: SwapPairFormValues): string {
  const left = formatMarkupRateDisplay(form.markupType, form.baseToQuoteRate);
  const right = formatMarkupRateDisplay(form.markupType, form.quoteToBaseRate);
  return `${left} | ${right}`;
}

export function getNgnBase() {
  return NGN_BASE;
}

export function formatUpdatedDate(): string {
  const d = new Date();
  const datePart = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} | ${timePart}`;
}
