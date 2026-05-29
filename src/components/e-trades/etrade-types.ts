export type EtradeRequestStatus = "Pending" | "Successful" | "Failed";

export type EtradeRequestRow = {
  id: string;
  title: string;
  subtitle: string;
  status: EtradeRequestStatus;
  etradeType: string;
  tradeId: string;
  customer: string;
  dateCreated: string;
  tradeValue: string;
  opsInCharge: string;
};

export type EtradeTabId = "requests" | "transaction-details";
