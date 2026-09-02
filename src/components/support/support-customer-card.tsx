"use client";

import Link from "next/link";
import { Sms, Call, Verify, SecurityUser } from "iconsax-react";
import type { SupportTicket } from "./types";
import { Button } from "@/components/button";

interface SupportCustomerCardProps {
  ticket: SupportTicket | null;
  onStatusChange: (ticketId: string, status: SupportTicket["status"]) => void;
  onPriorityChange: (ticketId: string, priority: SupportTicket["priority"]) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SupportCustomerCard({
  ticket,
  onStatusChange,
  onPriorityChange,
}: SupportCustomerCardProps) {
  if (!ticket) return null;

  const customer = ticket.customer;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-200 bg-white p-4 overflow-y-auto space-y-4 no-scrollbar">
      {/* User Header Profile */}
      <div className="flex flex-col items-center text-center pb-3 border-b border-zinc-100">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-green/10 font-bold text-secondary-green text-sm">
          {getInitials(customer.name)}
        </div>
        <h3 className="text-sm font-semibold text-primary-text">{customer.name}</h3>
        <p className="font-mono text-[11px] text-zinc-400">{customer.id}</p>

        <div className="mt-2 flex items-center gap-1.5">
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            {customer.kycTier}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 border border-zinc-200 capitalize">
            {customer.accountStatus}
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Sms size="14" variant="Outline" color="currentColor" /> Email
          </span>
          <span className="font-medium text-primary-text truncate max-w-[160px]">{customer.email}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-500">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Call size="14" variant="Outline" color="currentColor" /> Phone
          </span>
          <span className="font-mono font-medium text-primary-text">{customer.phone}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-500">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Verify size="14" variant="Outline" color="currentColor" /> Joined
          </span>
          <span className="font-medium text-primary-text">{customer.registeredDate}</span>
        </div>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Trading Metrics */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Trading Activity
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-zinc-100 bg-zinc-50/60 p-2 text-center">
            <span className="text-[10px] text-zinc-400">Total Trades</span>
            <div className="text-sm font-bold text-primary-text mt-0.5">{customer.totalTrades}</div>
          </div>
          <div className="rounded-md border border-zinc-100 bg-zinc-50/60 p-2 text-center">
            <span className="text-[10px] text-zinc-400">Total Volume</span>
            <div className="text-xs font-bold text-secondary-green mt-0.5 truncate">{customer.totalVolume}</div>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Ticket Attributes */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Ticket Info
        </h4>

        <div>
          <label className="text-[10px] font-medium text-zinc-500 block mb-1">Priority</label>
          <select
            value={ticket.priority}
            onChange={(e) => onPriorityChange(ticket.id, e.target.value as SupportTicket["priority"])}
            className="h-8 w-full rounded-md border border-secondary-green/20 bg-white px-2 text-xs font-medium text-primary-text outline-none focus:border-secondary-green"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-medium text-zinc-500 block mb-1">Assigned Agent</label>
          <div className="flex items-center gap-1.5 h-8 rounded-md border border-zinc-200/80 bg-zinc-50/60 px-2.5 text-xs text-primary-text">
            <SecurityUser size="14" variant="Outline" color="currentColor" className="text-secondary-green" />
            <span>{ticket.assignedAgent?.name || "Unassigned"}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <Link href="/dashboard/user-mgt/customers" className="block w-full">
          <Button variant="secondary" fullWidth className="h-9 text-xs">
            View Full Profile
          </Button>
        </Link>

        {ticket.status !== "resolved" ? (
          <Button
            variant="primary"
            fullWidth
            onClick={() => onStatusChange(ticket.id, "resolved")}
            className="h-9 text-xs"
          >
            Mark Resolved
          </Button>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => onStatusChange(ticket.id, "open")}
            className="h-9 text-xs"
          >
            Re-open Ticket
          </Button>
        )}
      </div>
    </div>
  );
}
