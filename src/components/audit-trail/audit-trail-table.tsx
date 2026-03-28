"use client";

import { useRouter } from "next/navigation";

export type AuditTrailRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  action: string;
  sessionIn: string;
  sessionOut: string;
};

type AuditTrailTableProps = {
  rows: AuditTrailRow[];
};

export function AuditTrailTable({ rows }: AuditTrailTableProps) {
  const router = useRouter();

  return (
    <div className="mt-4 overflow-x-auto rounded-[8px]">
      <table className="bg-white w-full min-w-200 border-collapse text-left text-sm">
        <thead>
          <tr className="bg-[#E8EBEE] text-zinc-500">
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Name</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Role</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Session In</th>
            <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Session Out</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer transition-colors hover:bg-[#E8EBEE]"
              onClick={() => router.push(`/dashboard/audit-trail/${row.id}`)}
            >
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 font-medium text-primary-text align-middle">
                {row.name}
              </td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 text-zinc-500 align-middle">{row.role}</td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 text-zinc-500 align-middle">{row.action}</td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">
                {row.sessionIn}
              </td>
              <td className="h-18 border-b border-[#E8EBEE] px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">
                {row.sessionOut}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
