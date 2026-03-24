"use client";

import { More } from "iconsax-react";
import { useRouter } from "next/navigation";

export type CommunicationRow = {
  id: string;
  campaign: string;
  startDate: string;
  endDate: string;
  lastModified: string;
  status: "Publish" | "Unpublished" | "Pending";
};

type CommunicationTableProps = {
  rows: CommunicationRow[];
};

const statusClassMap: Record<CommunicationRow["status"], string> = {
  Publish: "bg-green-100 text-green-700",
  Unpublished: "bg-red-100 text-red-700",
  Pending: "bg-orange-100 text-orange-700",
};

export function CommunicationTable({ rows }: CommunicationTableProps) {
  const router = useRouter();

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-200 border-collapse bg-white text-left text-sm">
        <thead>
          <tr className="bg-zinc-100 text-zinc-500">
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Campaign</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Start Date</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">End Date</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Last Modified</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Status</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer transition-colors hover:bg-zinc-50"
              onClick={() => router.push(`/dashboard/communication/${row.id}`)}
            >
              <td className="border-b border-zinc-100 px-4 py-3 font-medium text-primary-text">
                {row.campaign}
              </td>
              <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.startDate}</td>
              <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.endDate}</td>
              <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.lastModified}</td>
              <td className="border-b border-zinc-100 px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClassMap[row.status]}`}>
                  {row.status}
                </span>
              </td>
              <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">
                <button
                  type="button"
                  className="inline-flex items-center justify-center"
                  aria-label="More"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/communication/${row.id}`);
                  }}
                >
                  <More size={18} variant="Outline" color="currentColor" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
