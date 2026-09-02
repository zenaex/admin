"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft2, ArrowRight2, Check, RotateLeft } from "iconsax-react";
import {
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
} from "./mock-data";
import type { SupportTicket } from "./types";
import { SupportChatThread } from "./support-chat-thread";
import { SupportCustomerCard } from "./support-customer-card";
import { Button } from "@/components/button";
import { ProviderHeader } from "@/components/provider/provider-header";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";

interface SupportDetailsViewProps {
  id: string;
}

export function SupportDetailsView({ id }: SupportDetailsViewProps) {
  const [ticket, setTicket] = useState<SupportTicket | undefined>(() => getTicketById(id));
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!ticket) {
    return (
      <div className="flex flex-col gap-4">
        <ProviderHeader title="Support Desk" />
        <div className="mt-6 flex flex-col items-center justify-center rounded-[8px] bg-white border border-zinc-100 p-12 text-center shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
          <h3 className="text-base font-semibold text-primary-text">Ticket Not Found</h3>
          <p className="mt-1 text-xs text-zinc-500">The requested support ticket could not be found.</p>
          <Link href="/dashboard/support" className="mt-4">
            <Button variant="secondary" className="h-9 text-xs">
              Back to Support Desk
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSendMessage = (ticketId: string, content: string, isInternalNote: boolean) => {
    const updated = addTicketMessage(ticketId, content, isInternalNote);
    if (updated) setTicket({ ...updated });
  };

  const handleStatusChange = (ticketId: string, newStatus: SupportTicket["status"]) => {
    const updated = updateTicketStatus(ticketId, newStatus);
    if (updated) setTicket({ ...updated });
  };

  const handlePriorityChange = (ticketId: string, newPriority: SupportTicket["priority"]) => {
    const updated = updateTicketPriority(ticketId, newPriority);
    if (updated) setTicket({ ...updated });
  };

  const getStatusBadge = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center rounded-full bg-[#EAF9F1] px-3 py-1 text-xs font-semibold text-[#27AE60]">
            Open
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center rounded-full bg-[#FEF5ED] px-3 py-1 text-xs font-semibold text-[#E28743]">
            Pending
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
            Closed
          </span>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col min-h-0">
      {/* Page Header */}
      <ProviderHeader title="Support Desk" />

      {/* Standard Detail Page Navigation & Header Bar */}
      <div className="mt-4 mb-4 flex h-[66px] items-center justify-between rounded-xl border border-outline bg-white px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/support" className="inline-flex items-center gap-1 text-primary-text hover:underline">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Support Desk
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="font-mono font-bold text-secondary-green">{ticket.ticketNumber}</span>
          <span className="text-zinc-300">•</span>
          <span className="font-medium text-primary-text max-w-[240px] sm:max-w-[380px] truncate">
            {ticket.subject}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {getStatusBadge(ticket.status)}
          {ticket.status !== "resolved" ? (
            <button
              type="button"
              onClick={() => setShowResolveModal(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary-green px-4 text-xs font-semibold text-primary-text hover:opacity-90 transition-opacity"
            >
              <Check size="14" variant="Outline" color="currentColor" />
              <span>Mark Resolved</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStatusChange(ticket.id, "open")}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-secondary-green bg-white px-4 text-xs font-semibold text-secondary-green hover:bg-secondary-green/5 transition-colors"
            >
              <RotateLeft size="14" variant="Outline" color="currentColor" />
              <span>Re-open Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Main Content Layout */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left Column: Chat Conversation Thread (70% width on desktop) */}
        <div className="lg:col-span-8 h-full min-h-0 flex flex-col">
          <SupportChatThread
            ticket={ticket}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Right Column: Customer Info & Ticket Details Card (30% width on desktop) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          <SupportCustomerCard
            ticket={ticket}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
          />
        </div>
      </div>

      {/* Confirm Resolve Modal */}
      {showResolveModal && (
        <ConfirmModal
          title="Resolve Ticket"
          message={`Are you sure you want to mark ticket ${ticket.ticketNumber} as resolved?`}
          confirmLabel="Mark Resolved"
          cancelLabel="Cancel"
          variant="approve"
          onConfirm={() => {
            handleStatusChange(ticket.id, "resolved");
            setShowResolveModal(false);
            setShowSuccessModal(true);
          }}
          onCancel={() => setShowResolveModal(false)}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={`Ticket ${ticket.ticketNumber} has been successfully resolved.`}
          confirmLabel="Done"
          onContinue={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}
