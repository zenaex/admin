import type { TxApprovalStatus } from "@/components/transactions/transaction-details/types";

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

/** Full detail model for `/dashboard/transactions/[id]` layouts. */
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
  giftcardInitialStatus: TxApprovalStatus;
  /** UUID for `POST /admin/transactions/gift-cards/submissions/{id}/...`. */
  giftcardSubmissionId: string;
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
  /** True when API returned a status we could map (controls status banner). */
  hasMappedStatus: boolean;
  rejectionMessage: string;
  product: string;
  plan: string;
  cashback: string;
  walletAddress: string;
  network: string;
  networkFee: string;
  meterNumber: string;
  address: string;
  accountName: string;
  phoneNumber: string;
  smartcardNo: string;
  bettingId: string;
  device: string;
  deviceId: string;
  location: string;
  locationCoordinate: string;
};

export const EMPTY_TRANSACTION_DETAIL_MODEL: TransactionDetailModel = {
  channel: "Deposit",
  depositDetailVariant: "utility",
  esimOutcome: "Pending",
  esimChannelLabel: "",
  esimCoverage: "",
  esimDataAllowance: "",
  esimValidity: "",
  esimPriceUsd: "",
  esimPriceNgn: "",
  esimProvider: "",
  esimBalanceAfter: "",
  utilityDetailVariant: "electricity",
  cryptoDetailVariant: "buy",
  transactionId: "",
  customerName: "",
  typeDeposit: "",
  currency: "",
  amountSent: "",
  amountUsd: "",
  amountEquivalent: "",
  datedInitiated: "",
  dateCompleted: "",
  rateGiven: "",
  provider: "",
  ourFee: "",
  balanceAfter: "",
  coinReceived: "",
  sessionId: "",
  typeGift: "",
  giftcardType: "",
  giftcardProvider: "",
  code: "",
  country: "",
  amount: "",
  amountPaidOut: "",
  dateUploaded: "",
  rateFeeGiven: "",
  balanceAfterGift: "",
  opsInCharge: "",
  giftcardInitialStatus: "Pending",
  giftcardSubmissionId: "",
  defaultOutcome: "Pending",
  withdrawalAmount: "",
  withdrawalFee: "",
  withdrawalBankName: "",
  withdrawalAccountName: "",
  withdrawalAccountNumber: "",
  withdrawalBalanceAfter: "",
  withdrawalTimestamp: "",
  etradeSymbol: "",
  etradeSide: "",
  etradeQuantity: "",
  etradeAmountNgn: "",
  etradeFee: "",
  etradeBalanceAfter: "",
  etradeTimestamp: "",
  hasMappedStatus: false,
  rejectionMessage: "",
  product: "",
  plan: "",
  cashback: "",
  walletAddress: "",
  network: "",
  networkFee: "",
  meterNumber: "",
  address: "",
  accountName: "",
  phoneNumber: "",
  smartcardNo: "",
  bettingId: "",
  device: "",
  deviceId: "",
  location: "",
  locationCoordinate: "",
};
