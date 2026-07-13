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

/** Gift card delivery format from API `metadata.cardType`. */
export type GiftcardCardFormat = "e-code" | "physical";

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
  customerId: string;
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
  /** Raw `metadata.cardType` slug (e.g. `e-code`, `physical-cash-receipt`). */
  giftcardCardType: string;
  giftcardCardFormat: GiftcardCardFormat;
  /** Denomination label from `metadata.category` (e.g. `10-500`). */
  giftcardCategory: string;
  giftcardFaceCurrency: string;
  /** Physical card image URL when `giftcardCardFormat` is `physical`. */
  giftcardImageUrl: string;
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
  withdrawalPayoutCurrency: string;
  withdrawalBankName: string;
  withdrawalAccountName: string;
  withdrawalAccountNumber: string;
  withdrawalRemark: string;
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
  meterType: string;
  electricityToken: string;
  electricityUnits: string;
  walletTransactionId: string;
  providerReference: string;
  balanceBefore: string;
  address: string;
  accountName: string;
  accountNumber: string;
  phoneNumber: string;
  smartcardNo: string;
  bettingId: string;
  device: string;
  deviceId: string;
  location: string;
  locationCoordinate: string;
  categorySlug?: string;
  displayCategory?: string;
  productSlug?: string;
  charge?: string;
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
  customerId: "",
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
  giftcardCardType: "",
  giftcardCardFormat: "e-code",
  giftcardCategory: "",
  giftcardFaceCurrency: "",
  giftcardImageUrl: "",
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
  withdrawalPayoutCurrency: "",
  withdrawalBankName: "",
  withdrawalAccountName: "",
  withdrawalAccountNumber: "",
  withdrawalRemark: "",
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
  meterType: "",
  electricityToken: "",
  electricityUnits: "",
  walletTransactionId: "",
  providerReference: "",
  balanceBefore: "",
  address: "",
  accountName: "",
  accountNumber: "",
  phoneNumber: "",
  smartcardNo: "",
  bettingId: "",
  device: "",
  deviceId: "",
  location: "",
  locationCoordinate: "",
  categorySlug: "",
  displayCategory: "",
  productSlug: "",
  charge: "",
};
