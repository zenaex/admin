"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

import { CommunicationHeader } from "@/components/communication/communication-header";
import { CommunicationPagination } from "@/components/communication/communication-pagination";
import {
  CommunicationTable,
  type CommunicationListAction,
} from "@/components/communication/communication-table";
import { CommunicationToolbar } from "@/components/communication/communication-toolbar";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import {
  cancelAdminCampaign,
  campaignApiErrorMessage,
  deleteAdminCampaign,
  getAdminCampaigns,
  publishAdminCampaign,
} from "@/lib/admin-api/communications-api";
import { ErrorAlert } from "@/components/ui/error-alert";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import type { AdminCampaign } from "@/lib/admin-api/types";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";

const COMMUNICATION_EXPORT_COLUMNS: ExportColumn<AdminCampaign>[] = [
  { header: "Campaign", value: (r) => r.campaign },
  { header: "Start Date", value: (r) => r.startDate },
  { header: "End Date", value: (r) => r.endDate },
  { header: "Last Modified", value: (r) => r.lastModified },
  { header: "Status", value: (r) => r.status },
];
import {
  TableFilterApplyClear,
  TableFilterDatePanel,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  formatDateRangeLabel,
} from "@/components/ui/table-filter-bar";
import { matchesDateRangeFilter } from "@/lib/filters/date-range";
import { useDateRangeFilter, useFilterBar } from "@/lib/filters/use-filter-bar";

const STATUS_OPTIONS = ["All statuses", "Publish", "Unpublished", "Pending"] as const;

export function CommunicationView() {
  const router = useRouter();
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  } = useFilterBar<"status" | "start">();

  const [draftStatus, setDraftStatus] = useState<string>("All statuses");
  const dateFilter = useDateRangeFilter();
  const { draft: draftStartDate, setDraft: setDraftStartDate, applied: appliedStartDate, applyDraft: applyStartDateDraft, clear: clearStartDateFilter, syncDraftFromApplied: syncStartDateDraft } = dateFilter;
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actionTarget, setActionTarget] = useState<AdminCampaign | null>(null);
  const [pendingAction, setPendingAction] = useState<CommunicationListAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(tableSearch), 400);
    return () => clearTimeout(t);
  }, [tableSearch]);

  useEffect(() => {
    setPage(1);
  }, [appliedStatus, appliedStartDate, debouncedSearch]);

  const dateFilterActive = Boolean(appliedStartDate?.from);

  const syncAllFilters = useCallback(() => {
    setDraftStatus(appliedStatus ?? "All statuses");
    syncStartDateDraft();
  }, [appliedStatus, syncStartDateDraft]);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCampaigns({
        status: appliedStatus ?? undefined,
        page: dateFilterActive ? 1 : page,
        limit: dateFilterActive ? 200 : pageSize,
        search: debouncedSearch || undefined,
      });
      setCampaigns(res.items);
      setTotalItems(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [appliedStatus, dateFilterActive, page, pageSize, debouncedSearch]);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => matchesDateRangeFilter(appliedStartDate, campaign.startDate)),
    [appliedStartDate, campaigns],
  );

  const displayTotal = dateFilterActive ? filteredCampaigns.length : totalItems;
  const paginatedCampaigns = useMemo(() => {
    if (!dateFilterActive) return filteredCampaigns;
    const start = (page - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [dateFilterActive, filteredCampaigns, page, pageSize]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const runExport = (format: "csv" | "json" | "pdf") => {
    exportClientTable("communications", format, filteredCampaigns, COMMUNICATION_EXPORT_COLUMNS);
  };

  const handleTableAction = (action: CommunicationListAction, row: AdminCampaign) => {
    setActionError(null);
    if (action === "view") {
      router.push(`/dashboard/communication/${row.id}`);
      return;
    }
    setActionTarget(row);
    setPendingAction(action);
  };

  const confirmModalCopy = useMemo(() => {
    if (!actionTarget || !pendingAction) return null;
    const name = actionTarget.campaign;
    if (pendingAction === "publish") {
      return {
        title: "Publish campaign",
        message: `Publish "${name}" now? It will go live immediately.`,
        confirmLabel: actionLoading ? "Publishing…" : "Publish",
        variant: "approve" as const,
      };
    }
    if (pendingAction === "delete") {
      return {
        title: "Delete draft",
        message: `Delete draft "${name}"? This cannot be undone.`,
        confirmLabel: actionLoading ? "Deleting…" : "Delete",
        variant: "danger" as const,
      };
    }
    return {
      title: "Cancel scheduled campaign",
      message: `Cancel the scheduled send for "${name}"?`,
      confirmLabel: actionLoading ? "Cancelling…" : "Cancel schedule",
      variant: "danger" as const,
    };
  }, [actionTarget, pendingAction, actionLoading]);

  const closeConfirm = () => {
    if (actionLoading) return;
    setActionTarget(null);
    setPendingAction(null);
  };

  const handleConfirmAction = async () => {
    if (!actionTarget || !pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (pendingAction === "publish") {
        await publishAdminCampaign(actionTarget.id, { scheduleMode: "Immediate" });
        setSuccessMessage(`"${actionTarget.campaign}" is now live.`);
      } else if (pendingAction === "delete") {
        await deleteAdminCampaign(actionTarget.id);
        setSuccessMessage(`"${actionTarget.campaign}" was deleted.`);
      } else {
        await cancelAdminCampaign(actionTarget.id);
        setSuccessMessage(`Scheduled send for "${actionTarget.campaign}" was cancelled.`);
      }
      closeConfirm();
      await loadCampaigns();
    } catch (e) {
      setActionError(campaignApiErrorMessage(e, "Could not complete that action."));
    } finally {
      setActionLoading(false);
    }
  };

  const exportProps = {
    exportDisabled: filteredCampaigns.length === 0,
    onExportCsv: () => runExport("csv"),
    onExportPdf: () => runExport("pdf"),
    onExportJson: () => runExport("json"),
  };

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
                summary={formatDateRangeLabel(draftStartDate, "All time")}
                pillRef={registerPillRef("start")}
                onClick={() => toggleFilter("start")}
              />
            </>
          }
          pillsTrailing={
            <TableFilterTrailingIconButton ariaLabel="Calendar" onClick={() => toggleFilter("start")}>
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
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-auto">
                  <TableFilterDatePanel value={draftStartDate} onChange={setDraftStartDate} />
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedStatus(draftStatus === "All statuses" ? null : draftStatus);
                applyStartDateDraft();
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setTableSearch("");
                setAppliedStatus(null);
                clearStartDateFilter();
                setDraftStatus("All statuses");
                setOpenFilter(null);
                closeFilterBar();
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <CommunicationToolbar
          tableSearch={tableSearch}
          onTableSearchChange={setTableSearch}
          onFilterClick={() => openFilterBar(syncAllFilters)}
          createHref="/dashboard/communication/new"
          {...exportProps}
        />
      )}
      {actionError ? (
        <ErrorAlert error={actionError} onRetry={() => setActionError(null)} className="mt-4" />
      ) : null}
      {error ? (
        <ErrorAlert error={error} onRetry={() => void loadCampaigns()} className="mt-6" />
      ) : loading ? (
        <TableSkeleton
          columns={6}
          rows={8}
          headers={["Campaign", "Start Date", "End Date", "Last Modified", "Status", "Action"]}
          headerRowClassName="bg-outline text-zinc-500"
          cellVariants={["text-wide", "text", "text", "text", "badge", "icon"]}
        />
      ) : (
        <CommunicationTable
          rows={paginatedCampaigns}
          actionLoading={actionLoading}
          onAction={handleTableAction}
        />
      )}
      <CommunicationPagination
        page={page}
        pageSize={pageSize}
        totalItems={displayTotal}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {confirmModalCopy && actionTarget ? (
        <ConfirmModal
          title={confirmModalCopy.title}
          message={confirmModalCopy.message}
          confirmLabel={confirmModalCopy.confirmLabel}
          variant={confirmModalCopy.variant}
          onConfirm={() => void handleConfirmAction()}
          onCancel={closeConfirm}
        />
      ) : null}

      {successMessage ? (
        <SuccessModal
          message={successMessage}
          confirmLabel="Done"
          onContinue={() => setSuccessMessage(null)}
        />
      ) : null}
    </div>
  );
}
