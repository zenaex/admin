"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send2,
  Paperclip,
  Lock,
  Flash,
  DocumentDownload,
  Check,
  RotateLeft,
} from "iconsax-react";
import {
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
  MOCK_CANNED_RESPONSES,
} from "./mock-data";
import type { SupportTicket, CannedResponse } from "./types";
import { Button } from "@/components/button";
import { ProviderHeader } from "@/components/provider/provider-header";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";

interface SupportDetailsViewProps {
  id: string;
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-profile-picture text-xs font-semibold text-blue-grey">
      {initials || "?"}
    </span>
  );
}

export function SupportDetailsView({ id }: SupportDetailsViewProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<SupportTicket | undefined>(() => getTicketById(id));
  const [inputText, setInputText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showCannedMenu, setShowCannedMenu] = useState(false);
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

  const handleSend = () => {
    if (!inputText.trim()) return;
    const updated = addTicketMessage(ticket.id, inputText.trim(), isInternalNote);
    if (updated) setTicket({ ...updated });
    setInputText("");
    setShowCannedMenu(false);
  };

  const handleStatusChange = (newStatus: SupportTicket["status"]) => {
    const updated = updateTicketStatus(ticket.id, newStatus);
    if (updated) setTicket({ ...updated });
  };

  const handlePriorityChange = (newPriority: SupportTicket["priority"]) => {
    const updated = updateTicketPriority(ticket.id, newPriority);
    if (updated) setTicket({ ...updated });
  };

  const insertCannedResponse = (cr: CannedResponse) => {
    setInputText(cr.content);
    setShowCannedMenu(false);
  };

  const getPriorityBadge = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center rounded-full bg-[#FCEBEC] px-3 py-1 text-xs font-semibold text-[#EB5757]">
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center rounded-full bg-[#FEF5ED] px-3 py-1 text-xs font-semibold text-[#E28743]">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center rounded-full bg-[#FFF9E6] px-3 py-1 text-xs font-semibold text-[#D97706]">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-[#EAF9F1] px-3 py-1 text-xs font-semibold text-[#27AE60]">
            Low
          </span>
        );
    }
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

  const customer = ticket.customer;

  return (
    <div className="flex flex-col gap-4">
      {/* Standard Page Header */}
      <ProviderHeader title="Support Desk" />

      {/* Breadcrumb Navigation & Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/dashboard/support"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-primary-text font-medium transition-colors"
          >
            <ArrowLeft size="14" />
            <span>Support Desk</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-primary-text">{ticket.ticketNumber}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {getStatusBadge(ticket.status)}
          {ticket.status !== "resolved" ? (
            <button
              type="button"
              onClick={() => setShowResolveModal(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary-green px-4 text-xs font-semibold text-primary-text hover:opacity-90 transition-opacity"
            >
              <Check size="14" />
              <span>Mark Resolved</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStatusChange("open")}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-secondary-green bg-white px-4 text-xs font-semibold text-secondary-green hover:bg-secondary-green/5 transition-colors"
            >
              <RotateLeft size="14" />
              <span>Re-open Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Details Grid (matching TransactionDetailsGrid in E-trades) */}
      <div className="overflow-x-auto rounded-[8px] bg-white border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <tbody>
            {/* Header Row 1 */}
            <tr className="bg-[#F9F9F9] text-zinc-400 border-b border-zinc-100">
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Ticket ID</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Customer</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Email</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Phone</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">KYC Status</th>
            </tr>
            {/* Data Row 1 */}
            <tr className="border-b border-zinc-100">
              <td className="h-14 px-4 py-0 align-middle font-bold text-[#0B294F]">{ticket.ticketNumber}</td>
              <td className="h-14 px-4 py-0 align-middle font-medium text-primary-text">
                <div className="flex items-center gap-2">
                  <Avatar name={customer.name} />
                  <span>{customer.name}</span>
                </div>
              </td>
              <td className="h-14 px-4 py-0 align-middle text-zinc-500">{customer.email}</td>
              <td className="h-14 px-4 py-0 align-middle font-mono text-zinc-500">{customer.phone}</td>
              <td className="h-14 px-4 py-0 align-middle">
                <span className="inline-flex items-center rounded-full bg-[#EAF9F1] px-2.5 py-0.5 text-xs font-semibold text-[#27AE60]">
                  {customer.kycTier}
                </span>
              </td>
            </tr>

            {/* Header Row 2 */}
            <tr className="bg-[#F9F9F9] text-zinc-400 border-b border-zinc-100">
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Category</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Subject</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Priority</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Assigned Agent</th>
              <th className="h-10 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Date Created</th>
            </tr>
            {/* Data Row 2 */}
            <tr>
              <td className="h-14 px-4 py-0 align-middle text-zinc-600 font-medium">{ticket.category}</td>
              <td className="h-14 px-4 py-0 align-middle text-zinc-700 font-medium max-w-[240px] truncate">{ticket.subject}</td>
              <td className="h-14 px-4 py-0 align-middle">{getPriorityBadge(ticket.priority)}</td>
              <td className="h-14 px-4 py-0 align-middle text-zinc-600 font-medium">
                {ticket.assignedAgent?.name || "Unassigned"}
              </td>
              <td className="h-14 px-4 py-0 align-middle text-zinc-500">{ticket.createdAt}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dedicated Support Chat Feature Card */}
      <div className="mt-2 overflow-hidden rounded-[8px] bg-white border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-[#F9F9F9] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary-text">Live Support Conversation</span>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
              {ticket.messages.length} messages
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-zinc-400">Change Priority:</label>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value as SupportTicket["priority"])}
              className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-primary-text outline-none focus:border-secondary-green"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Message Feed Timeline */}
        <div className="flex flex-col gap-3 p-5 max-h-[520px] min-h-[300px] overflow-y-auto bg-surface-subtle no-scrollbar">
          {ticket.messages.map((m) => {
            if (m.senderType === "note") {
              // Internal Note
              return (
                <div
                  key={m.id}
                  className="mx-auto my-1.5 max-w-[90%] rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-[#92400E] shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-[#92400E]">
                    <div className="flex items-center gap-1.5">
                      <Lock size="13" />
                      <span>{m.senderName}</span>
                    </div>
                    <span className="text-[10px] text-[#B45309] font-normal">{m.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{m.content}</p>
                </div>
              );
            }

            const isAdmin = m.senderType === "admin";
            return (
              <div
                key={m.id}
                className={`flex flex-col max-w-[80%] ${
                  isAdmin ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1">
                  <span className="font-semibold text-zinc-600">{m.senderName}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isAdmin
                      ? "bg-secondary-green text-white rounded-tr-none shadow-2xs"
                      : "bg-white text-zinc-800 rounded-tl-none border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.attachments && m.attachments.length > 0 ? (
                    <div className={`mt-2.5 space-y-1 border-t pt-2 ${isAdmin ? "border-white/20" : "border-zinc-100"}`}>
                      {m.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between rounded-md px-2.5 py-1 text-[11px] ${
                            isAdmin ? "bg-white/10 text-white" : "bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <DocumentDownload size="13" />
                            <span className="truncate">{att.name}</span>
                          </div>
                          <span className={`ml-2 font-mono text-[10px] ${isAdmin ? "text-zinc-300" : "text-zinc-400"}`}>
                            {att.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Section */}
        <div className="border-t border-zinc-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-md bg-zinc-100 p-0.5 border border-zinc-200/60">
              <button
                type="button"
                onClick={() => setIsInternalNote(false)}
                className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                  !isInternalNote
                    ? "bg-white text-primary-text shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Public Customer Reply
              </button>
              <button
                type="button"
                onClick={() => setIsInternalNote(true)}
                className={`flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold transition-colors ${
                  isInternalNote
                    ? "bg-amber-500 text-black"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Lock size="12" />
                <span>Internal Note</span>
              </button>
            </div>

            {/* Quick Replies Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCannedMenu(!showCannedMenu)}
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:text-primary-text transition-colors"
              >
                <Flash size="13" className="text-amber-500" />
                <span>Quick Replies</span>
              </button>

              {showCannedMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-xl z-20 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 border-b border-zinc-100">
                    Select Quick Response
                  </div>
                  {MOCK_CANNED_RESPONSES.map((cr) => (
                    <button
                      key={cr.id}
                      onClick={() => insertCannedResponse(cr)}
                      className="w-full text-left rounded p-2 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="text-xs font-medium text-primary-text">{cr.title}</div>
                      <div className="font-mono text-[10px] text-zinc-400">{cr.shortcut}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Textarea Input */}
          <div
            className={`flex flex-col rounded-lg border p-3 transition-colors ${
              isInternalNote
                ? "border-amber-300 bg-amber-50/40 focus-within:border-amber-500"
                : "border-secondary-green/25 bg-white focus-within:border-secondary-green"
            }`}
          >
            <textarea
              rows={3}
              placeholder={
                isInternalNote
                  ? "Write an internal team note (only visible to admins)..."
                  : "Type your customer reply here..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSend();
                }
              }}
              className="w-full bg-transparent text-xs text-primary-text placeholder:text-zinc-400 outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Attach File"
              >
                <Paperclip size="18" />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-400 hidden sm:inline">⌘+Enter to send</span>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-semibold transition-opacity disabled:opacity-50 ${
                    isInternalNote
                      ? "bg-amber-500 text-black hover:opacity-90"
                      : "bg-primary-green text-primary-text hover:opacity-90"
                  }`}
                >
                  <span>{isInternalNote ? "Save Note" : "Send Reply"}</span>
                  <Send2 size="13" variant="Bold" />
                </button>
              </div>
            </div>
          </div>
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
            handleStatusChange("resolved");
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
