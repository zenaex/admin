import type { EtradeRequestRow } from "@/components/e-trades/etrade-types";

const ETRADE_TYPES = [
  "Cashapp Tag Request",
  "Bank of America",
  "BOA",
  "OTC",
  "Wire",
  "Zelle"
];

const CUSTOMERS = [
  "Naomi Salisu",
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
  
  // Vary minutes and values
  const minute = (32 + (i * 7)) % 60;
  const timeStr = `9:${minute.toString().padStart(2, "0")}AM`;
  
  const valueAmount = 100000 + (i * 5000) % 50000;
  const valueStr = `$${valueAmount.toLocaleString()}.00`;
  
  const status = STATUSES[i % STATUSES.length];

  return {
    id: `etrade-req-${i}`,
    title: etradeType,
    subtitle: `Etrade • ${timeStr}`,
    status,
    etradeType,
    tradeId: `Trade-WVA_S373${i.toString().padStart(3, "0")}OPN`,
    customer: customerName,
    dateCreated: `Jan 6, 2026 | ${timeStr}`,
    tradeValue: valueStr,
    opsInCharge,
  };
});

export const ETRADE_TYPE_FILTER_OPTIONS = ETRADE_TYPES;
