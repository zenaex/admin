import type { EtradeRequestRow } from "@/components/e-trades/etrade-types";

const ETRADE_TYPES = [
  "Cashapp Tag Request",
  "Bank of America",
  "Bank of America",
  "Bank of America",
  "Bank of America",
  "Bank of America",
  "Bank of America",
  "Bank of America",
  "Barik of America",
  "Bank of America"
];

const CUSTOMERS = [
  "Nsomi Salisu",
  "Job Awolowo",
  "Martha Kalio",
  "Victoria Salisu",
  "Mary Kalio",
  "Joseph Anunobi",
  "Sarah Ibe",
  "Elizabeth Kanu",
  "Elizabeth Amiesi",
  "Margaret Idris",
];

const STATUSES: EtradeRequestRow["status"][] = ["Pending", "Pending", "Successful", "Failed"];

export const ALL_ETRADE_REQUESTS: EtradeRequestRow[] = Array.from({ length: 100 }, (_, i) => {
  const customerName = CUSTOMERS[i % CUSTOMERS.length];
  const opsInCharge = CUSTOMERS[(i + 1) % CUSTOMERS.length];
  const etradeType = ETRADE_TYPES[i % ETRADE_TYPES.length];
  
  const timeStr = "9:32AM";
  const valueStr = "$100,000.00";
  const status = STATUSES[i % STATUSES.length];

  return {
    id: `etrade-req-${i}`,
    title: etradeType,
    subtitle: `Etrade • ${timeStr}`,
    status,
    etradeType,
    tradeId: "Trade-WVA_S373OOOPN",
    customer: customerName,
    dateCreated: `Jan 6, 2026 | ${timeStr}`,
    tradeValue: valueStr,
    opsInCharge,
  };
});

export const ETRADE_TYPE_FILTER_OPTIONS = [
  "Cashapp Tag Request",
  "Bank of America",
  "BOA",
  "OTC",
  "Wire",
  "Zelle"
];
