"use client";

import { useRouter } from "next/navigation";
import type { SupportTicket } from "./types";

interface SupportTableProps {
  tickets: SupportTicket[];
  loading?: boolean;
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

export function SupportTable({ tickets, loading = false }: SupportTableProps) {
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="mt-4 flex h-64 items-center justify-center rounded-[8px] bg-white border border-zinc-100 text-sm text-zinc-400">
        Loading support tickets...
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-[8px] bg-white border border-zinc-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-[#F9F9F9] text-zinc-400 border-b border-zinc-100">
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Ticket ID</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Customer</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Category</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Subject</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Priority</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Status</th>
            <th className="h-11 px-4 py-0 text-xs font-semibold text-zinc-400 align-middle">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                No support tickets found.
              </td>
            </tr>
          ) : (
            tickets.map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/dashboard/support/${row.id}`)}
                className="group cursor-pointer border-b border-zinc-100 transition-colors hover:bg-surface-subtle"
              >
                {/* Ticket ID */}
                <td className="h-16 px-4 py-0 align-middle font-medium">
                  <span className="text-[#0B294F] font-bold underline decoration-solid decoration-[#0B294F] hover:opacity-85">
                    {row.ticketNumber}
                  </span>
                  {row.unreadCount && row.unreadCount > 0 ? (
                    <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-secondary-green text-[10px] font-bold text-white">
                      {row.unreadCount}
                    </span>
                  ) : null}
                </td>

                {/* Customer */}
                <td className="h-16 px-4 py-0 align-middle">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.customer.name} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary-text">{row.customer.name}</span>
                      <span className="text-xs text-zinc-400">{row.customer.email}</span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="h-16 px-4 py-0 align-middle text-zinc-600 font-medium">
                  {row.category}
                </td>

                {/* Subject */}
                <td className="h-16 px-4 py-0 align-middle text-zinc-500 max-w-[280px] truncate">
                  {row.subject}
                </td>

                {/* Priority */}
                <td className="h-16 px-4 py-0 align-middle">
                  {getPriorityBadge(row.priority)}
                </td>

                {/* Status */}
                <td className="h-16 px-4 py-0 align-middle">
                  {getStatusBadge(row.status)}
                </td>

                {/* Last Updated */}
                <td className="h-16 px-4 py-0 align-middle text-zinc-500 whitespace-nowrap">
                  {row.updatedAt}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
