"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { ProviderHeader } from "@/components/provider/provider-header";
import { SuccessModal } from "@/components/provider/provider-modals";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  useTableFilterBarAnchor,
  TableFilterCalendar,
  formatDateRangeLabel,
} from "@/components/ui/table-filter-bar";
import type { DateRange } from "react-day-picker";
import { ConfigureEarningsModal } from "@/components/user-mgt/referral-config-modal";
import { AdminApiError } from "@/lib/admin-api/client";
import { getAdminReferralsList } from "@/lib/admin-api/referrals-api";
import type { AdminReferralListRow } from "@/lib/admin-api/types";
import { getAccessToken } from "@/lib/auth/token-storage";
import { isLikelySuperAdminFromToken } from "@/lib/auth/jwt";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import { ErrorAlert } from "@/components/ui/error-alert";

const REFERRAL_EXPORT_COLUMNS: ExportColumn<AdminReferralListRow>[] = [
  { header: "Account ID", value: (r) => r.accountId },
  { header: "Name", value: (r) => r.name },
  { header: "Email", value: (r) => r.email },
  { header: "Phone", value: (r) => r.phone },
  { header: "Referral Code", value: (r) => r.referralCode },
  { header: "Referrals Made", value: (r) => String(r.referralMade) },
  { header: "Total Rewards", value: (r) => r.totalRewardsEarned },
];

const REFERRAL_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "qualified", label: "Qualified" },
  { value: "pending", label: "Pending" },
] as const;

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-profile-picture text-xs font-semibold text-blue-grey">
      {initials || "?"}
    </span>
  );
}

function matchesClientFilters(
  row: AdminReferralListRow,
  made: string | null,
  rewards: string | null,
): boolean {
  if (made && made !== "All" && String(row.referralMade) !== made) return false;
  if (rewards && rewards !== "All" && row.totalRewardsEarned !== rewards) return false;
  return true;
}

export function ReferralView() {
  const canConfigureEarnings = isLikelySuperAdminFromToken(getAccessToken());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "made" | "rewards" | "period" | "status">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"made" | "rewards" | "period" | "status">(openFilter, filterMode);

  const [draftMade, setDraftMade] = useState("All");
  const [draftRewards, setDraftRewards] = useState("All");
  const [draftPeriod, setDraftPeriod] = useState<DateRange | undefined>(undefined);
  const [draftStatus, setDraftStatus] = useState("");
  const [appliedMade, setAppliedMade] = useState<string | null>(null);
  const [appliedRewards, setAppliedRewards] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<"" | "qualified" | "pending" | null>(null);
  const [appliedPeriod, setAppliedPeriod] = useState<DateRange | undefined>(undefined);

  const [listRows, setListRows] = useState<AdminReferralListRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConfigSuccess, setShowConfigSuccess] = useState(false);

  const clientFiltersActive = Boolean(
    (appliedMade && appliedMade !== "All") || (appliedRewards && appliedRewards !== "All") || debouncedSearch,
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 320);
    return () => window.clearTimeout(t);
  }, [search]);

  const toggleFilterMode = (active: boolean) => {
    setFilterMode(active);
    if (!active) setOpenFilter(null);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const res = await getAdminReferralsList({
        page: clientFiltersActive ? 1 : page,
        pageSize: clientFiltersActive ? 200 : pageSize,
        search: undefined,
        status: appliedStatus ?? undefined,
        fromDate: appliedPeriod?.from ? appliedPeriod.from.toISOString() : undefined,
        toDate: appliedPeriod?.to ? appliedPeriod.to.toISOString() : undefined,
      });
      setListRows(res.items);
      setListTotal(res.total);
    } catch (e) {
      setListRows([]);
      setListTotal(0);
      setListError(e instanceof AdminApiError ? e.message : "Could not load referrals.");
    } finally {
      setListLoading(false);
    }
  }, [appliedStatus, clientFiltersActive, page, pageSize, appliedPeriod]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) void loadList();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadList]);

  const rewardOptions = useMemo(() => {
    const fromApi = Array.from(new Set(listRows.map((r) => r.totalRewardsEarned))).filter((v) => v !== "—");
    return ["All", ...fromApi];
  }, [listRows]);

  const madeOptions = useMemo(() => {
    const counts = Array.from(new Set(listRows.map((r) => String(r.referralMade))));
    return ["All", ...counts.sort((a, b) => Number(a) - Number(b))];
  }, [listRows]);

  const displayedRows = useMemo(() => {
    let rows = listRows;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.referralCode.toLowerCase().includes(q) ||
          r.accountId.toLowerCase().includes(q),
      );
    }
    return rows.filter((r) => matchesClientFilters(r, appliedMade, appliedRewards));
  }, [listRows, debouncedSearch, appliedMade, appliedRewards]);

  const paginationTotal = clientFiltersActive ? displayedRows.length : listTotal;
  const paginatedRows = useMemo(() => {
    if (!clientFiltersActive) return displayedRows;
    const start = (page - 1) * pageSize;
    return displayedRows.slice(start, start + pageSize);
  }, [clientFiltersActive, displayedRows, page, pageSize]);

  const safePage = clientFiltersActive
    ? Math.min(page, Math.max(1, Math.ceil(Math.max(paginationTotal, 1) / pageSize)))
    : page;

  const draftStatusLabel =
    REFERRAL_STATUS_OPTIONS.find((o) => o.value === draftStatus)?.label ?? "All statuses";

  const runExport = async (format: "csv" | "json" | "pdf") => {
    let rows = displayedRows;
    if (!clientFiltersActive) {
      const res = await getAdminReferralsList({
        page: 1,
        pageSize: 200,
        search: undefined,
        status: appliedStatus ?? undefined,
        fromDate: appliedPeriod?.from ? appliedPeriod.from.toISOString() : undefined,
        toDate: appliedPeriod?.to ? appliedPeriod.to.toISOString() : undefined,
      });
      rows = res.items.filter((r) => matchesClientFilters(r, appliedMade, appliedRewards));
    }
    exportClientTable("referrals", format, rows, REFERRAL_EXPORT_COLUMNS);
  };

  return (
    <div>
      <ProviderHeader title="Referrals" />

      {clientFiltersActive ? (
        <p className="mt-3 text-xs text-zinc-500">
          Referrals made / rewards / search filters apply to up to 200 loaded rows. Status uses the API query param.
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
                label="Status"
                summary={draftStatusLabel}
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
                label="Referrals made"
                summary={draftMade}
                pillRef={registerPillRef("made")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "made" ? null : "made";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Total rewards"
                summary={draftRewards}
                pillRef={registerPillRef("rewards")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "rewards" ? null : "rewards";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Period"
                summary={formatDateRangeLabel(draftPeriod, "All time")}
                pillRef={registerPillRef("period")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "period" ? null : "period";
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
                  const next = v === "period" ? null : "period";
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
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[180px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={REFERRAL_STATUS_OPTIONS.map((o) => o.label)}
                    onSelect={(label) => {
                      const opt = REFERRAL_STATUS_OPTIONS.find((o) => o.label === label);
                      setDraftStatus(opt?.value ?? "");
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "made" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[160px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={madeOptions.length > 1 ? madeOptions : ["All", "40", "50"]}
                    onSelect={(opt) => {
                      setDraftMade(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "rewards" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={rewardOptions}
                    onSelect={(opt) => {
                      setDraftRewards(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "period" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-auto">
                  <TableFilterPanelTitle />
                  <TableFilterCalendar value={draftPeriod} onChange={setDraftPeriod} />
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedMade(draftMade === "All" ? null : draftMade);
                setAppliedRewards(draftRewards === "All" ? null : draftRewards);
                setAppliedStatus(
                  draftStatus === "" ? null : (draftStatus as "qualified" | "pending"),
                );
                setAppliedPeriod(draftPeriod);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedMade(null);
                setAppliedRewards(null);
                setAppliedStatus(null);
                setAppliedPeriod(undefined);
                setDraftMade("All");
                setDraftRewards("All");
                setDraftStatus("");
                setDraftPeriod(undefined);
                setOpenFilter(null);
                toggleFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
          <span className="shrink-0 text-[15px] font-semibold text-primary-text">Referral List</span>
          <div className="ml-4 w-[280px] shrink-0">
            <AuditTrailIconSearch
              variant="toolbar"
              placeholder="Search by Name or Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
              aria-label="Filter"
              onClick={() => toggleFilterMode(true)}
            >
              <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
            </button>
            <TableExportMenu
              disabled={listLoading || displayedRows.length === 0}
              onExportCsv={() => runExport("csv")}
              onExportPdf={() => runExport("pdf")}
              onExportJson={() => runExport("json")}
            />
            {canConfigureEarnings ? (
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Configure Earning
              </button>
            ) : null}
          </div>
        </div>
      )}

      <ErrorAlert error={listError} onRetry={() => void loadList()} />

      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Customer Name</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Phone Number</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Referral Code</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Referral Made</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Total Rewards Earned</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Loading referrals…
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No referrals found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr key={row.accountId} className="transition-colors hover:bg-zinc-50">
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                    <Link
                      href={`/dashboard/user-mgt/referral/${encodeURIComponent(row.accountId)}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={row.name} />
                      <span className="text-sm font-medium text-primary-text">{row.name}</span>
                    </Link>
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle text-zinc-500">{row.email}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle text-zinc-500">{row.phone}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle text-zinc-500">{row.referralCode}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-center align-middle text-zinc-500">
                    {row.referralMade}
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle text-zinc-500">
                    {row.totalRewardsEarned}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={paginationTotal}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {showConfigModal ? (
        <ConfigureEarningsModal
          onClose={() => setShowConfigModal(false)}
          onSave={() => {
            setShowConfigModal(false);
            setShowConfigSuccess(true);
          }}
        />
      ) : null}

      {showConfigSuccess ? (
        <SuccessModal
          message="Earning configuration has been saved successfully"
          confirmLabel="Done"
          onContinue={() => setShowConfigSuccess(false)}
        />
      ) : null}
    </div>
  );
}
