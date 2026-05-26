"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CloseCircle } from "iconsax-react";
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
} from "@/components/ui/table-filter-bar";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  createAdminReferralConfig,
  getAdminReferralConfig,
  getAdminReferralsList,
  parseAmountString,
} from "@/lib/admin-api/referrals-api";
import type { AdminReferralConfigBody, AdminReferralListRow } from "@/lib/admin-api/types";
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

function ConfigureEarningsModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [thresholdType, setThresholdType] = useState("Transaction number");
  const [transactionNumber, setTransactionNumber] = useState("20");
  const [rewardAmount, setRewardAmount] = useState("5000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cfg = await getAdminReferralConfig();
        if (cancelled) return;
        const cycle = cfg.cycleSize ?? cfg.cycle_size;
        const reward = cfg.rewardAmount ?? cfg.reward_amount;
        const minTx = cfg.minTransactionAmount ?? cfg.min_transaction_amount;
        if (cycle !== undefined) setTransactionNumber(String(cycle));
        if (reward !== undefined) setRewardAmount(String(reward));
        if (minTx !== undefined && !cycle) setTransactionNumber(String(minTx));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof AdminApiError ? e.message : "Could not load configuration.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cycle = Number.parseInt(transactionNumber, 10) || 10;
      const body: AdminReferralConfigBody = {
        minTransactionAmount: parseAmountString(transactionNumber),
        currency: "NGN",
        maxDaysFromOnboarding: 30,
        cycleSize: cycle,
        allowedProducts: [],
        rewardAmount: parseAmountString(rewardAmount),
        rewardCurrency: "NGN",
      };
      await createAdminReferralConfig(body);
      onSave();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not save configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Configure Earnings</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading configuration…</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Threshold Type</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                  value={thresholdType}
                  onChange={(e) => setThresholdType(e.target.value)}
                >
                  {["Transaction number", "Amount spent", "Sign-up count"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Saved to API as cycle size / min transaction amount.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Cycle size</label>
              <input
                type="text"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-primary-text">Reward Amount (NGN)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ReferralView() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "made" | "rewards" | "period" | "status">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"made" | "rewards" | "period" | "status">(openFilter, filterMode);

  const [draftMade, setDraftMade] = useState("All");
  const [draftRewards, setDraftRewards] = useState("All");
  const [draftPeriod, setDraftPeriod] = useState("Date range (picker coming soon)");
  const [draftStatus, setDraftStatus] = useState("");
  const [appliedMade, setAppliedMade] = useState<string | null>(null);
  const [appliedRewards, setAppliedRewards] = useState<string | null>(null);
  const [appliedStatus, setAppliedStatus] = useState<"" | "qualified" | "pending" | null>(null);

  const [listRows, setListRows] = useState<AdminReferralListRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConfigSuccess, setShowConfigSuccess] = useState(false);

  const clientFiltersActive = Boolean(
    (appliedMade && appliedMade !== "All") || (appliedRewards && appliedRewards !== "All"),
  );

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

  const loadList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const res = await getAdminReferralsList({
        page: clientFiltersActive ? 1 : page,
        pageSize: clientFiltersActive ? 100 : pageSize,
        search: debouncedSearch || undefined,
        status: appliedStatus ?? undefined,
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
  }, [appliedStatus, clientFiltersActive, debouncedSearch, page, pageSize]);

  useEffect(() => {
    void loadList();
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
    return listRows.filter((r) => matchesClientFilters(r, appliedMade, appliedRewards));
  }, [listRows, appliedMade, appliedRewards]);

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
        pageSize: 100,
        search: debouncedSearch || undefined,
        status: appliedStatus ?? undefined,
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
          Referrals made / rewards filters apply to up to 100 loaded rows. Status uses the API query param.
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
                summary={draftPeriod}
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
                setAppliedMade(draftMade === "All" ? null : draftMade);
                setAppliedRewards(draftRewards === "All" ? null : draftRewards);
                setAppliedStatus(
                  draftStatus === "" ? null : (draftStatus as "qualified" | "pending"),
                );
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedMade(null);
                setAppliedRewards(null);
                setAppliedStatus(null);
                setDraftMade("All");
                setDraftRewards("All");
                setDraftStatus("");
                setDraftPeriod("Date range (picker coming soon)");
                setOpenFilter(null);
                setFilterMode(false);
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
              placeholder="Search by Name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
              aria-label="Filter"
              onClick={() => setFilterMode(true)}
            >
              <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
            </button>
            <TableExportMenu
              disabled={listLoading || displayedRows.length === 0}
              onExportCsv={() => runExport("csv")}
              onExportPdf={() => runExport("pdf")}
              onExportJson={() => runExport("json")}
            />
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Configure Earning
            </button>
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
