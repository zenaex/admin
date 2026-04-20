import type { EtradeRequestRow } from "@/components/e-trades/etrade-types";

const ETRADE_TYPES = ["Request for BOA", "Request for OTC", "Request for Wire"];

const BASE: Omit<EtradeRequestRow, "id">[] = [
  {
    title: "Request for BOA",
    subtitle: "Etrade • 9:18 AM",
    status: "Pending",
    etradeType: "Request for BOA",
  },
  {
    title: "Request for BOA",
    subtitle: "Etrade • 9:18 AM",
    status: "Pending",
    etradeType: "Request for BOA",
  },
  {
    title: "Request for OTC",
    subtitle: "Etrade • 10:02 AM",
    status: "Successful",
    etradeType: "Request for OTC",
  },
];

export const ALL_ETRADE_REQUESTS: EtradeRequestRow[] = Array.from({ length: 100 }, (_, i) => {
  const base = BASE[i % BASE.length];
  return {
    ...base,
    id: `etrade-req-${i}`,
    title: base.title,
  };
});

export const ETRADE_TYPE_FILTER_OPTIONS = ETRADE_TYPES;
