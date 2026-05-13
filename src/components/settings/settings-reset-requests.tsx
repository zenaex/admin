"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown2 } from "iconsax-react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { postPasswordResetApprove, postPasswordResetDecline } from "@/lib/admin-api/auth-api";
import { getAdminSettingsPasswordResetRequests } from "@/lib/admin-api/settings-api";
import { AdminApiError } from "@/lib/admin-api/client";
import type { AdminSettingsPasswordResetRequestRow } from "@/lib/admin-api/types";

export function ResetRequestsTable() {
  const [rows, setRows] = useState<AdminSettingsPasswordResetRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [pending, setPending] = useState<{ requestId: string; action: "approve" | "decline" } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const list = await getAdminSettingsPasswordResetRequests();
      setRows(list);
      setPage(1);
    } catch (e) {
      setRows([]);
      setLoadError(e instanceof AdminApiError ? e.message : "Could not load reset requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(Math.max(rows.length, 1) / pageSize)));
  const paginatedRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  );

  const handleConfirm = async () => {
    if (!pending || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    try {
      if (pending.action === "approve") {
        await postPasswordResetApprove({ requestId: pending.requestId });
        setSuccessMsg("Password reset approved. The user will receive a reset link by email.");
      } else {
        await postPasswordResetDecline({ requestId: pending.requestId });
        setSuccessMsg("Password reset request declined.");
      }
      setPending(null);
      await load();
    } catch (e) {
      setActionError(e instanceof AdminApiError ? e.message : "Request failed.");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading reset requests…</p>;
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {loadError}
        <button type="button" className="ml-3 font-semibold underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-surface-subtle text-zinc-500">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                <span className="inline-flex items-center gap-1">
                  Name <ArrowDown2 size={12} variant="Outline" color="currentColor" />
                </span>
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Role</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date requested</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="border-b border-outline px-4 py-8 text-center text-zinc-500">
                  No pending password reset requests.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr key={row.requestId} className="transition-colors hover:bg-surface-subtle">
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                    <span className="font-medium text-primary-text">{row.name ?? "—"}</span>
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.email ?? "—"}</td>
                  <td className="h-16 border-b border-outline px-4 py-0 text-zinc-500 align-middle">{row.role ?? "—"}</td>
                  <td className="h-16 whitespace-nowrap border-b border-outline px-4 py-0 text-zinc-500 align-middle">
                    {row.dateRequested ?? "—"}
                  </td>
                  <td className="h-16 border-b border-outline px-4 py-0 align-middle">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setPending({ requestId: row.requestId, action: "decline" });
                        }}
                        className="text-sm font-medium text-red-500 underline transition-colors hover:text-red-700"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setPending({ requestId: row.requestId, action: "approve" });
                        }}
                        className="text-sm font-medium text-green-600 underline transition-colors hover:text-green-800"
                      >
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 ? (
        <AuditTrailPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={rows.length}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      ) : null}

      {pending?.action === "approve" && (
        <ConfirmModal
          variant="approve"
          title="Approve request"
          message="Are you sure you want to approve this password reset?"
          confirmLabel={actionBusy ? "Working…" : "Approve"}
          cancelLabel="Cancel"
          onConfirm={() => void handleConfirm()}
          onCancel={() => !actionBusy && setPending(null)}
        />
      )}

      {pending?.action === "decline" && (
        <ConfirmModal
          variant="danger"
          title="Decline request"
          message="Are you sure you want to decline this password reset?"
          confirmLabel={actionBusy ? "Working…" : "Decline"}
          cancelLabel="Cancel"
          onConfirm={() => void handleConfirm()}
          onCancel={() => !actionBusy && setPending(null)}
        />
      )}

      {successMsg && <SuccessModal message={successMsg} onContinue={() => setSuccessMsg(null)} />}
    </div>
  );
}
