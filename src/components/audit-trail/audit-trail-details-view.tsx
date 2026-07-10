"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2 } from "iconsax-react";

import { AdminApiError } from "@/lib/admin-api/client";
import {
  getAdminAuditCustomerLogs,
  getAdminAuditInternalUserLogs,
} from "@/lib/admin-api/audit-api";
import type { AdminAuditActivityLogEntry, AdminAuditSubjectDetails } from "@/lib/admin-api/types";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TableSkeleton } from "@/components/ui/table-skeleton";

const AUDIT_LOG_EXPORT_COLUMNS: ExportColumn<AdminAuditActivityLogEntry>[] = [
  { header: "Time", value: (l) => l.time },
  { header: "Message", value: (l) => l.message },
  { header: "User Agent", value: (l) => l.userAgent },
  { header: "IP", value: (l) => l.ip },
];

function ActivityGroup({ title, items }: { title: string; items: AdminAuditActivityLogEntry[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-[18px] font-semibold text-primary-text">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 items-center gap-4 rounded-xl border border-outline bg-white px-4 py-4 text-sm sm:grid-cols-[auto_1fr_auto_auto]"
          >
            <span className="rounded-md bg-outline px-2 py-1 text-sidebar-dark">{item.time}</span>
            <span className="text-sidebar-dark">{item.message}</span>
            <span className="text-sidebar-dark">{item.userAgent}</span>
            <span className="text-sidebar-dark">{item.ip}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function groupLogsByDay(logs: AdminAuditActivityLogEntry[]): { title: string; items: AdminAuditActivityLogEntry[] }[] {
  const groups = new Map<string, AdminAuditActivityLogEntry[]>();
  for (const log of logs) {
    const d = new Date(log.raw.timestamp as string ?? log.raw.createdAt as string ?? log.time);
    const key = !Number.isNaN(d.getTime())
      ? d.toLocaleDateString(undefined, { dateStyle: "long" })
      : "Activity";
    const list = groups.get(key) ?? [];
    list.push(log);
    groups.set(key, list);
  }
  if (groups.size === 0) return [];
  return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
}

export type AuditTrailDetailsViewProps = {
  subjectId: string;
  subjectType: "internal" | "customers";
};

export function AuditTrailDetailsView({ subjectId, subjectType }: AuditTrailDetailsViewProps) {
  const [subject, setSubject] = useState<AdminAuditSubjectDetails | null>(null);
  const [logs, setLogs] = useState<AdminAuditActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result =
        subjectType === "customers"
          ? await getAdminAuditCustomerLogs(subjectId)
          : await getAdminAuditInternalUserLogs(subjectId);
      setSubject(result.subject);
      setLogs(result.logs);
    } catch (e) {
      setSubject(null);
      setLogs([]);
      setError(e instanceof AdminApiError ? e.message : "Could not load audit details.");
    } finally {
      setLoading(false);
    }
  }, [subjectId, subjectType]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const logGroups = useMemo(() => groupLogsByDay(logs), [logs]);

  const exportScope = subjectType === "customers" ? "customers" : "internal";
  const runExport = async (format: "csv" | "json" | "pdf") => {
    const filename = `audit-logs-${subjectId}`;
    exportClientTable(filename, format, logs, AUDIT_LOG_EXPORT_COLUMNS);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link
            href="/dashboard/audit-trail"
            className="inline-flex items-center gap-1 text-primary-text hover:underline"
          >
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Audit Trail
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Audit Trail Details</span>
        </div>

        <div className="flex items-center gap-2">
          <TableExportMenu
            label="Export"
            disabled={loading || logs.length === 0}
            onExportCsv={() => runExport("csv")}
            onExportPdf={() => runExport("pdf")}
            onExportJson={() => runExport("json")}
          />
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text hover:bg-surface-subtle transition-colors"
          >
            Action
            <ArrowDown2 size={12} variant="Outline" color="currentColor" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <TableSkeleton
            columns={5}
            rows={1}
            headers={["Name", "Role", "Phone Number", "Email Address", "Date Added"]}
            className="overflow-x-auto rounded-xl border border-outline bg-white"
            headerRowClassName="text-zinc-500"
            headerCellClassName="border-b border-outline px-4 py-3 font-medium"
            rowHeightClass="h-14"
            cellClassName="px-4 py-4 align-middle"
          />
          <TableSkeleton
            columns={3}
            rows={6}
            headers={["Activity", "Device", "IP Address"]}
            className="overflow-x-auto rounded-xl border border-outline bg-white"
            cellVariants={["text-wide", "text-wide", "text-narrow"]}
          />
        </div>
      ) : error ? (
        <ErrorAlert error={error} onRetry={() => void loadDetail()} className="">
          {" "}
          <Link href="/dashboard/audit-trail" className="font-semibold underline">
            Back to list
          </Link>
        </ErrorAlert>
      ) : (
        <>
          <section>
            <h2 className="text-[18px] font-semibold text-primary-text">User Details</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
              <table className="w-full min-w-200 border-collapse text-left text-sm">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="border-b border-outline px-4 py-3 font-medium">Name</th>
                    <th className="border-b border-outline px-4 py-3 font-medium">Role</th>
                    <th className="border-b border-outline px-4 py-3 font-medium">Phone Number</th>
                    <th className="border-b border-outline px-4 py-3 font-medium">Email Address</th>
                    <th className="border-b border-outline px-4 py-3 font-medium">Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-4 text-primary-text">{subject?.name ?? "—"}</td>
                    <td className="px-4 py-4 text-zinc-500">{subject?.role ?? "—"}</td>
                    <td className="px-4 py-4 text-zinc-500">{subject?.phoneNumber ?? "—"}</td>
                    <td className="px-4 py-4 text-zinc-500">{subject?.emailAddress ?? "—"}</td>
                    <td className="px-4 py-4 text-zinc-500">{subject?.dateAdded ?? "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {logs.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">No activity logs from API.</p>
          ) : logGroups.length > 0 ? (
            logGroups.map((group) => (
              <ActivityGroup key={group.title} title={group.title} items={group.items} />
            ))
          ) : (
            <ActivityGroup title="Activity" items={logs} />
          )}
        </>
      )}
    </div>
  );
}
