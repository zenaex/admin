"use client";

import { useRouter } from "next/navigation";
import { Edit } from "iconsax-react";

export type ProviderRow = {
  id: string;
  name: string;
  category: string;
  dateAdded: string;
  lastUpdated: string;
  noOfProducts: number;
  status: "Active" | "Inactive";
};

type ProviderTableProps = {
  rows: ProviderRow[];
};

const statusStyles: Record<ProviderRow["status"], string> = {
  Active: "bg-green-50 text-green-600",
  Inactive: "bg-red-50 text-red-500",
};

export function ProviderTable({ rows }: ProviderTableProps) {
  const router = useRouter();

  return (
    <div className="mt-4 overflow-x-auto rounded-[8px]">
      <table className="w-full min-w-200 border-collapse bg-white text-left text-sm">
        <thead>
          <tr className="bg-[#E8EBEE] text-zinc-500">
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Providers Name</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Category</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Added</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Last Updated</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">No of Products</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer transition-colors hover:bg-[#F9FAFB]"
              onClick={() => router.push(`/dashboard/provider/${row.id}`)}
            >
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 font-medium text-primary-text align-middle">
                {row.name}
              </td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 text-zinc-500 align-middle">
                {row.category}
              </td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">
                {row.dateAdded}
              </td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">
                {row.lastUpdated}
              </td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 text-zinc-500 align-middle">
                {row.noOfProducts}
              </td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 align-middle">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[row.status]}`}
                >
                  {row.status}
                </span>
              </td>
              <td
                className="h-18 border-b border-[#E8EBEE] px-4 py-0 align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-[#E8EBEE] hover:text-zinc-600"
                  aria-label={`Edit ${row.name}`}
                >
                  <Edit size={16} variant="Outline" color="currentColor" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
