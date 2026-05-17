"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { AuditTrailHeader } from "@/components/audit-trail/audit-trail-header";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { AuditTrailRow, AuditTrailTable } from "@/components/audit-trail/audit-trail-table";
import { AuditTrailTabId, AuditTrailTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  getAdminAuditCustomerSessions,
  getAdminAuditInternalUserSessions,
} from "@/lib/admin-api/audit-api";
import type { AdminAuditTrailRow } from "@/lib/admin-api/types";
import type { ExportColumn } from "@/lib/export/table-export";
import {
  exportClientTable,
  exportTableWithApiFallback,
  exportViaAuditApi,
} from "@/lib/export/export-handlers";

const AUDIT_EXPORT_COLUMNS: ExportColumn<AdminAuditTrailRow>[] = [
  { header: "Name", value: (r) => r.name },
  { header: "Email", value: (r) => r.email },
  { header: "Role", value: (r) => r.role },
  { header: "Action", value: (r) => r.action },
  { header: "Session In", value: (r) => r.sessionIn },
  { header: "Session Out", value: (r) => r.sessionOut },
];

function toTableRow(row: AdminAuditTrailRow): AuditTrailRow {
  return {
    id: row.id,
    subjectId: row.subjectId,
    subjectType: row.subjectType,
    name: row.name,
    email: row.email,
    role: row.role,
    action: row.action,
    sessionIn: row.sessionIn,
    sessionOut: row.sessionOut,
  };
}

export function AuditTrailView() {
  const [tab, setTab] = useState<AuditTrailTabId>("internal");
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "role" | "action" | "session">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role" | "action" | "session">(openFilter, filterMode);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [internalRows, setInternalRows] = useState<AdminAuditTrailRow[]>([]);
  const [customerRows, setCustomerRows] = useState<AdminAuditTrailRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [draftRole, setDraftRole] = useState("All roles");
  const [draftAction, setDraftAction] = useState("All actions");
  const [draftSessionLabel, setDraftSessionLabel] = useState("Date range (picker coming soon)");
  const [appliedRole, setAppliedRole] = useState<string | null>(null);
  const [appliedAction, setAppliedAction] = useState<string | null>(null);

  const activeApiRows = tab === "customers" ? customerRows : internalRows;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(tableSearch.trim()), 320);
    return () => window.clearTimeout(t);
  }, [tableSearch]);

  useEffect(() => {
    setDraftRole("All roles");
    setDraftAction("All actions");
  }, [tab]);

  useEffect(() => {
    if (!filterMode) setOpenFilter(null);
  }, [filterMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadSessions = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      if (tab === "customers") {
        const rows = await getAdminAuditCustomerSessions();
        setCustomerRows(rows);
      } else {
        const rows = await getAdminAuditInternalUserSessions();
        setInternalRows(rows);
      }
    } catch (e) {
      if (tab === "customers") setCustomerRows([]);
      else setInternalRows([]);
      setListError(e instanceof AdminApiError ? e.message : "Could not load audit trail.");
    } finally {
      setListLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const roleOptions = useMemo(
    () => Array.from(new Set(activeApiRows.map((r) => r.role))).filter((r) => r !== "—").sort(),
    [activeApiRows],
  );
  const actionOptions = useMemo(
    () => Array.from(new Set(activeApiRows.map((r) => r.action))).filter((a) => a !== "—").sort(),
    [activeApiRows],
  );
  const roleFilterOptions = useMemo(() => ["All roles", ...roleOptions], [roleOptions]);
  const actionFilterOptions = useMemo(() => ["All actions", ...actionOptions], [actionOptions]);

  const filteredRows = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return activeApiRows.filter((r) => {
      if (appliedRole && appliedRole !== "All roles" && r.role !== appliedRole) return false;
      if (appliedAction && appliedAction !== "All actions" && r.action !== appliedAction) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.subjectId.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    });
  }, [activeApiRows, appliedRole, appliedAction, debouncedSearch]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize).map(toTableRow);
  }, [filteredRows, safePage, pageSize]);

  const exportScope = tab === "customers" ? "customers" : "internal";

  const runExport = async (format: "csv" | "json" | "pdf") => {
    const filename = `audit-trail-${exportScope}`;
    await exportTableWithApiFallback(
      filename,
      format,
      () => exportViaAuditApi(filename, format, { scope: exportScope }),
      filteredRows,
      AUDIT_EXPORT_COLUMNS,
    );
  };

  const exportProps = {
    exportDisabled: listLoading || filteredRows.length === 0,
    onExportCsv: () => runExport("csv"),
    onExportPdf: () => runExport("pdf"),
    onExportJson: () => runExport("json"),
  };

  return (
    <div>
      <AuditTrailHeader />
      <AuditTrailTabs
        active={tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          setPage(1);
        }}
      />

      {listError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {listError}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void loadSessions()}>
            Retry
          </button>
        </p>
      ) : null}

      {filterMode ? (
        <TableFilterModeBar
          filterBarRef={filterBarRef}
          filterScrollRef={filterScrollRef}
          showBackdrop={Boolean(openFilter)}
          onBackdropClick={() => setOpenFilter(null)}
          onPillsScroll={() => {
            if (openFilter) syncDropdownLeft(openFilter);
          }}
          pills={
            <>
              <TableFilterPill
                label="Role"
                summary={draftRole}
                pillRef={registerPillRef("role")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "role" ? null : "role";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Action"
                summary={draftAction}
                pillRef={registerPillRef("action")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "action" ? null : "action";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Session In"
                summary={draftSessionLabel}
                pillRef={registerPillRef("session")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "session" ? null : "session";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
            </>
          }
          pillsTrailing={
            <TableFilterTrailingIconButton
              ariaLabel="Calendar"
              onClick={() =>
                setOpenFilter((v) => {
                  const next = v === "session" ? null : "session";
                  syncDropdownLeft(next);
                  return next;
                })
              }
            >
              <CalendarDays size={14} />
            </TableFilterTrailingIconButton>
          }
          dropdownLayer={
            <>
              {openFilter === "role" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[220px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={roleFilterOptions}
                    onSelect={(opt) => {
                      setDraftRole(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "action" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="min-w-[240px] max-w-[min(90vw,360px)]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={actionFilterOptions}
                    onSelect={(opt) => {
                      setDraftAction(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "session" ? (
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <p className="px-2 py-2 text-xs text-zinc-500">
                    Date range filters will send ISO dates once a picker is wired.
                  </p>
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedRole(draftRole);
                setAppliedAction(draftAction);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedRole(null);
                setAppliedAction(null);
                setDraftRole("All roles");
                setDraftAction("All actions");
                setDraftSessionLabel("Date range (picker coming soon)");
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <AuditTrailToolbar
          tableSearch={tableSearch}
          onTableSearchChange={setTableSearch}
          onFilterClick={() => setFilterMode(true)}
          {...exportProps}
        />
      )}

      {listLoading ? (
        <p className="mt-4 text-center text-sm text-zinc-500">Loading audit trail…</p>
      ) : (
        <AuditTrailTable rows={paginatedRows} />
      )}

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
