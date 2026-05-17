import type { AdminAuditExportBody, AdminTransactionsExportBody } from "@/lib/admin-api/export-api";
import {
  downloadExportPayload,
  postAdminAuditExport,
  postAdminTransactionsExport,
} from "@/lib/admin-api/export-api";
import {
  downloadJsonFile,
  exportColumnsToCsv,
  exportColumnsToPdfPrint,
  type ExportColumn,
} from "@/lib/export/table-export";

export async function exportViaTransactionsApi(
  filenameBase: string,
  format: "csv" | "json" | "pdf",
  body?: AdminTransactionsExportBody,
): Promise<void> {
  const payload = await postAdminTransactionsExport({
    ...body,
    format: format === "pdf" ? "csv" : format,
  });
  downloadExportPayload(filenameBase, payload, format);
}

export async function exportViaAuditApi(
  filenameBase: string,
  format: "csv" | "json" | "pdf",
  body?: AdminAuditExportBody,
): Promise<void> {
  const payload = await postAdminAuditExport({
    ...body,
    format: format === "pdf" ? "csv" : format,
  });
  downloadExportPayload(filenameBase, payload, format);
}

export function exportClientTable<T>(
  filenameBase: string,
  format: "csv" | "json" | "pdf",
  rows: T[],
  columns: ExportColumn<T>[],
): void {
  if (rows.length === 0) throw new Error("No rows to export.");
  if (format === "csv") {
    exportColumnsToCsv(filenameBase, columns, rows);
    return;
  }
  if (format === "pdf") {
    exportColumnsToPdfPrint(filenameBase, columns, rows);
    return;
  }
  const data = rows.map((row) =>
    Object.fromEntries(columns.map((c) => [c.header, c.value(row)])),
  );
  downloadJsonFile(filenameBase, data);
}

export async function exportTableWithApiFallback<T>(
  filenameBase: string,
  format: "csv" | "json" | "pdf",
  apiExport: () => Promise<void>,
  clientRows: T[],
  columns: ExportColumn<T>[],
): Promise<void> {
  try {
    await apiExport();
  } catch {
    exportClientTable(filenameBase, format, clientRows, columns);
  }
}
