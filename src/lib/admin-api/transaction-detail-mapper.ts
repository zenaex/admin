import {
  formatKoboAmountDisplay,
  pickAndFormatMoneyField,
  pickAndFormatMoneyFromBlocks,
  pickKobo,
} from "@/lib/admin-api/money";
import { resolveGiftcardSubmissionId } from "@/lib/admin-api/giftcard-submissions-api";
import {
  asRecord,
  formatDisplayDate,
  formatPersonName,
  pickNestedRecord,
  pickNestedString,
  pickNum,
  pickProviderLabel,
  pickString,
  flattenTransactionRecord,
  readChannelRaw,
  readDateRaw,
  readStatusRaw,
} from "@/lib/admin-api/transactions-api";
import type { TxApprovalStatus } from "@/components/transactions/transaction-details/types";
import {
  EMPTY_TRANSACTION_DETAIL_MODEL,
  type CryptoDetailVariant,
  type DepositDetailVariant,
  type EsimTransactionOutcome,
  type TransactionDetailChannel,
  type TransactionDetailModel,
  type UtilityDetailVariant,
} from "@/components/transactions/transaction-detail-model";

export type TransactionLogEntry = {
  step: number;
  title: string;
  date: string;
};

export const ISO_TO_FULL_NAME: Record<string, string> = {
  US: "United States",
  USA: "United States",
  DE: "Germany",
  NG: "Nigeria",
  GB: "United Kingdom",
  UK: "United Kingdom",
  GH: "Ghana",
  KE: "Kenya",
  ZA: "South Africa",
  CA: "Canada",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  CN: "China",
  JP: "Japan",
  IN: "India",
  AU: "Australia",
  NZ: "New Zealand",
  IE: "Ireland",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  SE: "Sweden",
  NO: "Norway",
  FI: "Finland",
  DK: "Denmark",
  SG: "Singapore",
  HK: "Hong Kong",
  MY: "Malaysia",
  AE: "United Arab Emirates",
  BR: "Brazil",
  MX: "Mexico",
};

function channelKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      return asRecord(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
  return null;
}

function providerLogSources(o: Record<string, unknown>): unknown[] {
  const meta = asRecord(o.metadata) ?? asRecord(o.meta);
  const sources: unknown[] = [o.providerLog, o.provider_log];
  if (meta) {
    sources.push(meta.providerLog, meta.provider_log);
  }
  return sources;
}

function readProviderLogRequestPayload(o: Record<string, unknown>): Record<string, unknown> | null {
  for (const value of providerLogSources(o)) {
    const logRec = parseJsonRecord(value);
    if (!logRec) continue;
    const request =
      asRecord(logRec.request_payload) ??
      asRecord(logRec.requestPayload) ??
      asRecord(logRec.request);
    if (request) return request;
  }
  return null;
}

function readProviderLogResponsePayload(o: Record<string, unknown>): Record<string, unknown> | null {
  for (const value of providerLogSources(o)) {
    const logRec = parseJsonRecord(value);
    if (!logRec) continue;
    const response =
      asRecord(logRec.response_payload) ??
      asRecord(logRec.responsePayload) ??
      asRecord(logRec.response);
    if (response) return response;
  }
  return null;
}

const DATA_BUNDLE_FIELD_KEYS = [
  "dataBundle",
  "data_bundle",
  "bundle",
  "planCode",
  "plan_code",
  "packageCode",
  "package_code",
  "dataPlan",
  "data_plan",
];

function pickDataBundleFromRecord(rec: Record<string, unknown>): string {
  const direct = pickString(rec, DATA_BUNDLE_FIELD_KEYS);
  if (direct) return direct;
  return (
    pickNestedString(rec, [
      ["dataBundle", "code"],
      ["dataBundle", "name"],
      ["dataBundle", "value"],
      ["data_bundle", "code"],
      ["bundle", "code"],
      ["bundle", "name"],
      ["product", "dataBundle"],
      ["metadata", "dataBundle"],
      ["meta", "dataBundle"],
      ["request", "dataBundle"],
      ["request_payload", "dataBundle"],
    ]) || ""
  );
}

/** Resolve raw data bundle / plan code from transaction payload (incl. provider log). */
export function readDataBundleRaw(o: Record<string, unknown>): string {
  let found = pickDataBundleFromRecord(o);
  if (found) return found;

  const request = readProviderLogRequestPayload(o);
  if (request) {
    found = pickDataBundleFromRecord(request);
    if (found) return found;
  }

  const response = readProviderLogResponsePayload(o);
  if (response) {
    found = pickDataBundleFromRecord(response);
    if (found) return found;
  }

  for (const value of providerLogSources(o)) {
    const logRec = parseJsonRecord(value);
    if (!logRec) continue;
    found = pickDataBundleFromRecord(logRec);
    if (found) return found;
  }

  const productSlug = pickString(o, ["productSlug", "product_slug"]);
  if (productSlug && /\d+(\.\d+)?gb/i.test(productSlug) && /\d+d/i.test(productSlug)) {
    return productSlug;
  }

  const productName = pickString(o, ["product", "productName", "product_name"]);
  if (productName && /\d+(\.\d+)?gb/i.test(productName) && /\d+d/i.test(productName)) {
    return productName;
  }

  return (
    pickString(o, ["plan", "planName", "plan_name"]) ||
    pickNestedString(o, [
      ["metadata", "dataBundle"],
      ["meta", "dataBundle"],
      ["product", "dataBundle"],
      ["product", "plan"],
      ["plan", "name"],
    ]) ||
    ""
  );
}

function formatPayoutCurrencyLabel(code: string): string {
  const c = code.trim().toUpperCase();
  if (!c) return "";
  if (c === "NGN" || c === "NAIRA") return "Naira (NGN)";
  if (c === "USD") return "US Dollar (USD)";
  if (c === "GBP") return "British Pound (GBP)";
  if (c === "EUR") return "Euro (EUR)";
  return code.trim();
}

/** e.g. `MTN-SME-1GB-30D` → `1GB 30days` */
export function formatDataBundleDisplay(raw: string): string {
  const t = raw.trim().replace(/^"|"$/g, "");
  if (!t) return "";

  const gbMatch = t.match(/(\d+(?:\.\d+)?)\s*GB/i);
  const dayMatch = t.match(/(\d+)\s*D(?!ata|evice)/i) ?? t.match(/(\d+)\s*days?/i);
  if (gbMatch && dayMatch) {
    return `${gbMatch[1]}GB ${dayMatch[1]}days`;
  }

  const parts = t.split(/[-_]/).filter(Boolean);
  const gbPart = parts.find((p) => /^\d+(\.\d+)?gb$/i.test(p));
  const dayPart = parts.find((p) => /^\d+d$/i.test(p));
  if (gbPart && dayPart) {
    const size = gbPart.match(/^(\d+(?:\.\d+)?)/i)?.[1] ?? gbPart.replace(/gb$/i, "");
    const days = dayPart.replace(/d$/i, "");
    return `${size}GB ${days}days`;
  }

  return t;
}

function mapOutcome(statusRaw: string): EsimTransactionOutcome | null {
  if (!statusRaw.trim()) return null;
  const k = statusRaw.toLowerCase();
  if (k.includes("fail") || k.includes("reject")) return "Failed";
  if (k.includes("pending")) return "Pending";
  if (k.includes("success") || k.includes("complete") || k.includes("approve")) return "Successful";
  return null;
}

function mapGiftcardApproval(statusRaw: string): TxApprovalStatus | null {
  if (!statusRaw.trim()) return null;
  const k = statusRaw.toLowerCase();
  if (k.includes("reject") || k.includes("fail")) return "Rejected";
  if (k.includes("pending")) return "Pending";
  if (k.includes("success") || k.includes("approve")) return "Approved";
  return null;
}

function detailProvider(o: Record<string, unknown>): string {
  const p = pickProviderLabel(o);
  return p === "—" ? "" : p;
}

function formatAmountFromRecord(o: Record<string, unknown>): string {
  const amountBlock = pickNestedRecord(o, ["amount", "transactionAmount", "payment"]);
  const currency =
    pickString(o, ["currency", "asset", "currencyCode"]) ||
    (amountBlock ? pickString(amountBlock, ["currency", "code"]) : "") ||
    "";
  const amountKobo =
    pickKobo(o, ["amount", "value", "totalAmount", "transactionAmount", "amountPaid", "paidAmount"]) ??
    (amountBlock ? pickKobo(amountBlock, ["value", "amount", "total", "paid"]) : undefined);
  if (amountKobo !== undefined) {
    return formatKoboAmountDisplay(amountKobo, currency);
  }
  return (
    pickString(o, ["amountFormatted", "amount_display", "formattedAmount"]) ||
    (amountBlock ? pickString(amountBlock, ["formatted", "display"]) : "") ||
    ""
  );
}

function isDebitCreditLikeChannel(s: string): boolean {
  const k = channelKey(s);
  return k === "debit" || k === "credit" || k === "withdraw" || k === "withdrawal";
}

/** Prefer product/category/type signals over debit/credit channel labels. */
function buildUtilityVariantKey(o: Record<string, unknown>): string {
  const rawChannel = readChannelRaw(o);
  const channelPart = isDebitCreditLikeChannel(rawChannel) ? "" : channelKey(rawChannel);
  const parts = [
    pickString(o, ["categorySlug", "category_slug", "category"]),
    pickString(o, ["productSlug", "product_slug"]),
    pickString(o, ["product", "productName", "product_name"]),
    pickString(o, ["displayCategory", "display_category"]),
    pickString(o, ["transactionType", "transaction_type", "type"]),
    pickNestedString(o, [
      ["product", "name"],
      ["product", "type"],
      ["product", "category"],
      ["product", "slug"],
    ]),
    channelPart,
    pickString(o, ["subType", "subtype"]),
  ];
  return parts.map(channelKey).join("");
}

function detectUtilityVariant(o: Record<string, unknown>): UtilityDetailVariant {
  const key = buildUtilityVariantKey(o);

  if (key.includes("betting") || key.includes("sportybet")) return "electricity";
  if (key.includes("airtime") || key.includes("data")) return "data";
  if (key.includes("tv") || key.includes("cable")) return "tv";
  if (key.includes("electric")) return "electricity";
  return "electricity";
}

function detectCryptoVariant(o: Record<string, unknown>, combined: string): CryptoDetailVariant {
  if (combined.includes("swap")) return "swap";
  if (combined.includes("sell") && (combined.includes("deposit") || combined.includes("dep"))) return "sell_deposit";
  if (combined.includes("selldeposit")) return "sell_deposit";
  if (combined.includes("buy")) return "buy";
  const type = pickString(o, ["transactionType", "transaction_type", "subType", "subtype", "type"]);
  const tk = channelKey(type);
  if (tk.includes("swap")) return "swap";
  if (tk.includes("sell")) return "sell_deposit";
  return "buy";
}

function detectChannel(o: Record<string, unknown>): {
  channel: TransactionDetailChannel;
  depositDetailVariant: DepositDetailVariant;
  utilityDetailVariant: UtilityDetailVariant;
  cryptoDetailVariant: CryptoDetailVariant;
} {
  const raw = readChannelRaw(o);
  const productHint = pickNestedString(o, [
    ["product", "name"],
    ["product", "type"],
    ["product", "category"],
    ["metadata", "productType"],
  ]);
  const utilityKey = buildUtilityVariantKey(o);
  const combined =
    utilityKey + channelKey(raw) + channelKey(productHint) + channelKey(pickString(o, ["subType", "subtype"]));

  if (combined.includes("giftcard")) {
    return {
      channel: "Giftcard",
      depositDetailVariant: "utility",
      utilityDetailVariant: "electricity",
      cryptoDetailVariant: "buy",
    };
  }
  if (combined.includes("esim") || (combined.includes("sim") && !combined.includes("simple"))) {
    return {
      channel: "Esim",
      depositDetailVariant: "utility",
      utilityDetailVariant: "electricity",
      cryptoDetailVariant: "buy",
    };
  }
  if (combined.includes("withdraw")) {
    return {
      channel: "Withdrawal",
      depositDetailVariant: "utility",
      utilityDetailVariant: "electricity",
      cryptoDetailVariant: "buy",
    };
  }
  if (combined.includes("etrade") || (combined.includes("trade") && !combined.includes("crypto"))) {
    return {
      channel: "E-trade",
      depositDetailVariant: "utility",
      utilityDetailVariant: "electricity",
      cryptoDetailVariant: "buy",
    };
  }
  if (combined.includes("crypto") || combined.includes("buycrypto") || combined.includes("sellcrypto")) {
    const variant = detectCryptoVariant(o, combined);
    const isSellDeposit = variant === "sell_deposit";
    return {
      channel: isSellDeposit ? "Deposit" : "Crypto",
      depositDetailVariant: "crypto",
      utilityDetailVariant: "electricity",
      cryptoDetailVariant: variant,
    };
  }
  if (
    combined.includes("utility") ||
    combined.includes("electric") ||
    combined.includes("betting") ||
    combined.includes("airtime") ||
    combined.includes("data") ||
    combined.includes("tv") ||
    combined.includes("cable")
  ) {
    return {
      channel: "Deposit",
      depositDetailVariant: "utility",
      utilityDetailVariant: detectUtilityVariant(o),
      cryptoDetailVariant: "buy",
    };
  }
  if (combined.includes("deposit") && !combined.includes("withdraw")) {
    const variant = detectCryptoVariant(o, combined);
    if (variant === "sell_deposit" || combined.includes("crypto")) {
      return {
        channel: "Deposit",
        depositDetailVariant: "crypto",
        utilityDetailVariant: "electricity",
        cryptoDetailVariant: variant,
      };
    }
  }

  return {
    channel: "Deposit",
    depositDetailVariant: "utility",
    utilityDetailVariant: detectUtilityVariant(o),
    cryptoDetailVariant: "buy",
  };
}

function pickFromBlocks(
  o: Record<string, unknown>,
  blocks: Record<string, unknown>[],
  keys: string[],
): string {
  for (const block of blocks) {
    const v = pickString(block, keys);
    if (v) return v;
  }
  return pickString(o, keys);
}

function pickScalarFromBlocks(
  o: Record<string, unknown>,
  blocks: Record<string, unknown>[],
  keys: string[],
): string {
  for (const block of blocks) {
    for (const key of keys) {
      const v = block[key];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
    }
  }
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function formatGiftcardRateFeeDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.includes("/") || t.startsWith("₦") || t.startsWith("$")) return t;
  const n = Number(t);
  if (Number.isFinite(n)) return `₦${n.toLocaleString()}/$1`;
  return t;
}

function humanizeGiftcardTypeSlug(raw: string): string {
  return raw
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveGiftcardCardFormat(cardTypeRaw: string): "e-code" | "physical" {
  const t = cardTypeRaw.trim().toLowerCase();
  if (t.includes("physical")) return "physical";
  return "e-code";
}

function humanizeGiftcardCardTypeLabel(cardTypeRaw: string): string {
  const t = cardTypeRaw.trim().toLowerCase();
  if (!t) return "E-code";
  if (t.includes("physical")) return humanizeGiftcardTypeSlug(cardTypeRaw);
  if (t.includes("ecode") || t.includes("e-code") || t === "e_code") return "E-code";
  return humanizeGiftcardTypeSlug(cardTypeRaw);
}

function pickNumFromBlocks(
  o: Record<string, unknown>,
  blocks: Record<string, unknown>[],
  keys: string[],
): number | undefined {
  for (const block of blocks) {
    for (const key of keys) {
      const v = block[key];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
    }
  }
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function formatGiftcardAmountDisplay(cents: number, currency: string): string {
  const major = cents / 100;
  const cur = currency.trim().toUpperCase();
  const mapping: Record<string, { sign: string; name: string }> = {
    USD: { sign: "$", name: "USD" },
    EUR: { sign: "€", name: "EUR" },
    GBP: { sign: "£", name: "GBP" },
    CAD: { sign: "C$", name: "CAD" },
    AUD: { sign: "A$", name: "AUD" },
    NGN: { sign: "₦", name: "NGN" },
  };
  const info = mapping[cur] || { sign: cur, name: cur };
  if (info.sign === info.name) {
    return `${info.name} ${major.toLocaleString()}`;
  }
  return `${info.sign}${major.toLocaleString()} ${info.name}`;
}

function enrichGiftcardDetailModel(
  model: TransactionDetailModel,
  o: Record<string, unknown>,
  detailBlocks: Record<string, unknown>[],
): void {
  const submission = pickNestedRecord(o, [
    "submission",
    "giftCardSubmission",
    "gift_card_submission",
    "giftcardSubmission",
    "giftcard_submission",
    "giftCard",
    "gift_card",
    "giftcard",
  ]);
  const blocks = submission ? [...detailBlocks, submission] : detailBlocks;

  const providerName = pickScalarFromBlocks(o, blocks, [
    "providerName",
    "provider_name",
    "brandName",
    "brand_name",
    "productName",
    "product_name",
  ]);
  if (providerName) {
    model.giftcardProvider = providerName;
    model.provider = providerName;
    model.product = providerName;
  } else {
    const productRaw = pickScalarFromBlocks(o, blocks, [
      "product",
      "giftcardProduct",
      "giftcard_product",
    ]);
    if (productRaw) model.product = productRaw;
  }

  const cardTypeRaw = pickScalarFromBlocks(o, blocks, [
    "cardType",
    "card_type",
    "cardFormat",
    "card_format",
    "format",
    "giftcardFormat",
    "giftcard_format",
    "typeGift",
    "giftType",
    "type",
  ]);
  if (cardTypeRaw) {
    model.giftcardCardType = cardTypeRaw;
    model.giftcardCardFormat = resolveGiftcardCardFormat(cardTypeRaw);
    model.giftcardType = humanizeGiftcardCardTypeLabel(cardTypeRaw);
  }

  const categoryRaw = pickScalarFromBlocks(o, blocks, [
    "category",
    "displayCategory",
    "display_category",
    "denomination",
    "denominationRange",
    "denomination_range",
  ]);
  if (categoryRaw) {
    model.giftcardCategory = categoryRaw;
    model.displayCategory = categoryRaw;
  }

  const faceCents = pickNumFromBlocks(o, blocks, [
    "faceValueCents",
    "face_value_cents",
    "faceValueMinor",
    "face_value_minor",
  ]);
  const faceCurrency =
    pickScalarFromBlocks(o, blocks, ["faceCurrency", "face_currency"]) ||
    pickScalarFromBlocks(o, blocks, ["currency", "currencyCode", "currency_code"]);
  if (faceCurrency) model.giftcardFaceCurrency = faceCurrency;
  if (faceCents !== undefined) {
    model.amount = formatGiftcardAmountDisplay(faceCents, faceCurrency || "USD");
  }

  const rateAppliedKobo = pickNumFromBlocks(o, blocks, [
    "rateApplied",
    "rate_applied",
    "rate",
    "rateGiven",
    "rate_given",
    "rateFee",
    "rate_fee",
    "vendorRate",
    "vendor_rate",
    "conversionRate",
    "conversion_rate",
    "exchangeRate",
    "exchange_rate",
  ]);
  const topLevelRateKobo = pickNum(o, ["rate"]);
  const bestRateKobo = rateAppliedKobo ?? topLevelRateKobo;

  if (bestRateKobo !== undefined && bestRateKobo > 0) {
    const naira = bestRateKobo / 100;
    model.rateFeeGiven = formatGiftcardRateFeeDisplay(String(naira));
  } else {
    const rateFromMoney = pickAndFormatMoneyField(o, [
      "rateFeeGiven",
      "rate_fee_given",
      "rateFee",
      "rate_fee",
    ]);
    if (rateFromMoney) {
      model.rateFeeGiven = rateFromMoney;
    } else {
      const vendorRate = pickScalarFromBlocks(o, blocks, ["vendorRate", "vendor_rate"]);
      const rateRaw =
        vendorRate ||
        pickScalarFromBlocks(o, blocks, [
          "conversionRate",
          "conversion_rate",
          "exchangeRate",
          "exchange_rate",
        ]);
      if (rateRaw) {
        model.rateFeeGiven = formatGiftcardRateFeeDisplay(rateRaw);
      }
    }
  }

  const countryRawTemp = pickScalarFromBlocks(o, blocks, [
    "country",
    "countryName",
    "country_name",
    "countryCode",
    "country_code",
    "brandCountry",
    "brand_country",
  ]);
  const countryParts = countryRawTemp.split("|").map((s) => s.trim());
  const countryBase = countryParts[0] || "";
  const countryRaw = ISO_TO_FULL_NAME[countryBase.toUpperCase()] || countryBase;

  const currencyForCountry =
    pickScalarFromBlocks(o, blocks, [
      "faceCurrency",
      "face_currency",
      "currency",
      "currencyCode",
      "currency_code",
    ]) || model.giftcardFaceCurrency || countryParts[1] || "";

  const uniqueParts = [countryRaw, currencyForCountry].filter((v, i, self) => v && self.indexOf(v) === i);
  model.country = uniqueParts.join(" | ");

  const IMAGE_URL_KEYS = [
    "cardImageUrl",
    "card_image_url",
    "imageUrl",
    "image_url",
    "proofImageUrl",
    "proof_image_url",
    "receiptImageUrl",
    "receipt_image_url",
    "photoUrl",
    "photo_url",
  ];

  function findImageUrlInRecord(rec: Record<string, unknown>): string {
    // Direct key lookup first
    const direct = pickString(rec, IMAGE_URL_KEYS);
    if (direct) return direct;
    // Walk one level deeper into any nested object values
    for (const val of Object.values(rec)) {
      const nested = asRecord(val);
      if (!nested) continue;
      const fromNested = pickString(nested, IMAGE_URL_KEYS);
      if (fromNested) return fromNested;
    }
    return "";
  }

  // 1. Search flattened root
  let resolvedImageUrl = findImageUrlInRecord(o);

  // 2. Search each detail block
  if (!resolvedImageUrl) {
    for (const block of blocks) {
      const found = findImageUrlInRecord(block);
      if (found) { resolvedImageUrl = found; break; }
    }
  }

  // 3. Explicit submission sub-block search (catches deeply nested imageUrl)
  if (!resolvedImageUrl) {
    for (const submissionKey of ["submission", "giftCardSubmission", "gift_card_submission", "giftcard_submission"]) {
      const sub = asRecord(o[submissionKey]);
      if (!sub) continue;
      const found = findImageUrlInRecord(sub);
      if (found) { resolvedImageUrl = found; break; }
    }
  }

  if (resolvedImageUrl) {
    model.giftcardImageUrl = resolvedImageUrl;
  }

  const amountPaidOut = pickAndFormatMoneyFromBlocks(o, blocks, [
    "amountPaidOut",
    "amount_paid_out",
    "paidOut",
    "payoutAmount",
    "payout_amount",
    "nairaEquivalent",
    "naira_equivalent",
    "amountPaid",
    "amount_paid",
    "paidAmount",
    "paid_amount",
    "payout",
    "paid",
  ]);
  if (amountPaidOut) {
    model.amountPaidOut = amountPaidOut;
  }

  const uploadedRaw = pickScalarFromBlocks(o, blocks, [
    "dateUploaded",
    "uploadedAt",
    "uploaded_at",
    "submittedAt",
    "submitted_at",
    "createdAt",
    "created_at",
    "initiatedAt",
    "initiated_at",
  ]);
  if (uploadedRaw) {
    model.dateUploaded = formatDisplayDate(uploadedRaw);
  } else if (model.datedInitiated) {
    model.dateUploaded = model.datedInitiated;
  }
}

function mapLogEntry(entry: unknown, idx: number): TransactionLogEntry {
  const rec = asRecord(entry);
  if (!rec) {
    return { step: idx + 1, title: String(entry), date: "" };
  }
  const title =
    pickString(rec, [
      "title",
      "message",
      "description",
      "action",
      "step",
      "name",
      "label",
      "status",
      "event",
    ]) || `Step ${idx + 1}`;
  const dateRaw = pickString(rec, [
    "date",
    "timestamp",
    "createdAt",
    "created_at",
    "time",
    "occurredAt",
    "occurred_at",
    "loggedAt",
    "logged_at",
  ]);
  return {
    step: pickNum(rec, ["step", "order", "sequence", "index"]) ?? idx + 1,
    title,
    date: dateRaw ? formatDisplayDate(dateRaw) : "",
  };
}

export function extractTransactionLogEntries(raw: Record<string, unknown>): TransactionLogEntry[] {
  const o = flattenTransactionRecord(raw);
  for (const key of [
    "logs",
    "timeline",
    "events",
    "transactionLog",
    "transaction_log",
    "transactionLogs",
    "transaction_logs",
    "activityLog",
    "activity_log",
    "statusHistory",
    "status_history",
    "auditTrail",
    "audit_trail",
    "history",
  ]) {
    const val = o[key];
    if (!Array.isArray(val)) continue;
    return val.map(mapLogEntry);
  }

  const logContainer = asRecord(o.log) ?? asRecord(o.transactionLog) ?? asRecord(o.transaction_log);
  if (logContainer) {
    for (const key of ["entries", "items", "steps", "events", "timeline"]) {
      const nested = logContainer[key];
      if (Array.isArray(nested)) return nested.map(mapLogEntry);
    }
  }

  return [];
}

/** Normalize `GET /admin/transactions/{reference}/logs` or embedded log arrays. */
export function normalizeTransactionLogList(data: unknown): TransactionLogEntry[] {
  if (Array.isArray(data)) return data.map(mapLogEntry);
  const r = asRecord(data);
  if (!r) return [];
  for (const key of ["logs", "items", "events", "timeline", "history", "data"]) {
    const val = r[key];
    if (Array.isArray(val)) return val.map(mapLogEntry);
  }
  const inner = asRecord(r.data);
  if (inner) {
    for (const key of ["logs", "items", "events", "timeline"]) {
      const val = inner[key];
      if (Array.isArray(val)) return val.map(mapLogEntry);
    }
    const fromInner = extractTransactionLogEntries(inner);
    if (fromInner.length > 0) return fromInner;
  }
  return extractTransactionLogEntries(r);
}

export function mapApiDetailToTransactionModel(
  raw: Record<string, unknown>,
  reference: string,
): TransactionDetailModel {
  const o = flattenTransactionRecord(raw);
  const base = { ...EMPTY_TRANSACTION_DETAIL_MODEL };
  const statusRaw = readStatusRaw(o);
  const outcome = mapOutcome(statusRaw);
  const giftcardStatus = mapGiftcardApproval(statusRaw);
  const hasMappedStatus = outcome !== null;
  const routing = detectChannel(o);
  const categorySlug = pickString(o, ["categorySlug", "category_slug", "category"]) || "";
  let displayCategory = pickString(o, ["displayCategory", "display_category", "type"]) || "";
  const productSlug = pickString(o, ["productSlug", "product_slug"]) || "";

  const isUtility =
    routing.channel === "Deposit" && routing.depositDetailVariant === "utility";

  if (isUtility) {
    const combinedStr = [
      categorySlug,
      displayCategory,
      productSlug,
      o.product,
      o.transactionType,
      o.transaction_type
    ].map(v => String(v || "").toLowerCase()).join(" ");

    if (combinedStr.includes("betting") || combinedStr.includes("sportybet") || o.bettingId) {
      displayCategory = "Betting";
    } else if (combinedStr.includes("airtime")) {
      displayCategory = "Airtime";
    } else if (combinedStr.includes("data")) {
      displayCategory = "Data";
    } else if (combinedStr.includes("electric") || combinedStr.includes("ikedec")) {
      displayCategory = "Electricity";
    } else if (combinedStr.includes("tv") || combinedStr.includes("cable") || combinedStr.includes("dstv") || combinedStr.includes("gotv")) {
      displayCategory = "TV";
    } else {
      const u = routing.utilityDetailVariant;
      if (u === "electricity") displayCategory = "Electricity";
      else if (u === "data") displayCategory = "Data";
      else if (u === "tv") displayCategory = "TV";
    }
  }

  const customerBlock = pickNestedRecord(o, [
    "customer",
    "user",
    "account",
    "beneficiary",
    "payer",
    "customerDetails",
    "userDetails",
  ]);
  const recipientBlock = pickNestedRecord(o, [
    "recipient",
    "beneficiary",
    "destination",
    "receiver",
    "payee",
  ]);
  const deviceBlock = pickNestedRecord(o, ["device", "deviceInfo", "device_info", "clientDevice"]);
  const productBlock = pickNestedRecord(o, ["product", "service", "plan"]);
  const metaBlock = pickNestedRecord(o, ["metadata", "meta", "details"]);
  const detailBlocks = [o, recipientBlock, customerBlock, productBlock, metaBlock].filter(
    (b): b is Record<string, unknown> => Boolean(b),
  );

  const charge =
    pickAndFormatMoneyFromBlocks(o, detailBlocks, [
      "charge",
      "transactionCharge",
      "transaction_charge",
    ]) || "";

  const referenceNo =
    pickString(o, [
      "reference",
      "referenceNo",
      "reference_number",
      "referenceNumber",
      "transactionReference",
      "refNo",
      "ref",
      "orderId",
      "order_id",
    ]) ||
    pickString(o, ["id", "transactionId", "txId", "uuid"]) ||
    reference;

  const customerName =
    pickString(o, ["customerName", "customer_name"]) ||
    pickNestedString(o, [
      ["customer", "name"],
      ["customer", "fullName"],
      ["user", "name"],
      ["user", "fullName"],
    ]) ||
    (customerBlock ? formatPersonName(customerBlock) : "") ||
    formatPersonName(o);

  const customerId =
    (customerBlock ? pickString(customerBlock, ["accountId", "id", "uuid", "userId", "customerId"]) : "") ||
    pickString(o, ["customerAccountId", "customer_id", "customerId", "accountId", "userId"]);

  let provider = detailProvider(o);
  if (isUtility && (provider === "—" || provider === "Manual" || provider === "System" || !provider || provider.toLowerCase().includes("ringo"))) {
    provider = "Ringo";
  }
  const amountFormatted = formatAmountFromRecord(o);

  const dateInitiatedRaw = readDateRaw(o);
  const dateCompletedRaw = readDateRaw({
    completedAt: o.completedAt,
    completed_at: o.completed_at,
    updatedAt: o.updatedAt,
    updated_at: o.updated_at,
  });

  const datedInitiated = dateInitiatedRaw ? formatDisplayDate(dateInitiatedRaw) : "";
  const dateCompleted = dateCompletedRaw
    ? formatDisplayDate(dateCompletedRaw)
    : datedInitiated;

  const currency =
    pickString(o, ["currency", "asset", "currencyCode", "pair", "symbol"]) ||
    pickNestedString(o, [
      ["asset", "symbol"],
      ["crypto", "currency"],
      ["product", "currency"],
    ]) ||
    "";

  const fee =
    pickAndFormatMoneyFromBlocks(o, detailBlocks, [
      "fee",
      "ourFee",
      "our_fee",
      "serviceFee",
      "transactionFee",
      "networkFee",
      "network_fee",
    ]) || "";

  const rate = pickString(o, ["rate", "rateGiven", "rate_given", "exchangeRate", "conversionRate"]) || "";

  const balanceAfter = pickAndFormatMoneyFromBlocks(o, detailBlocks, [
    "balanceAfter",
    "balance_after",
    "balanceAfterTransaction",
    "balance",
    "availableBalance",
    "available_balance",
  ]);

  const bankBlock = pickNestedRecord(o, ["bank", "bankAccount", "account", "beneficiary", "destination"]);
  const providerLogRequest = readProviderLogRequestPayload(o);

  const uploadedRaw = pickString(o, [
    "dateUploaded",
    "uploadedAt",
    "uploaded_at",
    "submittedAt",
    "submitted_at",
    "createdAt",
    "created_at",
    "initiatedAt",
    "initiated_at",
  ]);
  let product =
    pickString(o, ["product", "productName", "product_name", "productSlug", "product_slug"]) ||
    pickNestedString(o, [["product", "name"], ["product", "title"], ["service", "name"], ["product", "slug"]]) ||
    "";

  if (isUtility) {
    const searchStr = [
      product,
      productSlug,
      categorySlug,
      displayCategory,
      o.providerName,
      o.provider_name
    ].map(v => String(v || "").toLowerCase()).join(" ");

    if (searchStr.includes("mtn")) product = "MTN";
    else if (searchStr.includes("glo")) product = "GLO";
    else if (searchStr.includes("airtel")) product = "Airtel";
    else if (searchStr.includes("9mobile")) product = "9mobile";
    else if (searchStr.includes("ikedec") || searchStr.includes("ikeja")) product = "Ikedec";
    else if (searchStr.includes("ekedp") || searchStr.includes("eko")) product = "Ekedp";
    else if (searchStr.includes("dstv")) product = "DSTV";
    else if (searchStr.includes("gotv")) product = "GOTV";
    else if (searchStr.includes("sporty")) product = "Sporty Bet";
  }
  const planRaw =
    readDataBundleRaw(o) || pickFromBlocks(o, detailBlocks, ["dataBundle", "data_bundle"]) || "";
  const plan = planRaw ? formatDataBundleDisplay(planRaw) : "";
  const cashback =
    pickAndFormatMoneyFromBlocks(o, detailBlocks, ["cashback", "cashBack", "cash_back", "reward"]) ||
    "";

  const model: TransactionDetailModel = {
    ...base,
    ...routing,
    hasMappedStatus,
    transactionId: referenceNo,
    sessionId: pickString(o, ["sessionId", "session_id"]) || referenceNo,
    customerName,
    customerId,
    provider,
    giftcardProvider: provider,
    esimProvider: provider,
    amount: amountFormatted,
    amountUsd: amountFormatted,
    amountSent:
      pickAndFormatMoneyFromBlocks(o, detailBlocks, ["amountSent", "amount_sent"]) || amountFormatted,
    amountEquivalent:
      pickAndFormatMoneyFromBlocks(o, detailBlocks, [
        "amountEquivalent",
        "amount_equivalent",
        "equivalentAmount",
      ]) || "",
    amountPaidOut: pickAndFormatMoneyFromBlocks(o, detailBlocks, [
      "amountPaidOut",
      "amount_paid_out",
      "paidOut",
      "payoutAmount",
      "payout_amount",
      "nairaEquivalent",
      "naira_equivalent",
      "amountPaid",
      "amount_paid",
      "paidAmount",
      "paid_amount",
      "payout",
      "paid",
    ]),
    datedInitiated,
    dateCompleted,
    dateUploaded: uploadedRaw ? formatDisplayDate(uploadedRaw) : "",
    currency,
    rateGiven: rate,
    ourFee: fee,
    balanceAfter,
    coinReceived: pickString(o, ["coinReceived", "coin_received", "receivedCoin", "toCurrency"]) || "",
    defaultOutcome: outcome ?? base.defaultOutcome,
    esimOutcome: outcome ?? base.esimOutcome,
    giftcardInitialStatus: giftcardStatus ?? base.giftcardInitialStatus,
    code: pickString(o, ["code", "cardCode", "card_code", "giftcardCode"]) || "",
    country: pickString(o, ["country", "countryCode", "country_name"]) || "",
    giftcardType: pickString(o, ["giftcardType", "giftcard_type", "cardType"]) || "",
    typeGift: pickString(o, ["typeGift", "giftType", "cardFormat"]) || "",
    typeDeposit: pickString(o, ["typeDeposit", "transactionType", "transaction_type"]) || "",
    opsInCharge: pickString(o, ["opsInCharge", "ops_in_charge", "assignedTo", "reviewer", "adminName"]) || "",
    rateFeeGiven:
      pickString(o, ["rateFeeGiven", "rate_fee_given", "rateFee", "rate_fee"]) || "",
    balanceAfterGift: pickString(o, ["balanceAfterGift", "balance_after_gift"]) || balanceAfter,
    esimChannelLabel: routing.channel === "Esim" ? readChannelRaw(o) || "" : "",
    esimCoverage: pickString(o, ["coverage", "esimCoverage", "region"]) || "",
    esimDataAllowance: pickString(o, ["dataAllowance", "data_allowance", "allowance"]) || plan,
    esimValidity: pickString(o, ["validity", "esimValidity", "duration"]) || "",
    esimPriceUsd:
      pickString(o, ["priceUsd", "price_usd", "usdAmount"]) ||
      (currency.includes("USD") || currency.startsWith("$") ? amountFormatted : ""),
    esimPriceNgn:
      pickAndFormatMoneyFromBlocks(o, detailBlocks, [
        "priceNgn",
        "price_ngn",
        "ngnAmount",
        "priceInNgn",
      ]) || (amountFormatted.includes("₦") ? amountFormatted : ""),
    esimBalanceAfter: balanceAfter,
    withdrawalAmount: amountFormatted,
    withdrawalFee:
      pickAndFormatMoneyFromBlocks(o, detailBlocks, ["withdrawalFee", "withdrawal_fee"]) || fee,
    withdrawalPayoutCurrency: formatPayoutCurrencyLabel(currency),
    withdrawalBankName:
      pickString(o, ["bankName", "bank_name"]) ||
      (bankBlock ? pickString(bankBlock, ["bankName", "name", "bank"]) : "") ||
      (providerLogRequest
        ? pickString(providerLogRequest, ["providerBankCode", "provider_bank_code", "bankCode", "bank_code"])
        : "") ||
      "",
    withdrawalAccountName:
      (providerLogRequest
        ? pickString(providerLogRequest, ["accountName", "account_name"])
        : "") ||
      pickString(o, ["accountName", "account_name"]) ||
      (bankBlock ? pickString(bankBlock, ["accountName", "name"]) : "") ||
      "",
    withdrawalAccountNumber:
      (providerLogRequest
        ? pickString(providerLogRequest, ["accountNumber", "account_number"])
        : "") ||
      pickString(o, ["accountNumber", "account_number"]) ||
      (bankBlock ? pickString(bankBlock, ["accountNumber", "number"]) : "") ||
      "",
    withdrawalRemark:
      (providerLogRequest
        ? pickString(providerLogRequest, ["narration", "remark", "memo", "description"])
        : "") ||
      pickString(o, ["narration", "remark", "memo", "description", "note", "notes"]) ||
      "",
    withdrawalBalanceAfter: balanceAfter,
    withdrawalTimestamp: datedInitiated,
    etradeSymbol: pickString(o, ["symbol", "etradeSymbol", "stockSymbol"]) || "",
    etradeSide: pickString(o, ["side", "etradeSide", "orderSide"]) || "",
    etradeQuantity: pickString(o, ["quantity", "etradeQuantity", "shares"]) || "",
    etradeAmountNgn: amountFormatted.includes("₦") ? amountFormatted : "",
    etradeFee:
      pickAndFormatMoneyFromBlocks(o, detailBlocks, ["etradeFee", "etrade_fee", "tradeFee"]) || fee,
    etradeBalanceAfter: balanceAfter,
    etradeTimestamp: datedInitiated,
    rejectionMessage:
      pickString(o, [
        "rejectionMessage",
        "rejection_message",
        "rejectionReason",
        "rejection_reason",
        "declineReason",
      ]) || "",
    product,
    plan,
    cashback,
    walletAddress: pickFromBlocks(o, detailBlocks, [
      "walletAddress",
      "wallet_address",
      "address",
      "toAddress",
      "to_address",
    ]),
    network: pickFromBlocks(o, detailBlocks, ["network", "chain", "blockchain"]),
    networkFee: pickFromBlocks(o, detailBlocks, ["networkFee", "network_fee", "gasFee", "gas_fee"]),
    meterNumber: pickFromBlocks(o, detailBlocks, ["meterNumber", "meter_number", "meterNo", "meter_no"]),
    address: pickFromBlocks(o, detailBlocks, ["address", "streetAddress", "street_address", "location"]),
    accountName:
      (providerLogRequest
        ? pickString(providerLogRequest, [
            "customerName",
            "customer_name",
            "accountName",
            "account_name",
            "recipientName",
            "recipient_name",
          ])
        : "") ||
      pickFromBlocks(o, detailBlocks, ["accountName", "account_name", "recipientName", "recipient_name"]),
    accountNumber: pickFromBlocks(o, detailBlocks, ["accountNumber", "account_number", "number", "recipientNumber"]),
    phoneNumber: pickFromBlocks(o, detailBlocks, ["phoneNumber", "phone_number", "phone", "msisdn"]),
    smartcardNo: pickFromBlocks(o, detailBlocks, ["smartcardNo", "smartcard_no", "smartCard", "cardNumber"]),
    bettingId:
      (providerLogRequest
        ? pickString(providerLogRequest, [
            "bettingAccountId",
            "betting_account_id",
            "bettingId",
            "betting_id",
            "betId",
            "bet_id",
          ])
        : "") ||
      pickFromBlocks(o, detailBlocks, ["bettingId", "betting_id", "betId", "bet_id"]),
    device: (deviceBlock ? pickString(deviceBlock, ["device", "name", "model"]) : "") || pickString(o, ["device"]),
    deviceId:
      (deviceBlock ? pickString(deviceBlock, ["deviceId", "device_id", "id"]) : "") ||
      pickString(o, ["deviceId", "device_id"]),
    location:
      (deviceBlock ? pickString(deviceBlock, ["location", "city", "address"]) : "") ||
      pickString(o, ["location"]),
    locationCoordinate:
      (deviceBlock ? pickString(deviceBlock, ["locationCoordinate", "coordinates", "geo"]) : "") ||
      pickString(o, ["locationCoordinate", "coordinates", "lat", "lng"]),
    categorySlug,
    displayCategory,
    productSlug,
    charge,
  };

  const utilityKey = buildUtilityVariantKey(o);
  if (routing.depositDetailVariant === "utility_betting" || utilityKey.includes("betting")) {
    model.depositDetailVariant = "utility_betting";
  }

  if (routing.channel === "Giftcard") {
    try {
      model.giftcardSubmissionId = resolveGiftcardSubmissionId(o);
    } catch {
      model.giftcardSubmissionId = "";
    }
    enrichGiftcardDetailModel(model, o, detailBlocks);
  }

  return model;
}
