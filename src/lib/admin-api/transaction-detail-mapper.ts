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

function detectUtilityVariant(o: Record<string, unknown>, combined: string): UtilityDetailVariant {
  if (combined.includes("electric")) return "electricity";
  if (combined.includes("data") || combined.includes("airtime")) return "data";
  if (combined.includes("tv") || combined.includes("cable")) return "tv";
  if (combined.includes("bet")) return "electricity";
  const product = pickNestedString(o, [["product", "name"], ["product", "type"], ["product", "category"]]);
  const pk = channelKey(product);
  if (pk.includes("electric")) return "electricity";
  if (pk.includes("data") || pk.includes("airtime")) return "data";
  if (pk.includes("tv")) return "tv";
  if (pk.includes("bet")) return "electricity";
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
  const combined = channelKey(raw) + channelKey(productHint) + channelKey(pickString(o, ["subType", "subtype"]));

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
  if (combined.includes("utility") || combined.includes("electric") || combined.includes("betting")) {
    return {
      channel: "Deposit",
      depositDetailVariant: "utility",
      utilityDetailVariant: detectUtilityVariant(o, combined),
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
    utilityDetailVariant: detectUtilityVariant(o, combined),
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

  const uploadedRaw = pickString(o, ["dateUploaded", "uploadedAt", "uploaded_at"]);
  const product =
    pickString(o, ["product", "productName", "product_name"]) ||
    pickNestedString(o, [["product", "name"], ["product", "title"], ["service", "name"]]) ||
    "";
  const plan =
    pickString(o, ["plan", "planName", "plan_name", "bundle"]) ||
    pickNestedString(o, [["product", "plan"], ["plan", "name"]]) ||
    "";
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
    withdrawalBankName:
      pickString(o, ["bankName", "bank_name"]) ||
      (bankBlock ? pickString(bankBlock, ["bankName", "name", "bank"]) : "") ||
      "",
    withdrawalAccountName:
      pickString(o, ["accountName", "account_name"]) ||
      (bankBlock ? pickString(bankBlock, ["accountName", "name"]) : "") ||
      "",
    withdrawalAccountNumber:
      pickString(o, ["accountNumber", "account_number"]) ||
      (bankBlock ? pickString(bankBlock, ["accountNumber", "number"]) : "") ||
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
    accountName: pickFromBlocks(o, detailBlocks, ["accountName", "account_name", "name", "recipientName"]),
    accountNumber: pickFromBlocks(o, detailBlocks, ["accountNumber", "account_number", "number", "recipientNumber"]),
    phoneNumber: pickFromBlocks(o, detailBlocks, ["phoneNumber", "phone_number", "phone", "msisdn"]),
    smartcardNo: pickFromBlocks(o, detailBlocks, ["smartcardNo", "smartcard_no", "smartCard", "cardNumber"]),
    bettingId: pickFromBlocks(o, detailBlocks, ["bettingId", "betting_id", "betId", "customerId"]),
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

  if (routing.depositDetailVariant === "utility_betting" || channelKey(readChannelRaw(o)).includes("bet")) {
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
