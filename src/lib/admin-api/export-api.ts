import { adminRequest } from "@/lib/admin-api/client";
import {
  buildCsvContent,
  downloadCsvFile,
  downloadJsonFile,
  exportRecordsToCsv,
  exportRecordsToPdfPrint,
} from "@/lib/export/table-export";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Unwrap export API responses into flat record rows. */
export function extractExportRecords(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((x) => asRecord(x) ?? {}).filter((o) => Object.keys(o).length > 0);
  }
  const r = asRecord(data);
  if (!r) return [];
  const inner =
    r.data ?? r.items ?? r.results ?? r.records ?? r.rows ?? r.transactions ?? r.logs ?? r.export;
  if (Array.isArray(inner)) {
    return inner.map((x) => asRecord(x) ?? {}).filter((o) => Object.keys(o).length > 0);
  }
  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested = dataInner.items ?? dataInner.records ?? dataInner.results ?? dataInner.rows;
    if (Array.isArray(nested)) {
      return nested.map((x) => asRecord(x) ?? {}).filter((o) => Object.keys(o).length > 0);
    }
  }
  return [];
}

export type AdminTransactionsExportBody = {
  format?: "csv" | "json";
  search?: string;
  userId?: string;
  productSlug?: string;
  providerSlug?: string;
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
};

export type AdminAuditExportBody = {
  format?: "csv" | "json";
  scope?: "internal" | "customers" | "all";
  fromDate?: string;
  toDate?: string;
};

export async function postAdminTransactionsExport(
  body?: AdminTransactionsExportBody,
): Promise<unknown> {
  return adminRequest<unknown>("/admin/transactions/export", {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export async function postAdminAuditExport(body?: AdminAuditExportBody): Promise<unknown> {
  return adminRequest<unknown>("/admin/audit/export", {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export function downloadExportPayload(
  filenameBase: string,
  payload: unknown,
  format: "csv" | "json" | "pdf",
): void {
  if (format === "json") {
    downloadJsonFile(filenameBase, payload);
    return;
  }

  const records = extractExportRecords(payload);
  if (records.length === 0) {
    const r = asRecord(payload);
    if (r && Object.keys(r).length > 0) {
      const single = [r];
      if (format === "pdf") exportRecordsToPdfPrint(filenameBase, single);
      else exportRecordsToCsv(filenameBase, single);
      return;
    }
    throw new Error("No records returned to export.");
  }

  if (format === "pdf") {
    exportRecordsToPdfPrint(filenameBase, records);
    return;
  }

  exportRecordsToCsv(filenameBase, records);
}

/** Fallback: build CSV directly from in-memory rows when API export is unavailable. */
export function downloadSimpleTableCsv(
  filenameBase: string,
  headers: string[],
  rows: string[][],
): void {
  downloadCsvFile(filenameBase, buildCsvContent(headers, rows));
}
