export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function formatExportCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function buildCsvContent(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map((c) => escapeCsvCell(c)).join(","));
  }
  return lines.join("\r\n");
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8" });
  downloadBlob(filename.endsWith(".csv") ? filename : `${filename}.csv`, blob);
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(filename.endsWith(".json") ? filename : `${filename}.json`, blob);
}

export function exportColumnsToCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  if (rows.length === 0) throw new Error("No rows to export.");
  const headers = columns.map((c) => c.header);
  const dataRows = rows.map((row) => columns.map((c) => c.value(row)));
  downloadCsvFile(filename, buildCsvContent(headers, dataRows));
}

export function exportColumnsToPdfPrint<T>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
): void {
  if (rows.length === 0) throw new Error("No rows to export.");
  const headers = columns.map((c) => c.header);
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td style="padding:8px;border:1px solid #eee">${escapeHtml(c.value(row))}</td>`).join("")}</tr>`,
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
    th,td{text-align:left}th{background:#f4f4f5;padding:8px;border:1px solid #eee}</style></head>
    <body><h1>${escapeHtml(title)}</h1><table><thead><tr>
    ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const win = window.open("", "_blank");
  if (!win) throw new Error("Pop-up blocked. Allow pop-ups to export PDF.");
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function recordsToColumns(records: Record<string, unknown>[]): ExportColumn<Record<string, unknown>>[] {
  if (records.length === 0) return [];
  const keys = new Set<string>();
  for (const r of records) Object.keys(r).forEach((k) => keys.add(k));
  return Array.from(keys).map((header) => ({
    header,
    value: (row) => formatExportCell(row[header]),
  }));
}

export function exportRecordsToCsv(filename: string, records: Record<string, unknown>[]): void {
  const columns = recordsToColumns(records);
  exportColumnsToCsv(filename, columns, records);
}

export function exportRecordsToPdfPrint(title: string, records: Record<string, unknown>[]): void {
  const columns = recordsToColumns(records);
  exportColumnsToPdfPrint(title, columns, records);
}
