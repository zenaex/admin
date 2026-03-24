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
    <div className="mt-4 overflow-x-auto">
      <table className="bg-white w-full min-w-200 border-collapse text-left text-sm">
        <thead>
          <tr className="bg-zinc-100 text-zinc-500">
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Name</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Email</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Role</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Action</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Session In</th>
            <th className="border-b border-zinc-200 px-4 py-3 font-medium">Session Out</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer transition-colors hover:bg-zinc-100"
              onClick={() => router.push(`/dashboard/audit-trail/${row.id}`)}
            >
              <td className="border-b border-zinc-100 px-4 py-3 font-medium text-primary-text">
                {row.name}
              </td>
              <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.email}</td>
              <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.role}</td>
              <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.action}</td>
              <td className="border-b border-zinc-100 px-4 py-3 whitespace-nowrap text-zinc-500">
                {row.sessionIn}
              </td>
              <td className="border-b border-zinc-100 px-4 py-3 whitespace-nowrap text-zinc-500">
                {row.sessionOut}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
