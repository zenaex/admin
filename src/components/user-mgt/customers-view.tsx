"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Profile2User, UserAdd } from "iconsax-react";
import { CalendarDays } from "lucide-react";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { ProviderHeader } from "@/components/provider/provider-header";
import { StatCard } from "@/components/ui/stat-card";
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
import { getAdminCustomersList, getAdminCustomersSummary } from "@/lib/admin-api/customers-api";
import { AdminApiError } from "@/lib/admin-api/client";
import type { AdminCustomerListQuery, AdminCustomerListRow, AdminCustomersSummary } from "@/lib/admin-api/types";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { ErrorAlert } from "@/components/ui/error-alert";

const CUSTOMER_EXPORT_COLUMNS: ExportColumn<AdminCustomerListRow>[] = [
  { header: "Account ID", value: (r) => r.accountId },
  { header: "Name", value: (r) => r.name },
  { header: "Username", value: (r) => r.username },
  { header: "Email", value: (r) => r.email },
  { header: "Phone", value: (r) => r.phone },
  { header: "Status", value: (r) => r.statusLabel },
  { header: "Date Onboarded", value: (r) => r.dateOnboarded },
];

/* ── Tab config ──
 * Active / Blocked map to OpenAPI `accountStatus`.
 * PND / Lien: no matching query param — client-side filter on row.raw flags when present (see `rowMatchesTab`).
 */
type CustomerTab = "All" | "Active" | "Blocked" | "PND" | "Lien";
const TABS: CustomerTab[] = ["All", "Active", "Blocked", "PND", "Lien"];

const FILTER_ACCOUNT_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "blocked", label: "Blocked" },
] as const;

function truthy(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function rowMatchesTab(row: AdminCustomerListRow, tab: CustomerTab): boolean {
  if (tab === "All") return true;
  if (tab === "Active") {
    const s = String(row.raw.accountStatus ?? row.raw.status ?? "").toLowerCase();
    return s === "active";
  }
  if (tab === "Blocked") {
    const s = String(row.raw.accountStatus ?? row.raw.status ?? "").toLowerCase();
    return s === "blocked";
  }
  if (tab === "PND") {
    const r = row.raw;
    if (truthy(r.isPnd) || truthy(r.pnd) || truthy(r.hasPnd)) return true;
    const s = JSON.stringify(r).toLowerCase();
    return s.includes("pnd") && (s.includes("true") || s.includes(":1"));
  }
  if (tab === "Lien") {
    const r = row.raw;
    if (truthy(r.lien) || truthy(r.hasLien) || truthy(r.isLien)) return true;
    const s = JSON.stringify(r).toLowerCase();
    return s.includes("lien") && (s.includes("true") || s.includes(":1"));
  }
  return true;
}

/** Map top tabs to server query (except PND/Lien — handled client-side). */
function tabToServerQuery(tab: CustomerTab): Pick<AdminCustomerListQuery, "accountStatus" | "activityStatus"> {
  if (tab === "Active") return { accountStatus: "active" };
  if (tab === "Blocked") return { accountStatus: "blocked" };
  return {};
}

function formatCount(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

/* ── Avatar initials ── */
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

/* ── Status badge (free text from API) ── */
function StatusBadge({ label }: { label: string }) {
  const key = label.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-600";
  if (key.includes("active") && !key.includes("in")) cls = "bg-green-50 text-green-600";
  else if (key.includes("inactive") || key.includes("deactivated")) cls = "bg-zinc-100 text-zinc-500";
  else if (key.includes("block") || key.includes("pnd") || key.includes("lien") || key.includes("suspend"))
    cls = "bg-red-50 text-red-500";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function CustomersView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CustomerTab>("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "status" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"status" | "date">(openFilter, filterMode);

  const [draftStatusValue, setDraftStatusValue] = useState<string>(FILTER_ACCOUNT_STATUSES[0].value);
  const [draftDate, setDraftDate] = useState<DateRange | undefined>(undefined);
  const [appliedAccountStatus, setAppliedAccountStatus] = useState<string | null>(null);
  const [appliedDate, setAppliedDate] = useState<DateRange | undefined>(undefined);

  const [summary, setSummary] = useState<AdminCustomersSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [listRows, setListRows] = useState<AdminCustomerListRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const clientTab = activeTab === "PND" || activeTab === "Lien";
  const effectivePage = clientTab ? 1 : page;
  const effectivePageSize = clientTab ? 100 : pageSize;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => window.clearTimeout(t);
  }, [search]);

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

  const loadSummary = useCallback(async () => {
    setSummaryError(null);
    try {
      const s = await getAdminCustomersSummary({
        fromDate: appliedDate?.from ? appliedDate.from.toISOString() : undefined,
        toDate: appliedDate?.to ? appliedDate.to.toISOString() : undefined,
      });
      setSummary(s);
    } catch (e) {
      setSummary(null);
      setSummaryError(e instanceof AdminApiError ? e.message : "Could not load summary.");
    }
  }, [appliedDate]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const tabQ = tabToServerQuery(activeTab);
      const pillStatus =
        appliedAccountStatus && appliedAccountStatus !== ""
          ? (appliedAccountStatus as NonNullable<AdminCustomerListQuery["accountStatus"]>)
          : tabQ.accountStatus;
      const q: AdminCustomerListQuery = {
        page: effectivePage,
        pageSize: effectivePageSize,
        search: debouncedSearch || undefined,
        sortBy: "created_at",
        sortOrder: "desc",
        ...tabQ,
        accountStatus: pillStatus,
        fromDate: appliedDate?.from ? appliedDate.from.toISOString() : undefined,
        toDate: appliedDate?.to ? appliedDate.to.toISOString() : undefined,
      };
      const res = await getAdminCustomersList(q);
      setListRows(res.items);
      setListTotal(res.total);
    } catch (e) {
      setListRows([]);
      setListTotal(0);
      setListError(e instanceof AdminApiError ? e.message : "Could not load customers.");
    } finally {
      setListLoading(false);
    }
  }, [activeTab, appliedAccountStatus, debouncedSearch, effectivePage, effectivePageSize, appliedDate]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const displayedRows = useMemo(() => {
    if (!clientTab) return listRows;
    return listRows.filter((r) => rowMatchesTab(r, activeTab));
  }, [listRows, activeTab, clientTab]);

  const paginationTotal = clientTab ? displayedRows.length : listTotal;
  const safePage = clientTab ? 1 : Math.min(page, Math.max(1, Math.ceil(Math.max(paginationTotal, 1) / pageSize)));
  const paginatedRows = useMemo(() => {
    if (clientTab) return displayedRows;
    return listRows;
  }, [clientTab, displayedRows, listRows]);

  useEffect(() => {
    if (clientTab) setPage(1);
  }, [activeTab, clientTab]);

  const draftStatusLabel =
    FILTER_ACCOUNT_STATUSES.find((o) => o.value === draftStatusValue)?.label ?? "All statuses";

  const runExport = async (format: "csv" | "json" | "pdf") => {
    let rows = displayedRows;
    if (!clientTab) {
      const tabQ = tabToServerQuery(activeTab);
      const pillStatus =
        appliedAccountStatus && appliedAccountStatus !== ""
          ? (appliedAccountStatus as NonNullable<AdminCustomerListQuery["accountStatus"]>)
          : tabQ.accountStatus;
      const res = await getAdminCustomersList({
        page: 1,
        pageSize: 100,
        search: debouncedSearch || undefined,
        sortBy: "created_at",
        sortOrder: "desc",
        ...tabQ,
        accountStatus: pillStatus,
        fromDate: appliedDate?.from ? appliedDate.from.toISOString() : undefined,
        toDate: appliedDate?.to ? appliedDate.to.toISOString() : undefined,
      });
      rows = res.items;
    }
    exportClientTable("customers", format, rows, CUSTOMER_EXPORT_COLUMNS);
  };

  const exportProps = {
    exportDisabled: listLoading,
    onExportCsv: () => runExport("csv"),
    onExportPdf: () => runExport("pdf"),
    onExportJson: () => runExport("json"),
  };

  return (
    <div>
      <ProviderHeader title="Customers" />

      {summaryError ? (
        <p className="mt-4 text-sm text-amber-800" role="status">
          {summaryError}
        </p>
      ) : null}

      <div className="mt-6 flex min-w-0 gap-3">
        <StatCard
          label="Total Customers"
          value={formatCount(summary?.totalUsers)}
          accentColor="#BCEB0F"
          icon={<Profile2User size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Active Customers"
          value={formatCount(summary?.activeUsers)}
          accentColor="#3B82F6"
          icon={<img src="/metrics/green.svg" alt="Active customers" className="h-5 w-5 object-contain" width={20} height={20} />}
        />
        <StatCard
          label="Inactive Customers"
          value={formatCount(summary?.inactiveUsers)}
          accentColor="#EF4444"
          icon={<img src="/metrics/red.svg" alt="Inactive customers" className="h-5 w-5 object-contain" width={20} height={20} />}
        />
        <StatCard
          label="New Sign ups"
          value={formatCount(summary?.newSignupsThisMonth)}
          accentColor="#013220"
          icon={<UserAdd size={20} variant="Outline" color="#0B294F" />}
        />
      </div>

      <div className="mt-6">
        <UnderlineTabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => {
            setActiveTab(id as CustomerTab);
            setPage(1);
          }}
        />
      </div>

      {clientTab ? (
        <p className="mt-3 text-xs text-zinc-500">
          PND and Lien tabs filter up to {effectivePageSize} loaded rows using account flags when the API includes them.
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
                label="Date onboarded"
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
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[220px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={FILTER_ACCOUNT_STATUSES.map((o) => o.label)}
                    onSelect={(label) => {
                      const opt = FILTER_ACCOUNT_STATUSES.find((o) => o.label === label);
                      setDraftStatusValue(opt?.value ?? "");
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
                setAppliedAccountStatus(draftStatusValue === "" ? null : draftStatusValue);
                setAppliedDate(draftDate);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedAccountStatus(null);
                setAppliedDate(undefined);
                setDraftStatusValue(FILTER_ACCOUNT_STATUSES[0].value);
                setDraftDate(undefined);
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <AuditTrailToolbar
          tableSearch={search}
          onTableSearchChange={setSearch}
          onFilterClick={() => {
            setFilterMode(true);
          }}
          {...exportProps}
        />
      )}

      <ErrorAlert error={listError} onRetry={() => void loadList()} />

      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-xs text-zinc-400">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Customer Name</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email Address</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Phone Number</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Onboarded</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  Loading customers…
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.accountId}
                  onClick={() => router.push(`/dashboard/user-mgt/customers/${encodeURIComponent(row.accountId)}`)}
                  className="cursor-pointer transition-colors hover:bg-zinc-50"
                >
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-primary-text">{row.name}</span>
                        <span className="text-xs text-zinc-400">{row.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.phone}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                    <StatusBadge label={row.statusLabel} />
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">
                    {row.dateOnboarded}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!clientTab ? (
        <AuditTrailPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={paginationTotal}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      ) : null}
    </div>
  );
}
