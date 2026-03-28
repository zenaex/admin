"use client";

import { useMemo, useState } from "react";
import { ArrowDown2 } from "iconsax-react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";

type ResetRequest = { id: string; name: string; email: string; role: string; dateRequested: string };

const BASE_REQUESTS: Omit<ResetRequest, "id">[] = [
  { name: "Adeboye Temidayo",  email: "Adeboye.temidayo@zanaex.com",  role: "Superadmin",   dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Azuka Adefemi",     email: "Azuka.adefemi@zanaex.com",     role: "Admin",        dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Babangida Tunde",   email: "Babangida.tunde@zanaex.com",   role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiamaka Ngozi",    email: "Chiamaka.ngozi@zanaex.com",    role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiroma Ikechukwu", email: "Chiroma.ikechukwu@zanaex.com", role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Chizoba Adekunle",  email: "Chizoba.adekunle@shago.com",   role: "Admin",        dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Lala Jibola",       email: "Lala.jibola@zanaex.com",       role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Shakur Wasiu",      email: "Shakur.wasiu@zanaex.com",      role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
];

const ALL_REQUESTS: ResetRequest[] = Array.from({ length: 48 }, (_, i) => ({
  ...BASE_REQUESTS[i % BASE_REQUESTS.length],
  id: `req-${i}`,
  name: i < BASE_REQUESTS.length
    ? BASE_REQUESTS[i].name
    : `${BASE_REQUESTS[i % BASE_REQUESTS.length].name} (${i + 1})`,
}));

export function ResetRequestsTable() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [pending, setPending] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const safePage = Math.min(page, Math.max(1, Math.ceil(ALL_REQUESTS.length / pageSize)));
  const paginatedRows = useMemo(
    () => ALL_REQUESTS.slice((safePage - 1) * pageSize, safePage * pageSize),
    [safePage, pageSize],
  );
  const allChecked = paginatedRows.length > 0 && paginatedRows.every((r) => selected.has(r.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) paginatedRows.forEach((r) => next.delete(r.id));
      else paginatedRows.forEach((r) => next.add(r.id));
      return next;
    });

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleConfirm = () => {
    if (!pending) return;
    const msg =
      pending.action === "approve"
        ? "Password resent has been approved. Team Member will get a reset link."
        : "Password resent has been rejected.";
    setPending(null);
    setSuccessMsg(msg);
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-[#F9FAFB] text-zinc-500">
              <th className="h-11 w-10 border-b border-zinc-200 px-4 py-0 align-middle">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                />
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                <span className="inline-flex items-center gap-1">
                  Name <ArrowDown2 size={12} variant="Outline" color="currentColor" />
                </span>
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Role</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Requested</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-[#F9FAFB]">
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 align-middle">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                  />
                </td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 align-middle">
                  <span className="cursor-pointer font-medium text-black underline underline-offset-2">
                    {row.name}
                  </span>
                </td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 text-zinc-500 align-middle">{row.role}</td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">
                  {row.dateRequested}
                </td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 align-middle">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setPending({ id: row.id, action: "reject" })}
                      className="text-sm font-medium text-red-500 underline transition-colors hover:text-red-700"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setPending({ id: row.id, action: "approve" })}
                      className="text-sm font-medium text-green-600 underline transition-colors hover:text-green-800"
                    >
                      Approve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={ALL_REQUESTS.length}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />

      {pending?.action === "approve" && (
        <ConfirmModal
          variant="approve"
          title="Approve Request"
          message="Are you sure you want to approve this password reset?"
          confirmLabel="Approve"
          cancelLabel="Continue"
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      {pending?.action === "reject" && (
        <ConfirmModal
          variant="danger"
          title="Reject Reset"
          message="Are you sure you want to reject this password reset?"
          confirmLabel="Reject"
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      {successMsg && (
        <SuccessModal message={successMsg} onContinue={() => setSuccessMsg(null)} />
      )}
    </div>
  );
}
