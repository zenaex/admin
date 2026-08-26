export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type MessageSenderType = "customer" | "admin" | "system" | "note";

export interface SupportChatMessage {
  id: string;
  senderType: MessageSenderType;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  attachments?: {
    name: string;
    size: string;
    url?: string;
  }[];
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  kycTier: string;
  accountStatus: "active" | "suspended" | "flagged";
  registeredDate: string;
  totalTrades: number;
  totalVolume: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: "Giftcard Trade" | "Crypto Trade" | "Withdrawal" | "Account KYC" | "General Help";
  status: TicketStatus;
  priority: TicketPriority;
  customer: CustomerProfile;
  assignedAgent?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
  messages: SupportChatMessage[];
}

export interface CannedResponse {
  id: string;
  shortcut: string;
  title: string;
  content: string;
}
