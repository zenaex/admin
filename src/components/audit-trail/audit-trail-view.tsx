"use client";

import { useEffect, useMemo, useState } from "react";
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

const INTERNAL_BASE_ROWS: Omit<AuditTrailRow, "id">[] = [
  {
    name: "Adeboye Temidayo",
    email: "Adeboye.temidayo@zaneax.com",
    role: "Superadmin",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chioma N.",
    email: "chioma.n@zaneax.com",
    role: "Admin",
    action: "Added a user",
    sessionIn: "Jan 6, 2026 | 10:15AM",
    sessionOut: "Jan 6, 2026 | 11:02AM",
  },
  {
    name: "Ibrahim Sule",
    email: "ibrahim.s@zaneax.com",
    role: "Tech Support",
    action: "Deactivated a user",
    sessionIn: "Jan 5, 2026 | 2:40PM",
    sessionOut: "Jan 5, 2026 | 4:12PM",
  },
  {
    name: "Grace Okoro",
    email: "grace.o@zaneax.com",
    role: "Admin",
    action: "Approved wallet transaction",
    sessionIn: "Jan 5, 2026 | 8:10AM",
    sessionOut: "Jan 5, 2026 | 9:45AM",
  },
  {
    name: "Tunde Bakare",
    email: "tunde.b@zaneax.com",
    role: "Superadmin",
    action: "Updated role permissions",
    sessionIn: "Jan 4, 2026 | 3:22PM",
    sessionOut: "Jan 4, 2026 | 3:55PM",
  },
  {
    name: "Amaka Eze",
    email: "amaka.e@zaneax.com",
    role: "Tech Support",
    action: "Reset MFA device",
    sessionIn: "Jan 4, 2026 | 11:05AM",
    sessionOut: "Jan 4, 2026 | 11:30AM",
  },
  {
    name: "Kingsley O.",
    email: "kingsley.o@zaneax.com",
    role: "Admin",
    action: "Exported audit report",
    sessionIn: "Jan 3, 2026 | 4:50PM",
    sessionOut: "Jan 3, 2026 | 5:10PM",
  },
  {
    name: "Yewande A.",
    email: "yewande.a@zaneax.com",
    role: "Superadmin",
    action: "Approved wallet transaction",
    sessionIn: "Jan 3, 2026 | 9:00AM",
    sessionOut: "Jan 3, 2026 | 10:12AM",
  },
];

const CUSTOMER_BASE_ROWS: Omit<AuditTrailRow, "id">[] = [
  {
    name: "Adeboye Temidayo",
    email: "Adeboye.temidayo@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Azuka Adefemi",
    email: "Azuka.adefemi@zaneax.com",
    role: "@Kashmadupe",
    action: "Added a user",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Babangida Tunde",
    email: "Babangida.tunde@zaneax.com",
    role: "@Kashmadupe",
    action: "Deactivated a user",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chiamaka Ngozi",
    email: "Chiamaka.ngozi@zaneax.com",
    role: "@Kashmadupe",
    action: "Added a user",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chiroma Ikechukwu",
    email: "Chiroma.ikechukwu@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chizoba Adekunle",
    email: "Chizoba.adekunle@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Lala Jibola",
    email: "Lala.jibola@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Lala Serubawon",
    email: "Lala.serubawon@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
];

function buildMockRows(
  count: number,
  baseRows: Omit<AuditTrailRow, "id">[],
  idPrefix: string,
): AuditTrailRow[] {
  return Array.from({ length: count }, (_, i) => {
    const base = baseRows[i % baseRows.length];
    return {
      ...base,
      id: `${idPrefix}-row-${i}`,
      name: i < baseRows.length ? base.name : `${base.name} (${i + 1})`,
    };
  });
}

const INTERNAL_ROWS = buildMockRows(180, INTERNAL_BASE_ROWS, "internal");
const CUSTOMER_ROWS = buildMockRows(180, CUSTOMER_BASE_ROWS, "customer");

export function AuditTrailView() {
  const [tab, setTab] = useState<AuditTrailTabId>("internal");
  const [tableSearch, setTableSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "role" | "action" | "session">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role" | "action" | "session">(openFilter, filterMode);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const activeRows = tab === "customers" ? CUSTOMER_ROWS : INTERNAL_ROWS;

  const roleOptions = useMemo(
    () => Array.from(new Set(activeRows.map((r) => r.role))).sort(),
    [activeRows],
  );
  const actionOptions = useMemo(
    () => Array.from(new Set(activeRows.map((r) => r.action))).sort(),
    [activeRows],
  );
  const roleFilterOptions = useMemo(() => ["All roles", ...roleOptions], [roleOptions]);
  const actionFilterOptions = useMemo(() => ["All actions", ...actionOptions], [actionOptions]);

  const [draftRole, setDraftRole] = useState("All roles");
  const [draftAction, setDraftAction] = useState("All actions");
  const [draftSessionLabel, setDraftSessionLabel] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedRole, setAppliedRole] = useState<string | null>(null);
  const [appliedAction, setAppliedAction] = useState<string | null>(null);
  const [appliedSessionLabel, setAppliedSessionLabel] = useState<string | null>(null);

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

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return activeRows.filter((r) => {
      if (appliedRole && appliedRole !== "All roles" && r.role !== appliedRole) return false;
      if (appliedAction && appliedAction !== "All actions" && r.action !== appliedAction)
        return false;
      if (appliedSessionLabel && !r.sessionIn.includes("Jan 6, 2026")) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [tableSearch, activeRows, appliedRole, appliedAction, appliedSessionLabel]);

  const totalItems = filteredRows.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

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
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-[13px] text-primary-text hover:bg-zinc-50"
                    onClick={() => {
                      setDraftSessionLabel("From Jan 6, 2026 - To Jan 6, 2026");
                      setOpenFilter(null);
                    }}
                  >
                    Jan 6, 2026 - Jan 6, 2026
                    <CalendarDays size={16} />
                  </button>
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedRole(draftRole);
                setAppliedAction(draftAction);
                setAppliedSessionLabel(draftSessionLabel);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedRole(null);
                setAppliedAction(null);
                setAppliedSessionLabel(null);
                setDraftRole("All roles");
                setDraftAction("All actions");
                setDraftSessionLabel("From Jan 6, 2026 - To Jan 6, 2026");
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
          onFilterClick={() => {
            setTableSearch("");
            setFilterMode(true);
          }}
        />
      )}
      <AuditTrailTable rows={paginatedRows} />
      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
