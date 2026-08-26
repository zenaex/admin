"use client";

import { SearchNormal1, FilterSearch } from "iconsax-react";
import type { SupportTicket, TicketStatus } from "./types";

interface SupportTicketListProps {
  tickets: SupportTicket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  statusFilter: TicketStatus | "all";
  onStatusFilterChange: (status: TicketStatus | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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

export function SupportTicketList({
  tickets,
  selectedTicketId,
  onSelectTicket,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
}: SupportTicketListProps) {
  const getPriorityBadge = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "urgent":
        return <span className="text-[10px] font-semibold text-red-600 uppercase">Urgent</span>;
      case "high":
        return <span className="text-[10px] font-semibold text-amber-600 uppercase">High</span>;
      case "medium":
        return <span className="text-[10px] font-semibold text-yellow-600 uppercase">Med</span>;
      default:
        return <span className="text-[10px] font-semibold text-emerald-600 uppercase">Low</span>;
    }
  };

  const getStatusDot = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Open" />;
      case "pending":
        return <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Pending" />;
      case "resolved":
        return <span className="h-2 w-2 rounded-full bg-zinc-400 shrink-0" title="Resolved" />;
      default:
        return <span className="h-2 w-2 rounded-full bg-zinc-300 shrink-0" title="Closed" />;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Search & Tabs Header */}
      <div className="border-b border-zinc-100 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary-text">
            Tickets <span className="ml-1 text-xs text-zinc-400">({tickets.length})</span>
          </h2>
        </div>

        <div className="relative">
          <SearchNormal1
            size="15"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-secondary-green/20 bg-white pl-9 pr-3 text-xs text-primary-text placeholder:text-zinc-400 outline-none focus:border-secondary-green transition-colors"
          />
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex items-center gap-1 border-t border-zinc-100 pt-2 text-xs">
          {(["all", "open", "pending", "resolved"] as const).map((st) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`capitalize rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === st
                  ? "bg-secondary-green text-white font-semibold"
                  : "text-zinc-500 hover:text-primary-text hover:bg-zinc-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 no-scrollbar">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <FilterSearch size="28" className="mb-2 opacity-40" />
            <p className="text-xs">No tickets match your filter</p>
          </div>
        ) : (
          tickets.map((t) => {
            const isSelected = t.id === selectedTicketId;
            return (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t.id)}
                className={`flex cursor-pointer items-start gap-3 p-3 transition-colors ${
                  isSelected
                    ? "bg-zinc-100/90 border-l-2 border-l-secondary-green"
                    : "hover:bg-zinc-50"
                }`}
              >
                {/* Initials Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700">
                  {getInitials(t.customer.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold text-primary-text">
                      {t.customer.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0">{t.updatedAt}</span>
                  </div>

                  <p className="truncate text-xs text-zinc-600 mt-0.5">{t.subject}</p>

                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getStatusDot(t.status)}
                      <span className="font-mono text-[10px] text-zinc-400">{t.ticketNumber}</span>
                    </div>
                    {getPriorityBadge(t.priority)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
