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

/** QA: use in URL path or `?outcome=` (see getEtradeTransactionDetail). */
export const ETRADE_DETAIL_QA_IDS = {
  approved: "etrade-detail-approved",
  pending: "etrade-detail-pending",
  failed: "etrade-detail-failed",
} as const;

export type EtradeDetailOutcome = "approved" | "pending" | "failed";

export type EtradeTransactionDetail = {
  id: string;
  outcome: EtradeDetailOutcome;
  sessionId: string;
  customerName: string;
  channel: string;
  requestDetails: string;
  country: string;
  tradeAmount: string;
  rateFee: string;
  ngnEquivalent: string;
  dateInitiated: string;
  dateCompleted: string;
  opsInCharge: string;
  approvedBy: string;
  dateApproved: string;
  device: string;
  deviceId: string;
  location: string;
  locationCoordinate: string;
};

const APPROVED_BODY: Omit<EtradeTransactionDetail, "id"> = {
  outcome: "approved",
  sessionId: "12324235334252526",
  customerName: "Naomi Salisu",
  channel: "Etrade",
  requestDetails: "Request for BOA",
  country: "United States | USD",
  tradeAmount: "$10,000.00",
  rateFee: "1046/$1",
  ngnEquivalent: "₦10,046,000.00",
  dateInitiated: "Jan 6, 2026 | 9:32AM",
  dateCompleted: "Jan 6, 2026 | 9:32AM",
  opsInCharge: "Florence Arinze",
  approvedBy: "Ezekiel Olajolo",
  dateApproved: "Jan 6, 2026 | 9:32AM",
  device: "Iphone 15pro",
  deviceId: "c83738d53yedhd",
  location: "Ijebu Igbo, Ogun State",
  locationCoordinate: "Lat: 40.748944",
};

const PENDING_BODY: Omit<EtradeTransactionDetail, "id"> = {
  outcome: "pending",
  sessionId: "12324235334252526",
  customerName: "Naomi Salisu",
  channel: "Etrade",
  requestDetails: "Request for BOA",
  country: "United States | USD",
  tradeAmount: "810,000.00",
  rateFee: "1046/81",
  ngnEquivalent: "₦10,460,000.00",
  dateInitiated: "Jan 6, 2025 | 9:32AM",
  dateCompleted: "Jan 6, 2025 | 9:32AM",
  opsInCharge: "Florence Arinze",
  approvedBy: "—",
  dateApproved: "—",
  device: "Iphone 15pro",
  deviceId: "c83738d83yadhd",
  location: "Ijebu Igbo, Ogun State",
  locationCoordinate: "Lat: 40'748944",
};

const FAILED_BODY: Omit<EtradeTransactionDetail, "id"> = {
  outcome: "failed",
  sessionId: "12324235334252526",
  customerName: "Naomi Salisu",
  channel: "Etrade",
  requestDetails: "Request for BOA",
  country: "United States | USD",
  tradeAmount: "$10,000.00",
  rateFee: "1046/81",
  ngnEquivalent: "₦10,460,000.00",
  dateInitiated: "Jan 6, 2026 | 9:32AM",
  dateCompleted: "Jan 6, 2026 | 9:32AM",
  opsInCharge: "Florence Arinze",
  approvedBy: "—",
  dateApproved: "—",
  device: "Iphone 15pro",
  deviceId: "c83738d83yedhd",
  location: "Ijebu Igbo, Ogun State",
  locationCoordinate: "Lat: 40748944",
};

const DETAIL_BY_ID: Record<string, Omit<EtradeTransactionDetail, "id">> = {
  [ETRADE_DETAIL_QA_IDS.approved]: APPROVED_BODY,
  [ETRADE_DETAIL_QA_IDS.pending]: PENDING_BODY,
  [ETRADE_DETAIL_QA_IDS.failed]: FAILED_BODY,
};

const OUTCOME_BODY: Record<EtradeDetailOutcome, Omit<EtradeTransactionDetail, "id">> = {
  approved: APPROVED_BODY,
  pending: PENDING_BODY,
  failed: FAILED_BODY,
};

export function parseEtradeDetailOutcome(raw: string | null | undefined): EtradeDetailOutcome | undefined {
  if (raw === "approved" || raw === "pending" || raw === "failed") return raw;
  return undefined;
}

export function getEtradeTransactionDetail(
  id: string,
  outcomeOverride?: EtradeDetailOutcome,
): EtradeTransactionDetail {
  const fromQuery = outcomeOverride ? OUTCOME_BODY[outcomeOverride] : undefined;
  const fromId = DETAIL_BY_ID[id];
  const body = fromQuery ?? fromId ?? APPROVED_BODY;
  return { id, ...body };
}
