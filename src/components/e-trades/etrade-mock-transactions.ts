export type EtradeTxnListStatus = "Successful" | "Failed";

export type EtradeTransactionListRow = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  status: EtradeTxnListStatus;
};

const TITLES = [
  "Request for BOA",
  "Request for Cashapp",
  "Request for Zelle",
  "Request for Wire",
  "Request for OTC",
];

const STATUSES: EtradeTxnListStatus[] = ["Successful", "Failed"];

export const ALL_ETRADE_TRANSACTION_ROWS: EtradeTransactionListRow[] = Array.from(
  { length: 120 },
  (_, i) => ({
    id: `etrade-txn-${i}`,
    title: TITLES[i % TITLES.length],
    subtitle: "Etrade • 9:18 AM",
    amount: "$100.00",
    status: STATUSES[i % STATUSES.length],
  }),
);

export type EtradeTransactionDetail = {
  id: string;
  sessionId: string;
  customerName: string;
  channel: string;
  type: string;
  country: string;
  tradeAmount: string;
  dateCompleted: string;
  rateFee: string;
  provider: string;
  device: string;
  deviceId: string;
  location: string;
  locationCoordinate: string;
};

const BASE_DETAIL: Omit<EtradeTransactionDetail, "id"> = {
  sessionId: "12324235334252526",
  customerName: "Naomi Salisu",
  channel: "Etrade",
  type: "Request for BOA",
  country: "United States | USD",
  tradeAmount: "$10,000.00",
  dateCompleted: "Jan 6, 2026 | 9:32AM",
  rateFee: "1046/$1",
  provider: "Zenaex",
  device: "Iphone 15pro",
  deviceId: "c83738d83yedhd",
  location: "Ijebu Igbo, Ogun State",
  locationCoordinate: "Lat: 40'748944",
};

export function getEtradeTransactionDetail(id: string): EtradeTransactionDetail {
  return {
    id,
    ...BASE_DETAIL,
  };
}
