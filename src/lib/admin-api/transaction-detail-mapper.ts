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
  unwrapTransactionRecord,
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
  const amountNum =
    pickNum(o, ["amount", "value", "totalAmount", "transactionAmount", "amountPaid", "paidAmount"]) ??
    (amountBlock ? pickNum(amountBlock, ["value", "amount", "total", "paid"]) : undefined);
  const currency =
    pickString(o, ["currency", "asset", "currencyCode"]) ||
    (amountBlock ? pickString(amountBlock, ["currency", "code"]) : "") ||
    "";
  if (amountNum !== undefined) {
    const prefix =
      currency && currency !== "NGN" && currency !== "₦"
        ? `${currency} `
        : currency === "NGN"
          ? "₦"
          : currency
            ? `${currency} `
            : "₦";
    return `${prefix}${amountNum.toLocaleString()}`.replace(/^₦₦/, "₦");
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
  const displayCategory = pickString(o, ["displayCategory", "display_category", "type"]) || "";
  const productSlug = pickString(o, ["productSlug", "product_slug"]) || "";
  const chargeNum = pickNum(o, ["charge", "transactionCharge", "transaction_charge"]);
  const chargeRaw = pickString(o, ["charge", "transactionCharge", "transaction_charge"]) || (chargeNum !== undefined ? String(chargeNum) : "");
  const charge = chargeRaw && !chargeRaw.startsWith("₦") && !chargeRaw.startsWith("$") && chargeNum !== undefined
    ? `₦${chargeNum.toLocaleString()}`
    : chargeRaw;

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

  const provider = detailProvider(o);
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

  const feeNum = pickNum(o, ["fee", "ourFee", "our_fee", "serviceFee", "transactionFee"]);
  const feeRaw =
    pickString(o, ["fee", "ourFee", "our_fee", "serviceFee", "transactionFee"]) ||
    (feeNum !== undefined ? String(feeNum) : "");
  const fee =
    feeRaw && !feeRaw.startsWith("₦") && !feeRaw.startsWith("$") && feeNum !== undefined
      ? `₦${feeNum.toLocaleString()}`
      : feeRaw;

  const rate = pickString(o, ["rate", "rateGiven", "rate_given", "exchangeRate", "conversionRate"]) || "";

  const balanceAfterNum = pickNum(o, ["balanceAfter", "balance_after"]);
  const balanceAfter =
    pickString(o, ["balanceAfter", "balance_after", "balanceAfterTransaction"]) ||
    (balanceAfterNum !== undefined
      ? formatAmountFromRecord({ amount: balanceAfterNum, currency: "NGN" })
      : "");

  const bankBlock = pickNestedRecord(o, ["bank", "bankAccount", "account", "beneficiary", "destination"]);
  const providerLogRequest = readProviderLogRequestPayload(o);

  const uploadedRaw = pickString(o, ["dateUploaded", "uploadedAt", "uploaded_at"]);
  const product =
    pickString(o, ["product", "productName", "product_name"]) ||
    pickNestedString(o, [["product", "name"], ["product", "title"], ["service", "name"]]) ||
    "";
  const planRaw =
    readDataBundleRaw(o) || pickFromBlocks(o, detailBlocks, ["dataBundle", "data_bundle"]) || "";
  const plan = planRaw ? formatDataBundleDisplay(planRaw) : "";
  const cashback = pickString(o, ["cashback", "cashBack", "cash_back", "reward"]) || "";

  const model: TransactionDetailModel = {
    ...base,
    ...routing,
    hasMappedStatus,
    transactionId: referenceNo,
    sessionId: pickString(o, ["sessionId", "session_id"]) || referenceNo,
    customerName,
    provider,
    giftcardProvider: provider,
    esimProvider: provider,
    amount: amountFormatted,
    amountUsd: amountFormatted,
    amountSent: pickString(o, ["amountSent", "amount_sent"]) || amountFormatted,
    amountEquivalent: pickString(o, ["amountEquivalent", "amount_equivalent", "equivalentAmount"]) || "",
    amountPaidOut: pickString(o, ["amountPaidOut", "amount_paid_out", "paidOut", "payoutAmount"]) || "",
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
    rateFeeGiven: pickString(o, ["rateFeeGiven", "rate_fee"]) || rate,
    balanceAfterGift: pickString(o, ["balanceAfterGift", "balance_after_gift"]) || balanceAfter,
    esimChannelLabel: routing.channel === "Esim" ? readChannelRaw(o) || "" : "",
    esimCoverage: pickString(o, ["coverage", "esimCoverage", "region"]) || "",
    esimDataAllowance: pickString(o, ["dataAllowance", "data_allowance", "allowance"]) || plan,
    esimValidity: pickString(o, ["validity", "esimValidity", "duration"]) || "",
    esimPriceUsd:
      pickString(o, ["priceUsd", "price_usd", "usdAmount"]) ||
      (currency.includes("USD") || currency.startsWith("$") ? amountFormatted : ""),
    esimPriceNgn:
      pickString(o, ["priceNgn", "price_ngn", "ngnAmount"]) ||
      (amountFormatted.includes("₦") ? amountFormatted : ""),
    esimBalanceAfter: balanceAfter,
    withdrawalAmount: amountFormatted,
    withdrawalFee: pickString(o, ["withdrawalFee"]) || fee,
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
    etradeFee: pickString(o, ["etradeFee"]) || fee,
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
  }

  return model;
}
