"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown2,
  ArrowLeft2,
  ArrowRight2,
  People,
  UserTick,
  UserRemove,
  WalletMoney,
} from "iconsax-react";
import { CalendarDays, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
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
import { AdminApiError } from "@/lib/admin-api/client";
import { getAdminReferralDetail } from "@/lib/admin-api/referrals-api";
import type { AdminReferredUserRow } from "@/lib/admin-api/types";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import { ErrorAlert } from "@/components/ui/error-alert";

const REFERRED_EXPORT_COLUMNS: ExportColumn<AdminReferredUserRow>[] = [
  { header: "Name", value: (r) => r.name },
  { header: "Email", value: (r) => r.email },
  { header: "Phone", value: (r) => r.phone },
  { header: "Date", value: (r) => r.date },
  { header: "Status", value: (r) => r.status },
];

function StatCard({
  label,
  value,
  accentColor,
  icon,
}: {
  label: string;
  value: string;
  accentColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col justify-between gap-[13px] overflow-hidden rounded-xl border border-outline bg-white px-5 py-4">
      <div className="absolute bottom-0 left-0 top-0 w-[4px] rounded-r-full" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <span className="text-[13px] text-zinc-400">{label}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-outline text-zinc-400">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold text-primary-text">{value}</p>
    </div>
  );
}

function ReferredStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  let cls = "text-zinc-600";
  if (key.includes("pending") || key.includes("invite")) cls = "text-orange-500";
  else if (key.includes("onboard")) cls = "text-vivid-azure";
  else if (key.includes("reward") && key.includes("earn")) cls = "text-brand-purple";
  else if (key.includes("success") || key.includes("qualified")) cls = "text-green-600";
  return <span className={`text-xs font-semibold ${cls}`}>{status}</span>;
}

function matchesStatus(row: AdminReferredUserRow, applied: string | null): boolean {
  if (!applied || applied === "All statuses") return true;
  return row.status.toLowerCase() === applied.toLowerCase();
}

export type ReferralDetailsViewProps = {
  id: string;
};

export function ReferralDetailsView({ id: accountId }: ReferralDetailsViewProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "status" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"status" | "date">(openFilter, filterMode);

  const [draftStatus, setDraftStatus] = useState("All statuses");
  const [draftDate, setDraftDate] = useState<DateRange | undefined>(undefined);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);
  const [appliedDate, setAppliedDate] = useState<DateRange | undefined>(undefined);

  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getAdminReferralDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

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

  const loadDetail = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const d = await getAdminReferralDetail(accountId, { page, pageSize });
      setDetail(d);
    } catch (e) {
      setDetail(null);
      setError(e instanceof AdminApiError ? e.message : "Could not load referral details.");
    } finally {
      setLoading(false);
    }
  }, [accountId, page, pageSize]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) void loadDetail();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadDetail]);

  const statusOptions = useMemo(() => {
    const fromApi = Array.from(new Set((detail?.referred ?? []).map((r) => r.status)));
    return ["All statuses", ...fromApi];
  }, [detail?.referred]);

  const filteredReferred = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return (detail?.referred ?? []).filter((r) => {
      if (!matchesStatus(r, appliedStatus)) return false;
      if (appliedDate?.from) {
        const rawDateStr =
          r.raw?.referredAt ??
          r.raw?.referred_at ??
          r.raw?.qualifiedAt ??
          r.raw?.qualified_at ??
          r.raw?.createdAt ??
          r.raw?.created_at ??
          r.raw?.date ??
          r.raw?.onboardedAt;
        const itemDate = rawDateStr ? new Date(rawDateStr as string) : null;
        if (itemDate && !Number.isNaN(itemDate.getTime())) {
          const start = new Date(appliedDate.from);
          start.setHours(0, 0, 0, 0);
          const end = appliedDate.to ? new Date(appliedDate.to) : new Date(appliedDate.from);
          end.setHours(23, 59, 59, 999);
          if (itemDate < start || itemDate > end) return false;
        }
      }
      if (
        q &&
        !(
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [detail?.referred, appliedStatus, debouncedSearch, appliedDate]);

  const clientSearchActive = Boolean(debouncedSearch || appliedStatus || appliedDate);
  const paginationTotal = clientSearchActive ? filteredReferred.length : (detail?.referredTotal ?? 0);
  const paginatedRows = clientSearchActive
    ? filteredReferred.slice((page - 1) * pageSize, page * pageSize)
    : filteredReferred;

  const safePage = clientSearchActive
    ? Math.min(page, Math.max(1, Math.ceil(Math.max(paginationTotal, 1) / pageSize)))
    : page;



  const runExport = async (format: "csv" | "json" | "pdf") => {
    let rows = filteredReferred;
    if (!clientSearchActive) {
      const d = await getAdminReferralDetail(accountId, { page: 1, pageSize: 100 });
      rows = d.referred;
    }
    exportClientTable(`referral-${accountId}-referred`, format, rows, REFERRED_EXPORT_COLUMNS);
  };

  if (loading && !detail) {
    return <p className="text-sm text-zinc-500">Loading referral details…</p>;
  }

  if (error && !detail) {
    return (
      <ErrorAlert error={error} onRetry={() => void loadDetail()}>
        {" "}
        <Link href="/dashboard/user-mgt/referral" className="font-semibold underline">
          Back to list
        </Link>
      </ErrorAlert>
    );
  }

  const referrer = detail?.referrer;
  const stats = detail?.stats;

  return (
    <div>
      <div className="mb-6 flex h-[66px] items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link
            href="/dashboard/user-mgt/referral"
            className="inline-flex items-center gap-1 text-primary-text hover:underline"
          >
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Referrals
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Referral Details</span>
        </div>

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text hover:bg-surface-subtle transition-colors"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      <div className="flex gap-3">
        <StatCard
          label="Total Referrals Made"
          value={stats?.totalReferralsMade ?? "0"}
          accentColor="#BCEB0F"
          icon={<People size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Onboarded Referred Users"
          value={stats?.onboardedReferredUsers ?? "0"}
          accentColor="#3B82F6"
          icon={<UserTick size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Pending Referred Users"
          value={stats?.pendingReferredUsers ?? "0"}
          accentColor="#EF4444"
          icon={<UserRemove size={20} variant="Outline" color="currentColor" />}
        />
        <StatCard
          label="Total Rewards Earned"
          value={stats?.totalRewardsEarned ?? "0.00"}
          accentColor="#013220"
          icon={<WalletMoney size={20} variant="Outline" color="currentColor" />}
        />
      </div>

      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-primary-text">Customer Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Customer Name</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Username</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Email Address</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Phone Number</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-r border-outline px-4 py-5 font-medium text-primary-text">
                  {referrer?.name ?? "—"}
                </td>
                <td className="border-r border-outline px-4 py-5 text-zinc-500">{referrer?.username ?? "—"}</td>
                <td className="border-r border-outline px-4 py-5 text-zinc-500">{referrer?.email ?? "—"}</td>
                <td className="px-4 py-5 text-zinc-500">{referrer?.phone ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        {clientSearchActive ? (
          <p className="mb-3 text-xs text-zinc-500">Search and status filter apply to the current page of referred users.</p>
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
                  label="Date"
                  summary={formatDateRangeLabel(draftDate, "All time")}
                  pillRef={registerPillRef("date")}
                  onClick={() =>
                    setOpenFilter((v) => {
                      const next = v === "date" ? null : "date";
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
                    const next = v === "date" ? null : "date";
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
                  <TableFilterDropdownCard left={dropdownLeft} widthClass="min-w-[220px] max-w-[min(92vw,320px)]">
                    <TableFilterPanelTitle />
                    <TableFilterOptionsList
                      options={statusOptions}
                      onSelect={(opt) => {
                        setDraftStatus(opt);
                        setOpenFilter(null);
                      }}
                    />
                  </TableFilterDropdownCard>
                ) : null}
                {openFilter === "date" ? (
                  <TableFilterDropdownCard left={dropdownLeft} widthClass="w-auto">
                    <TableFilterPanelTitle />
                    <TableFilterCalendar value={draftDate} onChange={setDraftDate} />
                  </TableFilterDropdownCard>
                ) : null}
              </>
            }
            actions={
              <TableFilterApplyClear
                onApply={() => {
                  setAppliedStatus(draftStatus === "All statuses" ? null : draftStatus);
                  setAppliedDate(draftDate);
                  setOpenFilter(null);
                  setPage(1);
                }}
                onClear={() => {
                  setSearch("");
                  setAppliedStatus(null);
                  setAppliedDate(undefined);
                  setDraftStatus("All statuses");
                  setDraftDate(undefined);
                  setOpenFilter(null);
                  toggleFilterMode(false);
                  setPage(1);
                }}
              />
            }
          />
        ) : (
          <div className="flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
            <span className="shrink-0 text-[15px] font-semibold text-primary-text">Referred Users</span>
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
                disabled={loading || filteredReferred.length === 0}
                onExportCsv={() => runExport("csv")}
                onExportPdf={() => runExport("pdf")}
                onExportJson={() => runExport("json")}
              />
            </div>
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-[8px]">
          <table className="w-full border-collapse bg-white text-left text-sm">
            <thead>
              <tr className="bg-outline text-xs text-zinc-400">
                <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Name</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Email</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Phone Number</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Date</th>
                <th className="h-11 border-b border-zinc-200 px-4 py-0 align-middle font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                    Loading referred users…
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                    No referred users found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle text-sm font-medium text-primary-text">
                      {row.name}
                    </td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle text-zinc-500">{row.email}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle text-zinc-500">{row.phone}</td>
                    <td className="h-16 whitespace-nowrap border-b border-zinc-100 px-4 py-0 align-middle text-zinc-500">
                      {row.date}
                    </td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                      <ReferredStatusBadge status={row.status} />
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
      </section>
    </div>
  );
}
