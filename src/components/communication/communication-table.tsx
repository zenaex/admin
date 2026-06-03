"use client";

import { useState } from "react";
import { CloseCircle, Eye, More, Send2, Trash } from "iconsax-react";
import { useRouter } from "next/navigation";
import type { AdminCampaign } from "@/lib/admin-api/types";

export type CommunicationRow = AdminCampaign;

export type CommunicationListAction = "view" | "publish" | "delete" | "cancel";

type CommunicationTableProps = {
  rows: AdminCampaign[];
  actionLoading?: boolean;
  onAction: (action: CommunicationListAction, row: AdminCampaign) => void;
};

const statusClassMap: Record<AdminCampaign["status"], string> = {
  Publish: "bg-green-100 text-green-700",
  Unpublished: "bg-red-100 text-red-700",
  Pending: "bg-orange-100 text-orange-700",
};

export function CommunicationTable({ rows, actionLoading = false, onAction }: CommunicationTableProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuCoords(null);
  };

  const runAction = (action: CommunicationListAction, row: AdminCampaign) => {
    closeMenu();
    onAction(action, row);
  };

  return (
    <div className="mt-4 overflow-x-auto rounded-[8px]">
      <table className="w-full min-w-200 border-collapse bg-white text-left text-sm">
        <thead>
          <tr className="bg-outline text-zinc-500">
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Campaign</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Start Date</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">End Date</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Last Modified</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer transition-colors hover:bg-surface-subtle"
              onClick={() => router.push(`/dashboard/communication/${row.id}`)}
            >
              <td className="h-18 border-b border-outline px-4 py-0 font-medium text-secondary-green align-middle">
                {row.campaign}
              </td>
              <td className="h-18 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.startDate}</td>
              <td className="h-18 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.endDate}</td>
              <td className="h-18 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.lastModified}</td>
              <td className="h-18 border-b border-outline px-4 py-0 align-middle">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClassMap[row.status]}`}>
                  {row.status}
                </span>
              </td>
              <td
                className="h-18 border-b border-outline px-4 py-0 text-zinc-500 align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <button
                    type="button"
                    disabled={actionLoading}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-outline hover:text-zinc-600 disabled:opacity-50"
                    aria-label={`Actions for ${row.campaign}`}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuCoords({
                        top: rect.bottom + 4,
                        left: rect.right - 224,
                      });
                      setOpenMenuId((id) => (id === row.id ? null : row.id));
                    }}
                  >
                    <More size={18} variant="Outline" color="currentColor" className="rotate-90" />
                  </button>

                  {openMenuId === row.id ? (
                    <>
                      <div className="fixed inset-0 z-40" onClick={closeMenu} aria-hidden />
                      <div
                        style={{
                          position: "fixed",
                          top: menuCoords ? `${menuCoords.top}px` : undefined,
                          left: menuCoords ? `${menuCoords.left}px` : undefined,
                          width: "224px",
                        }}
                        className="z-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => runAction("view", row)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50"
                        >
                          <Eye size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                          View details
                        </button>

                        {row.status === "Unpublished" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => runAction("publish", row)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50"
                            >
                              <Send2 size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                              Publish
                            </button>
                            <button
                              type="button"
                              onClick={() => runAction("delete", row)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
                            >
                              <Trash size={16} variant="Outline" color="currentColor" />
                              Delete draft
                            </button>
                          </>
                        ) : null}

                        {row.status === "Pending" ? (
                          <button
                            type="button"
                            onClick={() => runAction("cancel", row)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50"
                          >
                            <CloseCircle size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                            Cancel scheduled
                          </button>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
