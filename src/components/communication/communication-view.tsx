"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { CommunicationHeader } from "@/components/communication/communication-header";
import { CommunicationPagination } from "@/components/communication/communication-pagination";
import { CommunicationRow, CommunicationTable } from "@/components/communication/communication-table";
import { CommunicationToolbar } from "@/components/communication/communication-toolbar";
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

const BASE_ROWS: Omit<CommunicationRow, "id">[] = [
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Publish",
  },
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Publish",
  },
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Unpublished",
  },
  {
    campaign: "Summer savings bonus",
    startDate: "Jan 6, 2026 | 9:32AM",
    endDate: "Jan 6, 2026 | 9:32AM",
    lastModified: "Jan 6, 2026 | 9:32AM",
    status: "Pending",
  },
];

function buildRows(count: number): CommunicationRow[] {
  return Array.from({ length: count }, (_, i) => {
    const base = BASE_ROWS[i % BASE_ROWS.length];
    return {
      ...base,
      id: `communication-row-${i}`,
      campaign: i < BASE_ROWS.length ? base.campaign : `${base.campaign} ${i + 1}`,
    };
  });
}

const ALL_ROWS = buildRows(180);

const STATUS_OPTIONS = ["All statuses", "Publish", "Unpublished", "Pending"] as const;

export function CommunicationView() {
  const [tableSearch, setTableSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "status" | "start">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"status" | "start">(openFilter, filterMode);

  const [draftStatus, setDraftStatus] = useState<string>("All statuses");
  const [draftStartLabel, setDraftStartLabel] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);
  const [appliedStartLabel, setAppliedStartLabel] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

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
    return ALL_ROWS.filter((r) => {
      if (appliedStatus && appliedStatus !== "All statuses" && r.status !== appliedStatus) return false;
      if (appliedStartLabel && !r.startDate.includes("Jan 6, 2026")) return false;
      if (!q) return true;
      return (
        r.campaign.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [tableSearch, appliedStatus, appliedStartLabel]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  return (
    <div>
      <CommunicationHeader />
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
                label="Status"
                summary={draftStatus}
                pillRef={registerPillRef("status")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "status" ? null : "status";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Start date"
                summary={draftStartLabel}
                pillRef={registerPillRef("start")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "start" ? null : "start";
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
                  const next = v === "start" ? null : "start";
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
              {openFilter === "status" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={[...STATUS_OPTIONS]}
                    onSelect={(opt) => {
                      setDraftStatus(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "start" ? (
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-[13px] text-primary-text hover:bg-zinc-50"
                    onClick={() => {
                      setDraftStartLabel("From Jan 6, 2026 - To Jan 6, 2026");
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
                setAppliedStatus(draftStatus === "All statuses" ? null : draftStatus);
                setAppliedStartLabel(draftStartLabel);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedStatus(null);
                setAppliedStartLabel(null);
                setDraftStatus("All statuses");
                setDraftStartLabel("From Jan 6, 2026 - To Jan 6, 2026");
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <CommunicationToolbar
          tableSearch={tableSearch}
          onTableSearchChange={setTableSearch}
          onFilterClick={() => {
            setTableSearch("");
            setFilterMode(true);
          }}
        />
      )}
      <CommunicationTable rows={paginatedRows} />
      <CommunicationPagination
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
