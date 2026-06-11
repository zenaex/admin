import type { GiftcardCardFormat } from "@/components/transactions/transaction-detail-model";

export type TxApprovalStatus = "Approved" | "Pending" | "Rejected";

export type GiftcardDetailModel = {
  sessionId: string;
  customerName: string;
  /** Denomination / category label (e.g. `10-500`). */
  typeLabel: string;
  /** Card delivery format from API (`e-code` vs physical). */
  cardFormat: GiftcardCardFormat;
  cardTypeLabel: string;
  code: string;
  country: string;
  physicalImageUrl?: string;
  amount: string;
  amountPaidOut: string;
  dateUploaded: string;
  dateCompleted: string;
  rateFeeGiven: string;
  balanceAfterGift: string;
  opsInCharge: string;
  provider: string;
  channel?: string;
};

export type GiftcardDeviceModel = {
  device: string;
  deviceId: string;
  location: string;
  locationCoordinate: string;
};

export type GiftcardTransactionDetailsProps = {
  approvalStatus: TxApprovalStatus;
  model: GiftcardDetailModel;
  device: GiftcardDeviceModel;
  rejectionMessage?: string;
  codeDisplay: string;
  canRevealECode?: boolean;
  onRevealECode?: () => void;
  eCodeLoading?: boolean;
  eCodeError?: string | null;
};
