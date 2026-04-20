export type EtradeChatItem =
  | { id: string; kind: "date"; label: string }
  | { id: string; kind: "text-left"; sender: "chatbot" | "agent"; body: string }
  | { id: string; kind: "text-right"; body: string; time: string }
  | {
      id: string;
      kind: "wallet";
      cryptoLabel: string;
      address: string;
      rateLabel: string;
    }
  | { id: string; kind: "money-sent"; amount: string };

/** Static demo thread — matches product screenshots. */
export const ETRADE_DEMO_CHAT: EtradeChatItem[] = [
  { id: "d1", kind: "date", label: "12 December, 2026" },
  {
    id: "m1",
    kind: "text-left",
    sender: "chatbot",
    body: "What would you like to trade today? Choose an option below.",
  },
  { id: "m2", kind: "text-right", body: "Sell Crypto (OTC)", time: "12:44pm" },
  {
    id: "m3",
    kind: "text-left",
    sender: "chatbot",
    body: "Which cryptocurrency would you like to sell?",
  },
  { id: "m4", kind: "text-right", body: "USDT", time: "12:50pm" },
  {
    id: "m5",
    kind: "text-left",
    sender: "chatbot",
    body: "Which fiat currency would you like to use for this trade?",
  },
  { id: "m6", kind: "text-right", body: "NGN (Nigeria Naira)", time: "1:00pm" },
  {
    id: "m7",
    kind: "wallet",
    cryptoLabel: "Bitcoin",
    address: "bc1qgyf7atrw9yuerly4gc6w",
    rateLabel: "Rate: $1= N14,000",
  },
  {
    id: "m8",
    kind: "text-left",
    sender: "agent",
    body: "Kindly send your crypto to the wallet address above.",
  },
  { id: "m9", kind: "text-right", body: "Crypto Sent", time: "1:10pm" },
  { id: "m10", kind: "money-sent", amount: "$10,000.00" },
  {
    id: "m11",
    kind: "text-left",
    sender: "agent",
    body: "Thank you for trading with us.",
  },
];

export function getEtradeChatTitle(_requestId: string): string {
  return "Request for BOA";
}
