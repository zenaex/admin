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
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";

const STATUS_OPTIONS = ["All statuses", "Publish", "Unpublished", "Pending"] as const;

export function CommunicationView() {
  const router = useRouter();
  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  }, [appliedStatus, debouncedSearch]);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCampaigns({
        status: appliedStatus ?? undefined,
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
      });
      setCampaigns(res.items);
      setTotalItems(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [appliedStatus, page, pageSize, debouncedSearch]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

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

  const runExport = (format: "csv" | "json" | "pdf") => {
    exportClientTable("communications", format, campaigns, COMMUNICATION_EXPORT_COLUMNS);
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
    exportDisabled: campaigns.length === 0,
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
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-green border-t-transparent" />
        </div>
      ) : (
        <CommunicationTable
          rows={campaigns}
          actionLoading={actionLoading}
          onAction={handleTableAction}
        />
      )}
      <CommunicationPagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
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
