/**
 * QA / demo transaction list rows and per-id detail payloads for `/dashboard/transactions/[id]`.
 * Replace with API-backed loaders when backend is wired; keep ids stable for bookmarks.
 */

import type { TxApprovalStatus } from "@/components/transactions/transaction-details/types";

/* ── List table ── */

export type TxStatus = "Successful" | "Pending" | "Failed";

export type TxRow = {
  id: string;
  refNo: string;
  customerName: string;
  channel: string;
  amount: string;
  provider: string;
  status: TxStatus;
  date: string;
};

export type EsimTransactionOutcome = "Successful" | "Pending" | "Failed";

export type DepositDetailVariant = "crypto" | "utility" | "utility_betting";

export type UtilityDetailVariant = "electricity" | "data" | "tv";

export type CryptoDetailVariant = "buy" | "swap" | "sell_deposit";

export type TransactionDetailChannel =
  | "Deposit"
  | "Giftcard"
  | "Crypto"
  | "Esim"
  | "Withdrawal"
  | "E-trade";

/** Full detail model: mirrors former `TX_DATA` plus outcome / withdrawal / e-trade fields. */
export type TransactionDetailModel = {
  channel: TransactionDetailChannel;
  depositDetailVariant: DepositDetailVariant;
  esimOutcome: EsimTransactionOutcome;
  esimChannelLabel: string;
  esimCoverage: string;
  esimDataAllowance: string;
  esimValidity: string;
  esimPriceUsd: string;
  esimPriceNgn: string;
  esimProvider: string;
  esimBalanceAfter: string;
  utilityDetailVariant: UtilityDetailVariant;
  cryptoDetailVariant: CryptoDetailVariant;
  transactionId: string;
  customerName: string;
  typeDeposit: string;
  currency: string;
  amountSent: string;
  amountUsd: string;
  amountEquivalent: string;
  datedInitiated: string;
  dateCompleted: string;
  rateGiven: string;
  provider: string;
  ourFee: string;
  balanceAfter: string;
  coinReceived: string;
  sessionId: string;
  typeGift: string;
  giftcardType: string;
  giftcardProvider: string;
  code: string;
  country: string;
  amount: string;
  amountPaidOut: string;
  dateUploaded: string;
  rateFeeGiven: string;
  balanceAfterGift: string;
  opsInCharge: string;
  /** Initial giftcard approval UI; only used when `channel === "Giftcard"`. */
  giftcardInitialStatus: TxApprovalStatus;
  /** Status banner for Deposit / Crypto / Withdrawal / E-trade (not giftcard/esim). */
  defaultOutcome: EsimTransactionOutcome;
  withdrawalAmount: string;
  withdrawalFee: string;
  withdrawalBankName: string;
  withdrawalAccountName: string;
  withdrawalAccountNumber: string;
  withdrawalBalanceAfter: string;
  withdrawalTimestamp: string;
  etradeSymbol: string;
  etradeSide: string;
  etradeQuantity: string;
  etradeAmountNgn: string;
  etradeFee: string;
  etradeBalanceAfter: string;
  etradeTimestamp: string;
};

const DEMO_DATE = "Jan 6, 2026 | 9:32AM";

export const FALLBACK_TRANSACTION_DETAIL_MODEL: TransactionDetailModel = {
  channel: "Deposit",
  depositDetailVariant: "utility",
  esimOutcome: "Successful",
  esimChannelLabel: "E-sim",
  esimCoverage: "Global",
  esimDataAllowance: "5GB, Unlimited",
  esimValidity: "30 days",
  esimPriceUsd: "$30.00",
  esimPriceNgn: "₦30,000.00",
  esimProvider: "Airalo",
  esimBalanceAfter: "₦30,000.00",
  utilityDetailVariant: "electricity",
  cryptoDetailVariant: "buy",
  transactionId: "12324235334252526",
  customerName: "Naomi Salisu",
  typeDeposit: "Sell Deposit",
  currency: "Bitcoin | BTC",
  amountSent: "B0.005 BTC",
  amountUsd: "$30,000.00",
  amountEquivalent: "₿0.005 BTC",
  datedInitiated: DEMO_DATE,
  dateCompleted: DEMO_DATE,
  rateGiven: "₿1=$96832.01",
  provider: "Quidex",
  ourFee: "$2.01",
  balanceAfter: "$30,000.00",
  coinReceived: "Tether | BTC",
  sessionId: "12324235334262526",
  typeGift: "Physical Card",
  giftcardType: "Ecode",
  giftcardProvider: "Quidax",
  code: "14292920204637",
  country: "United States | USD",
  amount: "$1,000.00",
  amountPaidOut: "₦ 1,000,000.00",
  dateUploaded: DEMO_DATE,
  rateFeeGiven: "1045/$1",
  balanceAfterGift: "$1,000,000.00",
  opsInCharge: "Florence Arinze",
  giftcardInitialStatus: "Approved",
  defaultOutcome: "Successful",
  withdrawalAmount: "₦50,000.00",
  withdrawalFee: "₦50.00",
  withdrawalBankName: "GTBank",
  withdrawalAccountName: "Chinedu Okafor",
  withdrawalAccountNumber: "0123456789",
  withdrawalBalanceAfter: "₦450,000.00",
  withdrawalTimestamp: DEMO_DATE,
  etradeSymbol: "AAPL | Apple Inc.",
  etradeSide: "Buy",
  etradeQuantity: "2 shares",
  etradeAmountNgn: "₦910,000.00",
  etradeFee: "₦500.00",
  etradeBalanceAfter: "₦2,100,000.00",
  etradeTimestamp: DEMO_DATE,
};

function giftcardBase(over: Partial<TransactionDetailModel>): TransactionDetailModel {
  return {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Giftcard",
    depositDetailVariant: "utility",
    giftcardInitialStatus: "Pending",
    customerName: "Giftcard QA User",
    sessionId: "sess-gc-demo-001",
    code: "14292920204637",
    country: "United States | USD",
    amount: "$500.00",
    amountPaidOut: "₦ 520,000.00",
    dateUploaded: DEMO_DATE,
    dateCompleted: DEMO_DATE,
    rateFeeGiven: "1040/$1",
    balanceAfterGift: "₦2,000,000.00",
    giftcardProvider: "Quidax",
    opsInCharge: "Florence Arinze",
    defaultOutcome: "Successful",
    ...over,
  };
}

function cryptoBase(
  variant: CryptoDetailVariant,
  channel: "Crypto" | "Deposit",
  over: Partial<TransactionDetailModel>,
): TransactionDetailModel {
  const swapExtras =
    variant === "swap"
      ? {
          currency: "Bitcoin | BTC to Tether | USDT",
          amountSent: "B0.005 BTC",
          rateGiven: "B1 - ₮69,646,93.01",
          coinReceived: "Tether | USDT",
        }
      : variant === "sell_deposit"
        ? {
            currency: "Bitcoin | BTC",
            rateGiven: "$1 = $96832.01",
            channel: "Deposit" as const,
            depositDetailVariant: "crypto" as const,
            cryptoDetailVariant: "sell_deposit" as const,
          }
        : {
            currency: "Bitcoin | BTC",
            rateGiven: "₿1=$96832.01",
          };

  return {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel,
    depositDetailVariant: "crypto",
    cryptoDetailVariant: variant,
    customerName: "Crypto QA User",
    defaultOutcome: "Successful",
    ...swapExtras,
    ...over,
  };
}

function utilityBase(
  u: UtilityDetailVariant,
  over: Partial<TransactionDetailModel>,
): TransactionDetailModel {
  return {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Deposit",
    depositDetailVariant: "utility",
    utilityDetailVariant: u,
    customerName: "Utility QA User",
    defaultOutcome: "Successful",
    ...over,
  };
}

/** Per-id detail config for `/dashboard/transactions/[id]`. */
export const TRANSACTION_DETAIL_BY_ID: Record<string, TransactionDetailModel> = {
  /* Giftcard — pending (interactive approve/reject), approved, rejected */
  "demo-gc-pending": giftcardBase({
    giftcardInitialStatus: "Pending",
    sessionId: "sess-gc-pending",
    code: "GC-PENDING-001",
  }),
  "demo-gc-approved": giftcardBase({
    giftcardInitialStatus: "Approved",
    sessionId: "sess-gc-approved",
    code: "GC-OK-001",
    giftcardProvider: "Paxful",
  }),
  "demo-gc-rejected": giftcardBase({
    giftcardInitialStatus: "Rejected",
    sessionId: "sess-gc-rejected",
    code: "GC-REJ-REDEEMED",
    opsInCharge: "Ops · Rejection demo",
  }),

  /* Crypto — buy / swap / sell deposit × outcome */
  "demo-crypto-buy-ok": cryptoBase("buy", "Crypto", { defaultOutcome: "Successful", transactionId: "crypto-buy-ok" }),
  "demo-crypto-buy-fail": cryptoBase("buy", "Crypto", { defaultOutcome: "Failed", transactionId: "crypto-buy-fail" }),
  "demo-crypto-buy-pending": cryptoBase("buy", "Crypto", {
    defaultOutcome: "Pending",
    transactionId: "crypto-buy-pending",
  }),
  "demo-crypto-swap-ok": cryptoBase("swap", "Crypto", { defaultOutcome: "Successful", transactionId: "crypto-swap-ok" }),
  "demo-crypto-swap-fail": cryptoBase("swap", "Crypto", { defaultOutcome: "Failed", transactionId: "crypto-swap-fail" }),
  "demo-crypto-swap-pending": cryptoBase("swap", "Crypto", {
    defaultOutcome: "Pending",
    transactionId: "crypto-swap-pending",
  }),
  "demo-crypto-selldep-ok": cryptoBase("sell_deposit", "Deposit", {
    defaultOutcome: "Successful",
    transactionId: "crypto-sell-ok",
  }),
  "demo-crypto-selldep-fail": cryptoBase("sell_deposit", "Deposit", {
    defaultOutcome: "Failed",
    transactionId: "crypto-sell-fail",
  }),
  "demo-crypto-selldep-pending": cryptoBase("sell_deposit", "Deposit", {
    defaultOutcome: "Pending",
    transactionId: "crypto-sell-pending",
  }),

  /* Utility — electricity / data / tv / betting × outcome */
  "demo-util-elec-ok": utilityBase("electricity", { defaultOutcome: "Successful", transactionId: "util-elec-ok" }),
  "demo-util-elec-fail": utilityBase("electricity", { defaultOutcome: "Failed", transactionId: "util-elec-fail" }),
  "demo-util-elec-pending": utilityBase("electricity", { defaultOutcome: "Pending", transactionId: "util-elec-pending" }),
  "demo-util-data-ok": utilityBase("data", { defaultOutcome: "Successful", transactionId: "util-data-ok" }),
  "demo-util-data-fail": utilityBase("data", { defaultOutcome: "Failed", transactionId: "util-data-fail" }),
  "demo-util-data-pending": utilityBase("data", { defaultOutcome: "Pending", transactionId: "util-data-pending" }),
  "demo-util-tv-ok": utilityBase("tv", { defaultOutcome: "Successful", transactionId: "util-tv-ok" }),
  "demo-util-tv-fail": utilityBase("tv", { defaultOutcome: "Failed", transactionId: "util-tv-fail" }),
  "demo-util-tv-pending": utilityBase("tv", { defaultOutcome: "Pending", transactionId: "util-tv-pending" }),
  "demo-util-bet-ok": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Deposit",
    depositDetailVariant: "utility_betting",
    customerName: "Betting QA User",
    defaultOutcome: "Successful",
    transactionId: "util-bet-ok",
  },
  "demo-util-bet-fail": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Deposit",
    depositDetailVariant: "utility_betting",
    customerName: "Betting QA User",
    defaultOutcome: "Failed",
    transactionId: "util-bet-fail",
  },
  "demo-util-bet-pending": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Deposit",
    depositDetailVariant: "utility_betting",
    customerName: "Betting QA User",
    defaultOutcome: "Pending",
    transactionId: "util-bet-pending",
  },

  /* E-sim — banner driven by `esimOutcome` */
  "demo-esim-ok": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Esim",
    esimOutcome: "Successful",
    esimChannelLabel: "E-sim",
    customerName: "E-sim QA · OK",
    transactionId: "esim-ok-001",
    defaultOutcome: "Successful",
  },
  "demo-esim-pending": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Esim",
    esimOutcome: "Pending",
    esimChannelLabel: "E-sim",
    customerName: "E-sim QA · Pending",
    transactionId: "esim-pending-001",
    defaultOutcome: "Successful",
  },
  "demo-esim-fail": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Esim",
    esimOutcome: "Failed",
    esimChannelLabel: "E-sim",
    customerName: "E-sim QA · Failed",
    transactionId: "esim-fail-001",
    defaultOutcome: "Successful",
  },

  /* NGN withdrawal */
  "demo-withdraw-ok": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Withdrawal",
    customerName: "Withdrawal QA · OK",
    transactionId: "wd-ok-001",
    defaultOutcome: "Successful",
    withdrawalAmount: "₦75,000.00",
    withdrawalBankName: "Access Bank",
  },
  "demo-withdraw-pending": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Withdrawal",
    customerName: "Withdrawal QA · Pending",
    transactionId: "wd-pending-001",
    defaultOutcome: "Pending",
  },
  "demo-withdraw-fail": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "Withdrawal",
    customerName: "Withdrawal QA · Failed",
    transactionId: "wd-fail-001",
    defaultOutcome: "Failed",
  },

  /* E-trade (transactions hub — not the dedicated e-trades route) */
  "demo-etrade-ok": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "E-trade",
    customerName: "E-trade QA · OK",
    transactionId: "et-ok-001",
    defaultOutcome: "Successful",
    etradeSide: "Buy",
    etradeSymbol: "TSLA | Tesla Inc.",
  },
  "demo-etrade-pending": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "E-trade",
    customerName: "E-trade QA · Pending",
    transactionId: "et-pending-001",
    defaultOutcome: "Pending",
    etradeSide: "Sell",
  },
  "demo-etrade-fail": {
    ...FALLBACK_TRANSACTION_DETAIL_MODEL,
    channel: "E-trade",
    customerName: "E-trade QA · Failed",
    transactionId: "et-fail-001",
    defaultOutcome: "Failed",
    etradeSide: "Buy",
  },

  /* Deposit tab: bank-linked sell deposit success */
  "demo-deposit-ok": cryptoBase("sell_deposit", "Deposit", {
    defaultOutcome: "Successful",
    transactionId: "dep-sell-ok",
    customerName: "Deposit QA · Sell crypto settled",
  }),
};

export function getTransactionDetailModel(id?: string | null): TransactionDetailModel {
  if (id && TRANSACTION_DETAIL_BY_ID[id]) {
    return TRANSACTION_DETAIL_BY_ID[id];
  }
  return FALLBACK_TRANSACTION_DETAIL_MODEL;
}

/**
 * Deliberate demo rows (first in table). Ref prefix encodes scenario for QA.
 * Matrix: giftcard P/S/R; crypto buy/swap/sell × outcomes; utility variants × outcomes;
 * esim ×3; withdrawal ×3; e-trade ×3; deposit ×1.
 */
export const TRANSACTION_DEMO_TABLE_ROWS: TxRow[] = [
  { id: "demo-gc-pending", refNo: "DEMO-GC-PENDING", customerName: "QA Giftcard · pending", channel: "Giftcard", amount: "₦ 520,000", provider: "Quidax", status: "Pending", date: DEMO_DATE },
  { id: "demo-gc-approved", refNo: "DEMO-GC-APPROVED", customerName: "QA Giftcard · success", channel: "Giftcard", amount: "₦ 520,000", provider: "Paxful", status: "Successful", date: DEMO_DATE },
  { id: "demo-gc-rejected", refNo: "DEMO-GC-REJECTED", customerName: "QA Giftcard · rejected", channel: "Giftcard", amount: "₦ 520,000", provider: "Quidax", status: "Failed", date: DEMO_DATE },
  { id: "demo-crypto-buy-ok", refNo: "DEMO-CRYPTO-BUY-OK", customerName: "QA Crypto buy · OK", channel: "Buy Crypto", amount: "$30,000", provider: "Quidex", status: "Successful", date: DEMO_DATE },
  { id: "demo-crypto-buy-fail", refNo: "DEMO-CRYPTO-BUY-FAIL", customerName: "QA Crypto buy · failed", channel: "Buy Crypto", amount: "$30,000", provider: "Quidex", status: "Failed", date: DEMO_DATE },
  { id: "demo-crypto-buy-pending", refNo: "DEMO-CRYPTO-BUY-PEND", customerName: "QA Crypto buy · pending", channel: "Buy Crypto", amount: "$30,000", provider: "Quidex", status: "Pending", date: DEMO_DATE },
  { id: "demo-crypto-swap-ok", refNo: "DEMO-CRYPTO-SWAP-OK", customerName: "QA Crypto swap · OK", channel: "Crypto", amount: "B0.005 BTC", provider: "Quidex", status: "Successful", date: DEMO_DATE },
  { id: "demo-crypto-swap-fail", refNo: "DEMO-CRYPTO-SWAP-FAIL", customerName: "QA Crypto swap · failed", channel: "Crypto", amount: "B0.005 BTC", provider: "Quidex", status: "Failed", date: DEMO_DATE },
  { id: "demo-crypto-swap-pending", refNo: "DEMO-CRYPTO-SWAP-PEND", customerName: "QA Crypto swap · pending", channel: "Crypto", amount: "B0.005 BTC", provider: "Quidex", status: "Pending", date: DEMO_DATE },
  { id: "demo-crypto-selldep-ok", refNo: "DEMO-CRYPTO-SELL-OK", customerName: "QA Sell deposit · OK", channel: "Deposit", amount: "$30,000", provider: "Quidex", status: "Successful", date: DEMO_DATE },
  { id: "demo-crypto-selldep-fail", refNo: "DEMO-CRYPTO-SELL-FAIL", customerName: "QA Sell deposit · failed", channel: "Deposit", amount: "$30,000", provider: "Quidex", status: "Failed", date: DEMO_DATE },
  { id: "demo-crypto-selldep-pending", refNo: "DEMO-CRYPTO-SELL-PEND", customerName: "QA Sell deposit · pending", channel: "Deposit", amount: "$30,000", provider: "Quidex", status: "Pending", date: DEMO_DATE },
  { id: "demo-util-elec-ok", refNo: "DEMO-UTIL-ELEC-OK", customerName: "QA Utility electricity · OK", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Successful", date: DEMO_DATE },
  { id: "demo-util-elec-fail", refNo: "DEMO-UTIL-ELEC-FAIL", customerName: "QA Utility electricity · failed", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Failed", date: DEMO_DATE },
  { id: "demo-util-elec-pending", refNo: "DEMO-UTIL-ELEC-PEND", customerName: "QA Utility electricity · pending", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Pending", date: DEMO_DATE },
  { id: "demo-util-data-ok", refNo: "DEMO-UTIL-DATA-OK", customerName: "QA Utility data · OK", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Successful", date: DEMO_DATE },
  { id: "demo-util-data-fail", refNo: "DEMO-UTIL-DATA-FAIL", customerName: "QA Utility data · failed", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Failed", date: DEMO_DATE },
  { id: "demo-util-data-pending", refNo: "DEMO-UTIL-DATA-PEND", customerName: "QA Utility data · pending", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Pending", date: DEMO_DATE },
  { id: "demo-util-tv-ok", refNo: "DEMO-UTIL-TV-OK", customerName: "QA Utility TV · OK", channel: "Utility", amount: "₦20,000", provider: "Ringo", status: "Successful", date: DEMO_DATE },
  { id: "demo-util-tv-fail", refNo: "DEMO-UTIL-TV-FAIL", customerName: "QA Utility TV · failed", channel: "Utility", amount: "₦20,000", provider: "Ringo", status: "Failed", date: DEMO_DATE },
  { id: "demo-util-tv-pending", refNo: "DEMO-UTIL-TV-PEND", customerName: "QA Utility TV · pending", channel: "Utility", amount: "₦20,000", provider: "Ringo", status: "Pending", date: DEMO_DATE },
  { id: "demo-util-bet-ok", refNo: "DEMO-UTIL-BET-OK", customerName: "QA Utility betting · OK", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Successful", date: DEMO_DATE },
  { id: "demo-util-bet-fail", refNo: "DEMO-UTIL-BET-FAIL", customerName: "QA Utility betting · failed", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Failed", date: DEMO_DATE },
  { id: "demo-util-bet-pending", refNo: "DEMO-UTIL-BET-PEND", customerName: "QA Utility betting · pending", channel: "Utility", amount: "₦30,000", provider: "Ringo", status: "Pending", date: DEMO_DATE },
  { id: "demo-esim-ok", refNo: "DEMO-ESIM-OK", customerName: "QA E-sim · OK", channel: "E-sim", amount: "₦30,000", provider: "Airalo", status: "Successful", date: DEMO_DATE },
  { id: "demo-esim-pending", refNo: "DEMO-ESIM-PEND", customerName: "QA E-sim · pending", channel: "E-sim", amount: "₦30,000", provider: "Airalo", status: "Pending", date: DEMO_DATE },
  { id: "demo-esim-fail", refNo: "DEMO-ESIM-FAIL", customerName: "QA E-sim · failed", channel: "E-sim", amount: "₦30,000", provider: "Airalo", status: "Failed", date: DEMO_DATE },
  { id: "demo-withdraw-ok", refNo: "DEMO-WD-NGN-OK", customerName: "QA NGN withdrawal · OK", channel: "Withdrawal", amount: "₦75,000", provider: "Access Bank", status: "Successful", date: DEMO_DATE },
  { id: "demo-withdraw-pending", refNo: "DEMO-WD-NGN-PEND", customerName: "QA NGN withdrawal · pending", channel: "Withdrawal", amount: "₦75,000", provider: "GTBank", status: "Pending", date: DEMO_DATE },
  { id: "demo-withdraw-fail", refNo: "DEMO-WD-NGN-FAIL", customerName: "QA NGN withdrawal · failed", channel: "Withdrawal", amount: "₦75,000", provider: "GTBank", status: "Failed", date: DEMO_DATE },
  { id: "demo-etrade-ok", refNo: "DEMO-ETRADE-OK", customerName: "QA E-trade · OK", channel: "E-trade", amount: "₦910,000", provider: "Zenith Trade", status: "Successful", date: DEMO_DATE },
  { id: "demo-etrade-pending", refNo: "DEMO-ETRADE-PEND", customerName: "QA E-trade · pending", channel: "E-trade", amount: "₦910,000", provider: "Zenith Trade", status: "Pending", date: DEMO_DATE },
  { id: "demo-etrade-fail", refNo: "DEMO-ETRADE-FAIL", customerName: "QA E-trade · failed", channel: "E-trade", amount: "₦910,000", provider: "Zenith Trade", status: "Failed", date: DEMO_DATE },
  { id: "demo-deposit-ok", refNo: "DEMO-DEPOSIT-OK", customerName: "QA Deposit · sell settled", channel: "Deposit", amount: "$30,000", provider: "Quidex", status: "Successful", date: DEMO_DATE },
];

const FILLER_NAMES = [
  "Naomi Salisu", "Job Awolowo", "Martha Kalio", "Victoria Salisu",
  "Mary Kalio", "Joseph Anunobi", "Sarah Ibe", "Elizabeth Kanu",
];
const FILLER_CHANNELS = ["Crypto", "Deposit", "Withdrawal", "Giftcard", "E-sim", "E-trade", "Buy Crypto", "Sell Crypto", "Utility"];
const FILLER_STATUSES: TxStatus[] = ["Successful", "Pending", "Failed"];

/** Extra rows for pagination demos; unknown ids resolve to `FALLBACK_TRANSACTION_DETAIL_MODEL` in details. */
export function buildFillerTransactionRows(count: number, startIndex: number): TxRow[] {
  return Array.from({ length: count }, (_, i) => {
    const n = startIndex + i;
    return {
      id: `tx-filler-${n}`,
      refNo: `Zenx.WVA.FILLER${String(n).padStart(4, "0")}`,
      customerName: FILLER_NAMES[n % FILLER_NAMES.length],
      channel: FILLER_CHANNELS[n % FILLER_CHANNELS.length],
      amount: "₦ 20,000",
      provider: "XPRESS_PAYMENT",
      status: FILLER_STATUSES[n % FILLER_STATUSES.length],
      date: DEMO_DATE,
    };
  });
}
