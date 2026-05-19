import {
  asRecord,
  formatDisplayDate,
  formatPersonName,
  pickNestedRecord,
  pickNestedString,
  pickNum,
  pickProviderLabel,
  pickString,
  unwrapTransactionRecord,
} from "@/lib/admin-api/transactions-api";
import type { TxApprovalStatus } from "@/components/transactions/transaction-details/types";
import {
  FALLBACK_TRANSACTION_DETAIL_MODEL,
  type CryptoDetailVariant,
  type DepositDetailVariant,
  type EsimTransactionOutcome,
  type TransactionDetailChannel,
  type TransactionDetailModel,
  type UtilityDetailVariant,
} from "@/components/transactions/transaction-mocks";

export type TransactionLogEntry = {
  step: number;
  title: string;
  date: string;
};

function channelKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readChannelRaw(o: Record<string, unknown>): string {
  return (
    pickString(o, [
      "channel",
      "productChannel",
      "product_channel",
      "category",
      "transactionType",
      "transaction_type",
      "productType",
      "product_type",
      "service",
    ]) || pickString(o, ["type"]) ||
    ""
  );
}

function readStatusRaw(o: Record<string, unknown>): string {
  return pickString(o, ["status", "state", "outcome", "transactionStatus", "paymentStatus"]);
}

function mapOutcome(statusRaw: string): EsimTransactionOutcome {
  const k = statusRaw.toLowerCase();
  if (k.includes("fail") || k.includes("reject")) return "Failed";
  if (k.includes("pending")) return "Pending";
  if (k.includes("success") || k.includes("complete") || k.includes("approve")) return "Successful";
  return "Successful";
}

function mapGiftcardApproval(statusRaw: string): TxApprovalStatus {
  const k = statusRaw.toLowerCase();
  if (k.includes("reject") || k.includes("fail")) return "Rejected";
  if (k.includes("pending")) return "Pending";
  if (k.includes("success") || k.includes("approve")) return "Approved";
  return "Pending";
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
    const prefix = currency && currency !== "NGN" && currency !== "₦" ? `${currency} ` : currency === "NGN" ? "₦" : currency ? `${currency} ` : "₦";
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
  if (combined.includes("data")) return "data";
  if (combined.includes("tv") || combined.includes("cable")) return "tv";
  if (combined.includes("bet")) return "electricity";
  const product = pickNestedString(o, [["product", "name"], ["product", "type"], ["product", "category"]]);
  const pk = channelKey(product);
  if (pk.includes("electric")) return "electricity";
  if (pk.includes("data")) return "data";
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

export function extractTransactionLogEntries(raw: Record<string, unknown>): TransactionLogEntry[] {
  const o = unwrapTransactionRecord(raw);
  for (const key of ["logs", "timeline", "events", "transactionLog", "transaction_log", "history"]) {
    const val = o[key];
    if (!Array.isArray(val)) continue;
    return val.map((entry, idx) => {
      const rec = asRecord(entry);
      if (!rec) {
        return { step: idx + 1, title: String(entry), date: "" };
      }
      const title =
        pickString(rec, ["title", "message", "description", "action", "step", "name"]) ||
        `Step ${idx + 1}`;
      const dateRaw = pickString(rec, ["date", "timestamp", "createdAt", "created_at", "time"]);
      return {
        step: pickNum(rec, ["step", "order"]) ?? idx + 1,
        title,
        date: dateRaw ? formatDisplayDate(dateRaw) : "",
      };
    });
  }
  return [];
}

export function mapApiDetailToTransactionModel(
  raw: Record<string, unknown>,
  reference: string,
): TransactionDetailModel {
  const o = unwrapTransactionRecord(raw);
  const base = { ...FALLBACK_TRANSACTION_DETAIL_MODEL };
  const statusRaw = readStatusRaw(o);
  const outcome = mapOutcome(statusRaw);
  const routing = detectChannel(o);

  const customerBlock = pickNestedRecord(o, [
    "customer",
    "user",
    "account",
    "beneficiary",
    "payer",
    "customerDetails",
    "userDetails",
  ]);

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
    formatPersonName(o) ||
    base.customerName;

  const provider = pickProviderLabel(o);
  const amountFormatted = formatAmountFromRecord(o) || base.amount;

  const dateInitiatedRaw =
    pickString(o, ["createdAt", "created_at", "initiatedAt", "initiated_at", "date", "timestamp"]) || "";
  const dateCompletedRaw =
    pickString(o, ["completedAt", "completed_at", "updatedAt", "updated_at"]) || dateInitiatedRaw;

  const datedInitiated = dateInitiatedRaw ? formatDisplayDate(dateInitiatedRaw) : base.datedInitiated;
  const dateCompleted = dateCompletedRaw ? formatDisplayDate(dateCompletedRaw) : base.dateCompleted;

  const currency =
    pickString(o, ["currency", "asset", "currencyCode", "pair", "symbol"]) ||
    pickNestedString(o, [
      ["asset", "symbol"],
      ["crypto", "currency"],
      ["product", "currency"],
    ]) ||
    base.currency;

  const feeNum = pickNum(o, ["fee", "ourFee", "our_fee", "serviceFee", "transactionFee"]);
  const fee =
    pickString(o, ["fee", "ourFee", "our_fee", "serviceFee", "transactionFee"]) ||
    (feeNum !== undefined ? `₦${feeNum.toLocaleString()}` : "") ||
    base.ourFee;

  const rate =
    pickString(o, ["rate", "rateGiven", "rate_given", "exchangeRate", "conversionRate"]) || base.rateGiven;

  const balanceAfter =
    pickString(o, ["balanceAfter", "balance_after", "balanceAfterTransaction"]) ||
    (pickNum(o, ["balanceAfter", "balance_after"]) !== undefined
      ? formatAmountFromRecord({ amount: pickNum(o, ["balanceAfter", "balance_after"]), currency: "NGN" })
      : "") ||
    base.balanceAfter;

  const bankBlock = pickNestedRecord(o, ["bank", "bankAccount", "account", "beneficiary", "destination"]);

  const model: TransactionDetailModel = {
    ...base,
    ...routing,
    transactionId: referenceNo,
    sessionId: pickString(o, ["sessionId", "session_id"]) || referenceNo,
    customerName,
    provider: provider !== "—" ? provider : base.provider,
    giftcardProvider: provider !== "—" ? provider : base.giftcardProvider,
    esimProvider: provider !== "—" ? provider : base.esimProvider,
    amount: amountFormatted,
    amountUsd: amountFormatted,
    amountSent: pickString(o, ["amountSent", "amount_sent"]) || amountFormatted,
    amountEquivalent:
      pickString(o, ["amountEquivalent", "amount_equivalent", "equivalentAmount"]) || amountFormatted,
    amountPaidOut:
      pickString(o, ["amountPaidOut", "amount_paid_out", "paidOut", "payoutAmount"]) || amountFormatted,
    datedInitiated,
    dateCompleted,
    dateUploaded: pickString(o, ["dateUploaded", "uploadedAt", "uploaded_at"])
      ? formatDisplayDate(pickString(o, ["dateUploaded", "uploadedAt", "uploaded_at"]))
      : datedInitiated,
    currency,
    rateGiven: rate,
    ourFee: typeof fee === "string" && fee && !fee.startsWith("₦") && !fee.startsWith("$") ? `₦${fee}` : fee,
    balanceAfter: balanceAfter || base.balanceAfter,
    coinReceived: pickString(o, ["coinReceived", "coin_received", "receivedCoin", "toCurrency"]) || base.coinReceived,
    defaultOutcome: outcome,
    esimOutcome: outcome,
    giftcardInitialStatus: mapGiftcardApproval(statusRaw),
    code: pickString(o, ["code", "cardCode", "card_code", "giftcardCode"]) || base.code,
    country: pickString(o, ["country", "countryCode", "country_name"]) || base.country,
    giftcardType: pickString(o, ["giftcardType", "giftcard_type", "cardType", "type"]) || base.giftcardType,
    typeGift: pickString(o, ["typeGift", "giftType", "cardFormat"]) || base.typeGift,
    typeDeposit: pickString(o, ["typeDeposit", "type", "transactionType"]) || base.typeDeposit,
    opsInCharge:
      pickString(o, ["opsInCharge", "ops_in_charge", "assignedTo", "reviewer", "adminName"]) || base.opsInCharge,
    rateFeeGiven: pickString(o, ["rateFeeGiven", "rate_fee", "rate"]) || rate || base.rateFeeGiven,
    balanceAfterGift:
      pickString(o, ["balanceAfterGift", "balance_after_gift"]) || balanceAfter || base.balanceAfterGift,
    esimChannelLabel:
      routing.channel === "Esim"
        ? readChannelRaw(o) || "E-sim"
        : base.esimChannelLabel,
    esimCoverage: pickString(o, ["coverage", "esimCoverage", "region"]) || base.esimCoverage,
    esimDataAllowance:
      pickString(o, ["dataAllowance", "data_allowance", "allowance", "plan"]) || base.esimDataAllowance,
    esimValidity: pickString(o, ["validity", "esimValidity", "duration"]) || base.esimValidity,
    esimPriceUsd:
      pickString(o, ["priceUsd", "price_usd", "usdAmount"]) ||
      (currency.includes("USD") || currency.startsWith("$") ? amountFormatted : base.esimPriceUsd),
    esimPriceNgn:
      pickString(o, ["priceNgn", "price_ngn", "ngnAmount"]) ||
      (amountFormatted.includes("₦") ? amountFormatted : base.esimPriceNgn),
    esimBalanceAfter: balanceAfter || base.esimBalanceAfter,
    withdrawalAmount: amountFormatted,
    withdrawalFee: pickString(o, ["withdrawalFee", "fee"]) || base.withdrawalFee,
    withdrawalBankName:
      pickString(o, ["bankName", "bank_name"]) ||
      (bankBlock ? pickString(bankBlock, ["bankName", "name", "bank"]) : "") ||
      base.withdrawalBankName,
    withdrawalAccountName:
      pickString(o, ["accountName", "account_name"]) ||
      (bankBlock ? pickString(bankBlock, ["accountName", "name"]) : "") ||
      base.withdrawalAccountName,
    withdrawalAccountNumber:
      pickString(o, ["accountNumber", "account_number"]) ||
      (bankBlock ? pickString(bankBlock, ["accountNumber", "number"]) : "") ||
      base.withdrawalAccountNumber,
    withdrawalBalanceAfter: balanceAfter || base.withdrawalBalanceAfter,
    withdrawalTimestamp: datedInitiated,
    etradeSymbol: pickString(o, ["symbol", "etradeSymbol", "stockSymbol"]) || base.etradeSymbol,
    etradeSide: pickString(o, ["side", "etradeSide", "orderSide"]) || base.etradeSide,
    etradeQuantity: pickString(o, ["quantity", "etradeQuantity", "shares"]) || base.etradeQuantity,
    etradeAmountNgn: amountFormatted.includes("₦") ? amountFormatted : base.etradeAmountNgn,
    etradeFee: pickString(o, ["fee", "etradeFee"]) || base.etradeFee,
    etradeBalanceAfter: balanceAfter || base.etradeBalanceAfter,
    etradeTimestamp: datedInitiated,
  };

  if (routing.depositDetailVariant === "utility_betting" || channelKey(readChannelRaw(o)).includes("bet")) {
    model.depositDetailVariant = "utility_betting";
  }

  return model;
}
