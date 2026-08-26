import type { SupportTicket, CannedResponse } from "./types";

export const MOCK_CANNED_RESPONSES: CannedResponse[] = [
  {
    id: "cr-1",
    shortcut: "/kyc-pending",
    title: "KYC Verification Under Review",
    content:
      "Hello! Your KYC verification documents have been received and are currently being processed by our compliance team. Review typically takes 15–30 minutes.",
  },
  {
    id: "cr-2",
    shortcut: "/trade-delay",
    title: "Giftcard Trade Verification Notice",
    content:
      "Hi there. Giftcard code verification is in progress with the provider. As soon as the balance confirmation is returned, your payout will be instantly released.",
  },
  {
    id: "cr-3",
    shortcut: "/payout-success",
    title: "Withdrawal Completed Confirmation",
    content:
      "Your withdrawal request has been successfully processed and sent to your bank account. Transaction reference #: TXN-9948271.",
  },
  {
    id: "cr-4",
    shortcut: "/ask-screenshot",
    title: "Request Payment Proof / Screenshot",
    content:
      "Could you please upload a clear screenshot of the debit receipt or card code so our team can investigate your request further?",
  },
];

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "tkt-101",
    ticketNumber: "TKT-8841",
    subject: "Giftcard verification pending over 30 mins",
    category: "Giftcard Trade",
    status: "open",
    priority: "high",
    createdAt: "10 mins ago",
    updatedAt: "2 mins ago",
    unreadCount: 2,
    customer: {
      id: "usr-4921",
      name: "Chidiebere Nwosu",
      email: "chidi.nwosu@example.com",
      phone: "+234 803 123 4567",
      kycTier: "Tier 3 Verified",
      accountStatus: "active",
      registeredDate: "Jan 14, 2025",
      totalTrades: 48,
      totalVolume: "$12,450.00",
    },
    assignedAgent: {
      name: "Sarah Jenkins",
      email: "sarah.j@zenaex.com",
    },
    messages: [
      {
        id: "msg-1",
        senderType: "customer",
        senderName: "Chidiebere Nwosu",
        content:
          "Hi team, I uploaded an Amazon $100 gift card about 35 minutes ago (Ref: GC-773829). Status is still showing 'Under Review'. Can you check?",
        timestamp: "10:14 AM",
        attachments: [
          { name: "amazon_card_front.jpg", size: "1.2 MB" },
          { name: "receipt_amazon.png", size: "840 KB" },
        ],
      },
      {
        id: "msg-2",
        senderType: "note",
        senderName: "Sarah Jenkins (Internal Note)",
        content:
          "Checked provider portal. Provider gateway experienced a brief 5-min timeout at 10:15 AM. Retry batch sent.",
        timestamp: "10:20 AM",
      },
      {
        id: "msg-3",
        senderType: "customer",
        senderName: "Chidiebere Nwosu",
        content: "Any update on this please? Client is waiting.",
        timestamp: "10:24 AM",
      },
    ],
  },
  {
    id: "tkt-102",
    ticketNumber: "TKT-8839",
    subject: "Withdrawal to GTBank failed but debited wallet",
    category: "Withdrawal",
    status: "pending",
    priority: "urgent",
    createdAt: "45 mins ago",
    updatedAt: "15 mins ago",
    customer: {
      id: "usr-8812",
      name: "Amina Bello",
      email: "amina.bello@example.com",
      phone: "+234 812 987 6543",
      kycTier: "Tier 2 Verified",
      accountStatus: "active",
      registeredDate: "Feb 02, 2025",
      totalTrades: 19,
      totalVolume: "₦4,850,000.00",
    },
    assignedAgent: {
      name: "David Adeleke",
      email: "david.a@zenaex.com",
    },
    messages: [
      {
        id: "msg-10",
        senderType: "customer",
        senderName: "Amina Bello",
        content:
          "I requested a ₦150,000 payout to GTBank Account 0123456789. The money left my Zenaex wallet but bank has not received it.",
        timestamp: "09:40 AM",
      },
      {
        id: "msg-11",
        senderType: "admin",
        senderName: "David Adeleke",
        content:
          "Hello Amina, thank you for reaching out. We have flagged this with our NIBSS payout switch operator. Rest assured your funds are safe.",
        timestamp: "09:55 AM",
      },
    ],
  },
  {
    id: "tkt-103",
    ticketNumber: "TKT-8830",
    subject: "How to upgrade KYC from Tier 1 to Tier 2?",
    category: "Account KYC",
    status: "resolved",
    priority: "low",
    createdAt: "2 hours ago",
    updatedAt: "1 hour ago",
    customer: {
      id: "usr-3049",
      name: "Emmanuel Okafor",
      email: "e.okafor@example.com",
      phone: "+234 701 555 1212",
      kycTier: "Tier 1 Verified",
      accountStatus: "active",
      registeredDate: "Mar 10, 2025",
      totalTrades: 5,
      totalVolume: "$620.00",
    },
    assignedAgent: {
      name: "Sarah Jenkins",
      email: "sarah.j@zenaex.com",
    },
    messages: [
      {
        id: "msg-20",
        senderType: "customer",
        senderName: "Emmanuel Okafor",
        content: "What documents do I need to increase my daily withdrawal limit?",
        timestamp: "08:15 AM",
      },
      {
        id: "msg-21",
        senderType: "admin",
        senderName: "Sarah Jenkins",
        content:
          "Hi Emmanuel! You need a valid government-issued ID (NIN, Driver License, or Voter Card) and proof of address. Go to Settings > Identity Verification in the app.",
        timestamp: "08:30 AM",
      },
      {
        id: "msg-22",
        senderType: "customer",
        senderName: "Emmanuel Okafor",
        content: "Thank you! Just uploaded my NIN slip now.",
        timestamp: "08:45 AM",
      },
    ],
  },
  {
    id: "tkt-104",
    ticketNumber: "TKT-8822",
    subject: "USDT Deposit hash unconfirmed after 12 blocks",
    category: "Crypto Trade",
    status: "open",
    priority: "medium",
    createdAt: "3 hours ago",
    updatedAt: "2 hours ago",
    customer: {
      id: "usr-9104",
      name: "Kelechi Eze",
      email: "k.eze@example.com",
      phone: "+234 809 333 4455",
      kycTier: "Tier 3 Verified",
      accountStatus: "active",
      registeredDate: "Dec 01, 2024",
      totalTrades: 112,
      totalVolume: "$45,900.00",
    },
    assignedAgent: {
      name: "David Adeleke",
      email: "david.a@zenaex.com",
    },
    messages: [
      {
        id: "msg-30",
        senderType: "customer",
        senderName: "Kelechi Eze",
        content:
          "Tx Hash: 0x7a8f92c10b23d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9. USDT TRC20 transfer hasn't reflected in my wallet balance.",
        timestamp: "07:20 AM",
      },
    ],
  },
];

export function getTicketById(id: string): SupportTicket | undefined {
  return MOCK_TICKETS.find((t) => t.id === id || t.ticketNumber === id);
}

export function addTicketMessage(
  ticketId: string,
  content: string,
  isInternalNote: boolean
): SupportTicket | undefined {
  const ticket = getTicketById(ticketId);
  if (!ticket) return undefined;

  const newMsg = {
    id: `msg-${Date.now()}`,
    senderType: isInternalNote ? ("note" as const) : ("admin" as const),
    senderName: isInternalNote ? "Admin (Internal Note)" : "You (Support Agent)",
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  ticket.messages.push(newMsg);
  ticket.updatedAt = "Just now";
  return ticket;
}

export function updateTicketStatus(
  ticketId: string,
  status: SupportTicket["status"]
): SupportTicket | undefined {
  const ticket = getTicketById(ticketId);
  if (ticket) {
    ticket.status = status;
  }
  return ticket;
}

export function updateTicketPriority(
  ticketId: string,
  priority: SupportTicket["priority"]
): SupportTicket | undefined {
  const ticket = getTicketById(ticketId);
  if (ticket) {
    ticket.priority = priority;
  }
  return ticket;
}
