export type TxApprovalStatus = "Approved" | "Pending" | "Rejected";

export type GiftcardDetailModel = {
  sessionId: string;
  customerName: string;
  typeLabel: string;
  code: string;
  country: string;
  amount: string;
  amountPaidOut: string;
  dateUploaded: string;
  dateCompleted: string;
  rateFeeGiven: string;
  balanceAfterGift: string;
  opsInCharge: string;
  provider: string;
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
};
