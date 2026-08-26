"use client";

import { useState, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { MessageText, Clock, TickSquare, ShieldCross } from "iconsax-react";
import { MOCK_TICKETS } from "./mock-data";
import type { SupportTicket, TicketStatus } from "./types";
import { SupportTable } from "./support-table";
import { ProviderHeader } from "@/components/provider/provider-header";
import { StatCard } from "@/components/ui/stat-card";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import {
  TableFilterApplyClear,
  TableFilterDatePanel,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPill,
  TableFilterSelectOptions,
  TableFilterTrailingIconButton,
  formatDateRangeLabel,
} from "@/components/ui/table-filter-bar";
import { useDateRangeFilter, useFilterBar, useSelectFilter } from "@/lib/filters/use-filter-bar";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";

const SUPPORT_EXPORT_COLUMNS: ExportColumn<SupportTicket>[] = [
  { header: "Ticket ID", value: (r) => r.ticketNumber },
  { header: "Customer Name", value: (r) => r.customer.name },
  { header: "Customer Email", value: (r) => r.customer.email },
  { header: "Category", value: (r) => r.category },
  { header: "Subject", value: (r) => r.subject },
  { header: "Priority", value: (r) => r.priority },
  { header: "Status", value: (r) => r.status },
  { header: "Last Updated", value: (r) => r.updatedAt },
];

const TABS = [
  { id: "all", label: "All Tickets" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "resolved", label: "Resolved" },
];

const FILTER_PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export function SupportView() {
  const [tickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const {
    filterMode,
    openFilter,
    setOpenFilter,
    toggleFilter,
    openFilterBar,
    closeFilterBar,
    filterBarRef,
    filterScrollRef,
    dropdownLeft,
    registerPillRef,
    syncDropdownLeft,
  } = useFilterBar<"priority" | "date">();

  const priorityFilter = useSelectFilter<string>("");
  const {
    draft: draftPriorityValue,
    setDraft: setDraftPriorityValue,
    applied: appliedPriority,
    applyDraft: applyPriorityDraft,
    clear: clearPriorityFilter,
  } = priorityFilter;

  const dateFilter = useDateRangeFilter();
  const {
    draft: draftDate,
    setDraft: setDraftDate,
    applyDraft: applyDateDraft,
    clear: clearDateFilter,
  } = dateFilter;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Tab status filter
      if (activeTab !== "all" && t.status.toLowerCase() !== activeTab.toLowerCase()) {
        return false;
      }
      // Priority filter
      if (appliedPriority && t.priority.toLowerCase() !== appliedPriority.toLowerCase()) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchSubject = t.subject.toLowerCase().includes(q);
        const matchNumber = t.ticketNumber.toLowerCase().includes(q);
        const matchName = t.customer.name.toLowerCase().includes(q);
        const matchEmail = t.customer.email.toLowerCase().includes(q);
        return matchSubject || matchNumber || matchName || matchEmail;
      }
      return true;
    });
  }, [tickets, activeTab, appliedPriority, search]);

  const totalItems = filteredTickets.length;
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  // Metrics summary counts
  const totalOpen = tickets.filter((t) => t.status === "open").length;
  const totalPending = tickets.filter((t) => t.status === "pending").length;
  const totalResolved = tickets.filter((t) => t.status === "resolved").length;
  const totalUrgent = tickets.filter((t) => t.priority === "urgent").length;

  const handleExportCsv = () => {
    exportClientTable("support-tickets", "csv", filteredTickets, SUPPORT_EXPORT_COLUMNS);
  };

  const handleExportPdf = () => {
    exportClientTable("support-tickets", "pdf", filteredTickets, SUPPORT_EXPORT_COLUMNS);
  };

  const handleExportJson = () => {
    exportClientTable("support-tickets", "json", filteredTickets, SUPPORT_EXPORT_COLUMNS);
  };

  const draftPriorityLabel =
    FILTER_PRIORITY_OPTIONS.find((o) => o.value === (draftPriorityValue ?? ""))?.label ?? "All priorities";

  return (
    <div className="flex flex-col gap-4">
      {/* Standard Header across all admin pages */}
      <ProviderHeader title="Support Desk" />

      {/* Standard Stat Cards Row */}
      <div className="mt-6 flex flex-wrap gap-4">
        <StatCard
          label="Open Tickets"
          value={String(totalOpen)}
          accentColor="#013220"
          icon={<MessageText size="20" variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Pending Tickets"
          value={String(totalPending)}
          accentColor="#F57C00"
          icon={<Clock size="20" variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Urgent Tickets"
          value={String(totalUrgent)}
          accentColor="#EF4444"
          icon={<ShieldCross size="20" variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Resolved Tickets"
          value={String(totalResolved)}
          accentColor="#7890B5"
          icon={<TickSquare size="20" variant="Outline" color="#0B294F" />}
        />
      </div>

      {/* Tabs */}
      <div className="mt-2">
        <UnderlineTabs
          tabs={TABS}
          active={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId);
            setPage(1);
          }}
        />
      </div>

      {/* Standard Toolbar */}
      <AuditTrailToolbar
        className="mt-2"
        tableSearch={search}
        onTableSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onFilterClick={() => {
          if (filterMode) closeFilterBar();
          else openFilterBar();
        }}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
      />

      {/* Filter Mode Bar */}
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
                label="Priority"
                summary={draftPriorityLabel}
                pillRef={registerPillRef("priority")}
                onClick={() => toggleFilter("priority")}
              />
              <TableFilterPill
                label="Date Range"
                summary={formatDateRangeLabel(draftDate, "All time")}
                pillRef={registerPillRef("date")}
                onClick={() => toggleFilter("date")}
              />
            </>
          }
          pillsTrailing={
            <TableFilterTrailingIconButton
              ariaLabel="Calendar"
              onClick={() => toggleFilter("date")}
            >
              <CalendarDays size={14} />
            </TableFilterTrailingIconButton>
          }
          dropdownLayer={
            <>
              {openFilter === "priority" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                  <TableFilterSelectOptions
                    options={FILTER_PRIORITY_OPTIONS}
                    selectedValue={draftPriorityValue ?? ""}
                    onSelect={(value) => {
                      setDraftPriorityValue(value);
                      priorityFilter.setApplied(value === "" ? null : value);
                      setOpenFilter(null);
                      setPage(1);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "date" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-auto">
                  <TableFilterDatePanel value={draftDate} onChange={setDraftDate} />
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                applyPriorityDraft();
                applyDateDraft();
                setOpenFilter(null);
                closeFilterBar();
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                clearPriorityFilter();
                clearDateFilter();
                setOpenFilter(null);
                closeFilterBar();
                setPage(1);
              }}
            />
          }
        />
      ) : null}

      {/* Support Table */}
      <SupportTable tickets={paginatedTickets} />

      {/* Pagination */}
      {totalItems > 0 ? (
        <AuditTrailPagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      ) : null}
    </div>
  );
}
