"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { More, Add, People, Setting2, Chart, ShieldTick, Headphone, Code1, Edit2, PasswordCheck, Forbidden, Trash, Refresh } from "iconsax-react";
import { CalendarDays, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { NotificationDrawerTrigger } from "@/components/notifications/notification-drawer";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { postPasswordResetApprove, postPasswordResetDecline } from "@/lib/admin-api/auth-api";
import { AdminApiError } from "@/lib/admin-api/client";
import { getAdminSettingsPasswordResetRequests } from "@/lib/admin-api/settings-api";
import {
  getAdminTeamList,
  postAdminTeamInvite,
  postAdminTeamDeactivate,
  postAdminTeamSuspend,
  postAdminTeamActivate,
  postAdminTeamResetPassword,
  postAdminTeamChangeRole,
  getAdminInvitations,
  postAdminInvitationResend,
  deleteAdminInvitation,
} from "@/lib/admin-api/team-api";
import type { AdminSettingsPasswordResetRequestRow, AdminTeamMember, AdminPendingInvite } from "@/lib/admin-api/types";
import { uiRoleLabelToApiRole, isRealAdminId } from "@/lib/admin-api/users-api";
import { isLikelySuperAdminFromToken } from "@/lib/auth/jwt";

const MOCK_ADMIN_ACTION_HINT = "Actions are not available on this team member.";
function canActOnAdminRow(row: AdminTeamMember): boolean {
  return isRealAdminId(row.id);
}
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";
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
import { TableExportMenu } from "@/components/ui/table-export-menu";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { ErrorAlert } from "@/components/ui/error-alert";

/* ── Tab config ── */
type AdminTab = "Team" | "Roles & Permission" | "Pending Invites" | "Password resets";

const INVITE_ROLE_OPTIONS = ["Super Admin", "Admin", "Operations", "Compliance", "Customer Care", "Tech Support"] as const;

const TEAM_EXPORT_COLUMNS: ExportColumn<AdminTeamMember>[] = [
  { header: "ID", value: (m) => m.id },
  { header: "Name", value: (m) => m.name },
  { header: "Email", value: (m) => m.email },
  { header: "Phone", value: (m) => m.phone },
  { header: "Role", value: (m) => m.role },
  { header: "Status", value: (m) => m.status },
  { header: "Date Onboarded", value: (m) => m.dateOnboarded },
];

type RoleExportRow = { name: string; members: number; description: string };

const ROLE_EXPORT_COLUMNS: ExportColumn<RoleExportRow>[] = [
  { header: "Role", value: (r) => r.name },
  { header: "Members", value: (r) => String(r.members) },
  { header: "Description", value: (r) => r.description },
];


/* ── Avatar ── */
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-profile-picture text-xs font-semibold text-blue-grey">
      {initials}
    </span>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const k = status.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-600";
  if (k.includes("active") || k.includes("success")) cls = "bg-green-50 text-green-600";
  else if (k.includes("pending") || k.includes("invited")) cls = "bg-orange-50 text-orange-500";
  else if (k.includes("fail") || k.includes("deactivat") || k.includes("suspend") || k.includes("block")) cls = "bg-red-50 text-red-500";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}


/* ── Main view ── */
export function AdminManagementView() {
  const { isAuthenticated } = useAuth();
  const isSuper = useMemo(
    () => isLikelySuperAdminFromToken(getAccessToken()),
    [isAuthenticated],
  );
  const tabList = useMemo<AdminTab[]>(
    () =>
      isSuper
        ? ["Team", "Roles & Permission", "Pending Invites", "Password resets"]
        : ["Team", "Roles & Permission", "Pending Invites"],
    [isSuper],
  );

  const [activeTab, setActiveTab] = useState<AdminTab>("Team");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminTeamMember | null>(null);
  const [roleDraft, setRoleDraft] = useState<string>(INVITE_ROLE_OPTIONS[1]);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminTeamMember | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminTeamMember | null>(null);
  const [resetPwTarget, setResetPwTarget] = useState<AdminTeamMember | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminSuccessMessage, setAdminSuccessMessage] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  /* ── Live team data ── */
  const [teamMembers, setTeamMembers] = useState<AdminTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setTeamLoadError(null);
    setTeamLoading(true);
    try {
      const result = await getAdminTeamList();
      setTeamMembers(result.items);
    } catch (e) {
      setTeamMembers([]);
      setTeamLoadError(e instanceof AdminApiError ? e.message : "Could not load team members.");
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  const [teamFilterMode, setTeamFilterMode] = useState(false);
  const [teamOpenFilter, setTeamOpenFilter] = useState<null | "role" | "status" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role" | "status" | "date">(teamOpenFilter, teamFilterMode && activeTab === "Team");

  const [draftTeamRole, setDraftTeamRole] = useState("All roles");
  const [draftTeamStatus, setDraftTeamStatus] = useState<string>("All statuses");
  const [draftTeamDate, setDraftTeamDate] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedTeamRole, setAppliedTeamRole] = useState<string | null>(null);
  const [appliedTeamStatus, setAppliedTeamStatus] = useState<string | null>(null);
  const [appliedTeamDate, setAppliedTeamDate] = useState<string | null>(null);

  const TEAM_ROLE_FILTER = useMemo(
    () => ["All roles", ...Array.from(new Set(teamMembers.map((m) => m.role).filter(Boolean))).sort()],
    [teamMembers],
  );
  const TEAM_STATUS_FILTER = useMemo(
    () => ["All statuses", ...Array.from(new Set(teamMembers.map((m) => m.status).filter(Boolean))).sort()],
    [teamMembers],
  );

  useEffect(() => {
    if (activeTab === "Password resets" && !isSuper) setActiveTab("Team");
  }, [activeTab, isSuper]);

  useEffect(() => {
    if (activeTab !== "Team") setTeamFilterMode(false);
  }, [activeTab]);

  useEffect(() => {
    if (!teamFilterMode) setTeamOpenFilter(null);
  }, [teamFilterMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTeamOpenFilter(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teamMembers.filter((m) => {
      if (appliedTeamRole && appliedTeamRole !== "All roles" && m.role !== appliedTeamRole) return false;
      if (appliedTeamStatus && appliedTeamStatus !== "All statuses" && m.status !== appliedTeamStatus)
        return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    });
  }, [search, teamMembers, appliedTeamRole, appliedTeamStatus]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const handleChangeRoleSubmit = async () => {
    if (!roleTarget) return;
    setAdminActionError(null);
    setAdminActionLoading(true);
    try {
      await postAdminTeamChangeRole(roleTarget.id, {
        newRole: uiRoleLabelToApiRole(roleDraft),
      });
      setRoleTarget(null);
      setAdminSuccessMessage(`Role updated for ${roleTarget.name}.`);
      void loadTeam();
    } catch (e) {
      setAdminActionError(e instanceof AdminApiError ? e.message : "Could not change role.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleDeactivateAdminConfirm = async () => {
    if (!deactivateTarget) return;
    setAdminActionError(null);
    setAdminActionLoading(true);
    try {
      await postAdminTeamDeactivate(deactivateTarget.id);
      const name = deactivateTarget.name;
      setDeactivateTarget(null);
      setAdminSuccessMessage(`${name} has been deactivated.`);
      void loadTeam();
    } catch (e) {
      setAdminActionError(e instanceof AdminApiError ? e.message : "Could not deactivate admin.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleSuspendAdminConfirm = async () => {
    if (!suspendTarget) return;
    setAdminActionError(null);
    setAdminActionLoading(true);
    try {
      await postAdminTeamSuspend(suspendTarget.id);
      const name = suspendTarget.name;
      setSuspendTarget(null);
      setAdminSuccessMessage(`${name} has been suspended.`);
      void loadTeam();
    } catch (e) {
      setAdminActionError(e instanceof AdminApiError ? e.message : "Could not suspend admin.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleActivateAdmin = async (row: AdminTeamMember) => {
    setAdminActionError(null);
    setAdminActionLoading(true);
    try {
      await postAdminTeamActivate(row.id);
      setAdminSuccessMessage(`${row.name} has been activated.`);
      void loadTeam();
    } catch (e) {
      setAdminActionError(e instanceof AdminApiError ? e.message : "Could not activate admin.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!resetPwTarget) return;
    setAdminActionError(null);
    setAdminActionLoading(true);
    try {
      await postAdminTeamResetPassword(resetPwTarget.id);
      const name = resetPwTarget.name;
      setResetPwTarget(null);
      setAdminSuccessMessage(`Password reset initiated for ${name}.`);
    } catch (e) {
      setAdminActionError(e instanceof AdminApiError ? e.message : "Could not reset password.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const runTeamExport = (format: "csv" | "json" | "pdf") => {
    exportClientTable("admin-team", format, filtered, TEAM_EXPORT_COLUMNS);
  };


  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-primary-text text-[20px] font-semibold whitespace-nowrap">Admin Management</h1>

        {/* Global Toolbar */}
        <div className="flex items-center gap-6 w-full justify-end">
          {/* Icons */}
          <div className="flex items-center gap-4 text-zinc-600">
            <NotificationDrawerTrigger notificationCount={2} iconSize={24} />
            <button type="button" className="hover:text-primary-text transition-colors">
              <Setting2 size={24} variant="Outline" color="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <UnderlineTabs
          tabs={tabList.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => {
            setActiveTab(id as AdminTab);
            setPage(1);
          }}
        />
      </div>

      {/* Tab content */}
      {activeTab === "Team" && (
        <>
          {teamFilterMode ? (
            <TableFilterModeBar
              filterBarRef={filterBarRef}
              filterScrollRef={filterScrollRef}
              showBackdrop={Boolean(teamOpenFilter)}
              onBackdropClick={() => setTeamOpenFilter(null)}
              onPillsScroll={() => {
                if (teamOpenFilter) syncDropdownLeft(teamOpenFilter);
              }}
              pills={
                <>
                  <TableFilterPill
                    label="Role"
                    summary={draftTeamRole}
                    pillRef={registerPillRef("role")}
                    onClick={() =>
                      setTeamOpenFilter((v) => {
                        const next = v === "role" ? null : "role";
                        syncDropdownLeft(next);
                        return next;
                      })
                    }
                  />
                  <TableFilterPill
                    label="Status"
                    summary={draftTeamStatus}
                    pillRef={registerPillRef("status")}
                    onClick={() =>
                      setTeamOpenFilter((v) => {
                        const next = v === "status" ? null : "status";
                        syncDropdownLeft(next);
                        return next;
                      })
                    }
                  />
                  <TableFilterPill
                    label="Date onboarded"
                    summary={draftTeamDate}
                    pillRef={registerPillRef("date")}
                    onClick={() =>
                      setTeamOpenFilter((v) => {
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
                    setTeamOpenFilter((v) => {
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
                  {teamOpenFilter === "role" ? (
                    <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                      <TableFilterPanelTitle />
                      <TableFilterOptionsList
                        options={TEAM_ROLE_FILTER}
                        onSelect={(opt) => {
                          setDraftTeamRole(opt);
                          setTeamOpenFilter(null);
                        }}
                      />
                    </TableFilterDropdownCard>
                  ) : null}
                  {teamOpenFilter === "status" ? (
                    <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[180px]">
                      <TableFilterPanelTitle />
                      <TableFilterOptionsList
                        options={[...TEAM_STATUS_FILTER]}
                        onSelect={(opt) => {
                          setDraftTeamStatus(opt);
                          setTeamOpenFilter(null);
                        }}
                      />
                    </TableFilterDropdownCard>
                  ) : null}
                  {teamOpenFilter === "date" ? (
                    <TableFilterDropdownCard left={dropdownLeft}>
                      <TableFilterPanelTitle />
                      <button
                        type="button"
                        className="mt-2 flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-[13px] text-primary-text hover:bg-zinc-50"
                        onClick={() => {
                          setDraftTeamDate("From Jan 6, 2026 - To Jan 6, 2026");
                          setTeamOpenFilter(null);
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
                    setAppliedTeamRole(draftTeamRole === "All roles" ? null : draftTeamRole);
                    setAppliedTeamStatus(draftTeamStatus === "All statuses" ? null : draftTeamStatus);
                    setAppliedTeamDate(draftTeamDate);
                    setTeamOpenFilter(null);
                    setPage(1);
                  }}
                  onClear={() => {
                    setSearch("");
                    setAppliedTeamRole(null);
                    setAppliedTeamStatus(null);
                    setAppliedTeamDate(null);
                    setDraftTeamRole("All roles");
                    setDraftTeamStatus("All statuses");
                    setDraftTeamDate("From Jan 6, 2026 - To Jan 6, 2026");
                    setTeamOpenFilter(null);
                    setTeamFilterMode(false);
                    setPage(1);
                  }}
                />
              }
            />
          ) : (
          <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
            <span className="shrink-0 text-[15px] font-semibold text-primary-text">
              Team Members ({totalItems.toLocaleString()})
            </span>
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
                onClick={() => {
                  setSearch("");
                  setTeamFilterMode(true);
                }}
              >
                <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
              </button>
              <TableExportMenu
                disabled={filtered.length === 0}
                onExportCsv={() => runTeamExport("csv")}
                onExportPdf={() => runTeamExport("pdf")}
                onExportJson={() => runTeamExport("json")}
              />
              {isSuper && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  <Add size={18} variant="Outline" color="currentColor" />
                  Add Employee
                </button>
              )}
            </div>
          </div>
          )}

          {/* Table */}
          <div className="mt-4 overflow-x-auto rounded-[8px]">
            <table className="w-full border-collapse bg-white text-left text-sm">
              <thead>
                <tr className="bg-outline text-xs text-zinc-400">
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Employee Name</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Phone Number</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Role</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
                  <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Onboarded</th>
                  <th className="h-11 w-12 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.name} />
                        <span className="text-sm font-medium text-primary-text">{row.name}</span>
                      </div>
                    </td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.phone}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.role}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">{row.dateOnboarded}</td>
                    <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuCoords({
                              top: rect.bottom + 4,
                              left: rect.right - 224, // width of dropdown (56 * 4 = 224px)
                            });
                            setOpenMenuId((id) => id === row.id ? null : row.id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-outline hover:text-zinc-600"
                          aria-label={`Actions for ${row.name}`}
                        >
                          <More size={18} variant="Outline" color="currentColor" className="rotate-90" />
                        </button>
                        {openMenuId === row.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => {
                                setOpenMenuId(null);
                                setMenuCoords(null);
                              }}
                            />
                            <div
                              style={{
                                position: "fixed",
                                top: menuCoords ? `${menuCoords.top}px` : undefined,
                                left: menuCoords ? `${menuCoords.left}px` : undefined,
                                width: "224px",
                              }}
                              className="z-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg"
                            >
                              <button
                                type="button"
                                disabled={!canActOnAdminRow(row)}
                                title={canActOnAdminRow(row) ? "Change role" : MOCK_ADMIN_ACTION_HINT}
                                onClick={() => {
                                  if (!canActOnAdminRow(row)) return;
                                  setAdminActionError(null);
                                  setRoleDraft(row.role);
                                  setRoleTarget(row);
                                  setOpenMenuId(null);
                                  setMenuCoords(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Edit2 size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                                Change role
                              </button>
                              <button
                                type="button"
                                disabled={!canActOnAdminRow(row)}
                                title={canActOnAdminRow(row) ? "Reset Password" : MOCK_ADMIN_ACTION_HINT}
                                onClick={() => {
                                  if (!canActOnAdminRow(row)) return;
                                  setAdminActionError(null);
                                  setResetPwTarget(row);
                                  setOpenMenuId(null);
                                  setMenuCoords(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <PasswordCheck size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                                Reset Password
                              </button>
                              {row.status.toLowerCase().includes("suspend") ? (
                                <button
                                  type="button"
                                  disabled={!canActOnAdminRow(row)}
                                  title={canActOnAdminRow(row) ? "Activate admin" : MOCK_ADMIN_ACTION_HINT}
                                  onClick={() => {
                                    if (!canActOnAdminRow(row)) return;
                                    setOpenMenuId(null);
                                    setMenuCoords(null);
                                    void handleActivateAdmin(row);
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Refresh size={16} variant="Outline" className="text-zinc-500" />
                                  Activate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!canActOnAdminRow(row)}
                                  title={canActOnAdminRow(row) ? "Suspend admin" : MOCK_ADMIN_ACTION_HINT}
                                  onClick={() => {
                                    if (!canActOnAdminRow(row)) return;
                                    setAdminActionError(null);
                                    setSuspendTarget(row);
                                    setOpenMenuId(null);
                                    setMenuCoords(null);
                                  }}
                                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Forbidden size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                                  Suspend
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={!canActOnAdminRow(row)}
                                title={canActOnAdminRow(row) ? "Deactivate admin" : MOCK_ADMIN_ACTION_HINT}
                                onClick={() => {
                                  if (!canActOnAdminRow(row)) return;
                                  setAdminActionError(null);
                                  setDeactivateTarget(row);
                                  setOpenMenuId(null);
                                  setMenuCoords(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Forbidden size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                                Deactivate
                              </button>
                              <button
                                type="button"
                                disabled
                                title="Not available yet"
                                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash size={16} variant="Outline" color="currentColor" />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </>
      )}

      {activeTab === "Roles & Permission" && (
        <RolesPermissionTab />
      )}

      {activeTab === "Pending Invites" && <PendingInvitesTab showInvite={isSuper} />}

      {activeTab === "Password resets" && isSuper ? <PasswordResetsTab /> : null}

      {adminActionError ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg"
          role="alert"
        >
          {adminActionError}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => setAdminActionError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {roleTarget ? (
        <AdminChangeRoleModal
          member={roleTarget}
          roleDraft={roleDraft}
          loading={adminActionLoading}
          onRoleChange={setRoleDraft}
          onClose={() => {
            if (!adminActionLoading) setRoleTarget(null);
          }}
          onSubmit={() => void handleChangeRoleSubmit()}
        />
      ) : null}

      {deactivateTarget ? (
        <ConfirmModal
          title="Deactivate admin"
          message={`Are you sure you want to deactivate ${deactivateTarget.name}?`}
          confirmLabel={adminActionLoading ? "Please wait…" : "Deactivate"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleDeactivateAdminConfirm()}
          onCancel={() => {
            if (!adminActionLoading) setDeactivateTarget(null);
          }}
        />
      ) : null}

      {suspendTarget ? (
        <ConfirmModal
          title="Suspend admin"
          message={`Are you sure you want to suspend ${suspendTarget.name}?`}
          confirmLabel={adminActionLoading ? "Please wait…" : "Suspend"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleSuspendAdminConfirm()}
          onCancel={() => {
            if (!adminActionLoading) setSuspendTarget(null);
          }}
        />
      ) : null}

      {resetPwTarget ? (
        <ConfirmModal
          title="Reset Password"
          message={`Are you sure you want to trigger a password reset for ${resetPwTarget.name}?`}
          confirmLabel={adminActionLoading ? "Please wait…" : "Reset"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleResetPasswordConfirm()}
          onCancel={() => {
            if (!adminActionLoading) setResetPwTarget(null);
          }}
        />
      ) : null}

      {showInviteModal ? (
        <InviteAdminModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            void loadTeam();
          }}
        />
      ) : null}

      {adminSuccessMessage ? (
        <SuccessModal
          message={adminSuccessMessage}
          confirmLabel="Done"
          onContinue={() => setAdminSuccessMessage(null)}
        />
      ) : null}
    </div>
  );
}

type AdminChangeRoleModalProps = {
  member: AdminTeamMember;
  roleDraft: string;
  loading: boolean;
  onRoleChange: (role: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function AdminChangeRoleModal({
  member,
  roleDraft,
  loading,
  onRoleChange,
  onClose,
  onSubmit,
}: AdminChangeRoleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <h2 className="text-[17px] font-bold text-brand-navy">Change role</h2>
        <p className="mt-1 text-sm text-zinc-500">{member.name}</p>
        <label className="mt-5 block text-sm font-medium text-zinc-700">Role</label>
        <select
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none focus:border-zinc-400"
          value={roleDraft}
          disabled={loading}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          {INVITE_ROLE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 rounded-full bg-outline py-3 text-sm font-semibold text-primary-text hover:bg-zinc-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onSubmit}
            className="flex-1 rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Roles & Permission tab ── */
const ROLES = [
  { name: "Super Admin", icon: <People size={22} variant="Outline" color="currentColor" />, members: 10, description: "Super admin has all permissions including; Create User, and all" },
  { name: "Admin", icon: <Setting2 size={22} variant="Outline" color="currentColor" />, members: 10, description: "Can create users, create billers, delete products, create products, and five more." },
  { name: "Operations", icon: <Chart size={22} variant="Outline" color="currentColor" />, members: 10, description: "Can create users, create billers, delete products, create products, and five more." },
  { name: "Compliance", icon: <ShieldTick size={22} variant="Outline" color="currentColor" />, members: 10, description: "Can create users, create billers, delete products, create products, and five more." },
  { name: "Customer Care", icon: <Headphone size={22} variant="Outline" color="currentColor" />, members: 10, description: "Can create users, create billers, delete products, create products, and five more." },
  { name: "Tech Support", icon: <Code1 size={22} variant="Outline" color="currentColor" />, members: 10, description: "Can create users, create billers, delete products, create products, and five more." },
];

const MEMBER_AVATARS = ["AT", "TA", "TA"];

const ROLE_TEMPLATE_FILTER = ["All templates", ...ROLES.map((r) => r.name)];

function RolesPermissionTab() {
  const [roleSearch, setRoleSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "role">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role">(openFilter, filterMode);

  const [draftRoleTemplate, setDraftRoleTemplate] = useState("All templates");
  const [appliedRoleTemplate, setAppliedRoleTemplate] = useState<string | null>(null);

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

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    return ROLES.filter((r) => {
      if (appliedRoleTemplate && appliedRoleTemplate !== "All templates" && r.name !== appliedRoleTemplate)
        return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q);
    });
  }, [roleSearch, appliedRoleTemplate]);

  const runRoleExport = (format: "csv" | "json" | "pdf") => {
    const rows: RoleExportRow[] = filteredRoles.map((r) => ({
      name: r.name,
      members: r.members,
      description: r.description,
    }));
    exportClientTable("admin-roles", format, rows, ROLE_EXPORT_COLUMNS);
  };

  return (
    <>
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
            <TableFilterPill
              label="Role template"
              summary={draftRoleTemplate}
              pillRef={registerPillRef("role")}
              onClick={() =>
                setOpenFilter((v) => {
                  const next = v === "role" ? null : "role";
                  syncDropdownLeft(next);
                  return next;
                })
              }
            />
          }
          dropdownLayer={
            openFilter === "role" ? (
              <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[220px]">
                <TableFilterPanelTitle />
                <TableFilterOptionsList
                  options={ROLE_TEMPLATE_FILTER}
                  onSelect={(opt) => {
                    setDraftRoleTemplate(opt);
                    setOpenFilter(null);
                  }}
                />
              </TableFilterDropdownCard>
            ) : null
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedRoleTemplate(draftRoleTemplate === "All templates" ? null : draftRoleTemplate);
                setOpenFilter(null);
              }}
              onClear={() => {
                setRoleSearch("");
                setAppliedRoleTemplate(null);
                setDraftRoleTemplate("All templates");
                setOpenFilter(null);
                setFilterMode(false);
              }}
            />
          }
        />
      ) : (
      <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <span className="shrink-0 text-[15px] font-semibold text-primary-text">
          Roles &amp; Permission ({ROLES.length})
        </span>
        <div className="ml-4 w-[280px] shrink-0">
          <AuditTrailIconSearch
            variant="toolbar"
            placeholder="Search by Name or ID"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
            aria-label="Filter"
            onClick={() => {
              setRoleSearch("");
              setFilterMode(true);
            }}
          >
            <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          </button>
          <TableExportMenu
            disabled={filteredRoles.length === 0}
            onExportCsv={() => runRoleExport("csv")}
            onExportPdf={() => runRoleExport("pdf")}
            onExportJson={() => runRoleExport("json")}
          />
          <button type="button" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90">
            <Add size={18} variant="Outline" color="currentColor" />
            Role
          </button>
        </div>
      </div>
      )}

      {/* Role cards grid */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {filteredRoles.map((role) => (
          <RoleCard key={role.name} role={role} />
        ))}
      </div>
    </>
  );
}

function RoleCard({ role }: { role: (typeof ROLES)[number] }) {
  return (
    <div className="rounded-xl border border-outline bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-outline text-zinc-500">
            {role.icon}
          </span>
          <span className="text-[15px] font-semibold text-primary-text">{role.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {MEMBER_AVATARS.map((initials, idx) => (
              <span
                key={idx}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-profile-picture text-[10px] font-semibold text-blue-grey"
              >
                {initials}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-400">{role.members} Members</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-500">
        {role.description}
      </p>

      <button type="button" className="mt-3 text-sm font-semibold text-brand-navy underline underline-offset-2 hover:opacity-80">
        See Permissions
      </button>
    </div>
  );
}

function InviteAdminForm({ onSuccess }: { onSuccess?: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(INVITE_ROLE_OPTIONS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await postAdminTeamInvite({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: uiRoleLabelToApiRole(role),
      });
      setSuccess("Invitation sent.");
      setFirstName("");
      setLastName("");
      setEmail("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not send invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-outline bg-white p-5">
      <h3 className="text-[15px] font-semibold text-primary-text">Invite admin</h3>
      <p className="mt-1 text-xs text-zinc-500">Sends an email with an accept link (super admin only).</p>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        {error ? (
          <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="sm:col-span-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
            {success}
          </p>
        ) : null}
        <InputField id="inv-fn" label="First name" value={firstName} onChange={(ev) => setFirstName(ev.target.value)} />
        <InputField id="inv-ln" label="Last name" value={lastName} onChange={(ev) => setLastName(ev.target.value)} />
        <InputField
          id="inv-em"
          label="Email"
          type="email"
          className="sm:col-span-2"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
        <div className="sm:col-span-2">
          <label htmlFor="inv-role" className="mb-1.5 block text-[11px] font-medium text-gray-500">
            Role
          </label>
          <select
            id="inv-role"
            value={role}
            onChange={(ev) => setRole(ev.target.value)}
            className="text-primary-text h-10 w-full max-w-md rounded-md border border-secondary-green/25 bg-white px-3 text-sm outline-none focus:border-secondary-green"
          >
            {INVITE_ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send invitation"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function InviteAdminModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(INVITE_ROLE_OPTIONS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await postAdminTeamInvite({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: uiRoleLabelToApiRole(role),
      });
      setSuccess("Invitation sent.");
      setFirstName("");
      setLastName("");
      setEmail("");
      onSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not send invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <h2 className="text-[17px] font-bold text-brand-navy">Add Employee</h2>
        <p className="mt-1 text-xs text-zinc-500">Sends an email with an invite link.</p>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
              {success}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <InputField id="modal-fn" label="First name" value={firstName} onChange={(ev) => setFirstName(ev.target.value)} />
            <InputField id="modal-ln" label="Last name" value={lastName} onChange={(ev) => setLastName(ev.target.value)} />
          </div>
          <InputField
            id="modal-em"
            label="Email"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
          <div>
            <label htmlFor="modal-role" className="mb-1.5 block text-[11px] font-medium text-gray-500">
              Role
            </label>
            <select
              id="modal-role"
              value={role}
              onChange={(ev) => setRole(ev.target.value)}
              className="text-primary-text h-10 w-full rounded-md border border-secondary-green/25 bg-white px-3 text-sm outline-none focus:border-secondary-green"
            >
              {INVITE_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 rounded-full bg-outline py-3 text-sm font-semibold text-primary-text hover:bg-zinc-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordResetsTab() {
  const [rows, setRows] = useState<AdminSettingsPasswordResetRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | { requestId: string; kind: "approve" | "decline" }>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const list = await getAdminSettingsPasswordResetRequests();
      setRows(list);
      setPage(1);
    } catch (e) {
      setRows([]);
      setLoadError(e instanceof AdminApiError ? e.message : "Could not load password reset requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(Math.max(rows.length, 1) / pageSize)));
  const paginatedRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  );

  const runAction = async (requestId: string, kind: "approve" | "decline") => {
    setActionError(null);
    setMessage(null);
    setBusy({ requestId, kind });
    try {
      if (kind === "approve") {
        await postPasswordResetApprove({ requestId });
        setMessage("Password reset approved. The user will receive a reset link by email.");
      } else {
        await postPasswordResetDecline({ requestId });
        setMessage("Password reset request declined.");
      }
      await load();
    } catch (e) {
      setActionError(e instanceof AdminApiError ? e.message : kind === "approve" ? "Approve failed." : "Decline failed.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Loading password reset requests…</p>;
  }

  if (loadError) {
    return (
      <ErrorAlert error={loadError} onRetry={() => void load()} className="mt-6" />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
          {message}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-[8px] border border-outline bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Request ID</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Name</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Role</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Requested</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="border-b border-zinc-100 px-4 py-10 text-center text-zinc-500">
                  No pending password reset requests.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const rowBusy = busy?.requestId === row.requestId;
                return (
                  <tr key={row.requestId} className="hover:bg-zinc-50">
                    <td className="border-b border-zinc-100 px-4 py-3 font-mono text-xs">{row.requestId}</td>
                    <td className="border-b border-zinc-100 px-4 py-3 font-medium text-primary-text">
                      {row.name ?? "—"}
                    </td>
                    <td className="border-b border-zinc-100 px-4 py-3">{row.email ?? "—"}</td>
                    <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.role ?? "—"}</td>
                    <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {row.dateRequested ?? "—"}
                    </td>
                    <td className="border-b border-zinc-100 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => void runAction(row.requestId, "approve")}
                        >
                          {rowBusy && busy?.kind === "approve" ? "Approving…" : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={Boolean(busy)}
                          onClick={() => void runAction(row.requestId, "decline")}
                        >
                          {rowBusy && busy?.kind === "decline" ? "Declining…" : "Decline"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 ? (
        <AuditTrailPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={rows.length}
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

/* ── Pending Invites tab ── */
const PENDING_EXPORT_COLUMNS: ExportColumn<AdminPendingInvite>[] = [
  { header: "ID", value: (m) => m.id },
  { header: "First Name", value: (m) => m.firstName },
  { header: "Last Name", value: (m) => m.lastName },
  { header: "Email", value: (m) => m.email },
  { header: "Role", value: (m) => m.role },
  { header: "Status", value: (m) => m.status },
  { header: "Date Sent", value: (m) => m.dateSent },
];

function PendingInvitesTab({ showInvite }: { showInvite: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "role" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role" | "date">(openFilter, filterMode);

  const [draftRole, setDraftRole] = useState("All roles");
  const [draftDate, setDraftDate] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedRole, setAppliedRole] = useState<string | null>(null);
  const [appliedDate, setAppliedDate] = useState<string | null>(null);

  /* ── Live invitations data ── */
  const [invites, setInvites] = useState<AdminPendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminPendingInvite | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await getAdminInvitations();
      setInvites(res.items);
    } catch (err) {
      setInvites([]);
      setLoadError(err instanceof AdminApiError ? err.message : "Could not load invitations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResend = async (id: string, email: string) => {
    setActionError(null);
    setSuccessMessage(null);
    setActionLoading(true);
    try {
      await postAdminInvitationResend(id);
      setSuccessMessage(`Invitation resent to ${email}.`);
      void load();
    } catch (err) {
      setActionError(err instanceof AdminApiError ? err.message : "Could not resend invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setActionError(null);
    setSuccessMessage(null);
    setActionLoading(true);
    try {
      await deleteAdminInvitation(cancelTarget.id);
      const email = cancelTarget.email;
      setCancelTarget(null);
      setSuccessMessage(`Invitation to ${email} has been cancelled.`);
      void load();
    } catch (err) {
      setActionError(err instanceof AdminApiError ? err.message : "Could not cancel invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRoleOptions = useMemo(
    () => ["All roles", ...Array.from(new Set(invites.map((m) => m.role))).sort()],
    [invites],
  );

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invites.filter((m) => {
      if (appliedRole && appliedRole !== "All roles" && m.role !== appliedRole) return false;
      if (appliedDate && !m.dateSent.includes("Jan 6, 2026")) return false;
      if (!q) return true;
      const fullName = [m.firstName, m.lastName].filter(Boolean).join(" ").toLowerCase();
      return (
        m.email.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        fullName.includes(q)
      );
    });
  }, [search, invites, appliedRole, appliedDate]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const runPendingExport = (format: "csv" | "json" | "pdf") => {
    exportClientTable("admin-pending-invites", format, filtered, PENDING_EXPORT_COLUMNS);
  };

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Loading pending invites…</p>;
  }

  if (loadError) {
    return <ErrorAlert error={loadError} onRetry={() => void load()} className="mt-6" />;
  }

  return (
    <>
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
                label="Date onboarded"
                summary={draftDate}
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
              {openFilter === "role" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[200px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={pendingRoleOptions}
                    onSelect={(opt) => {
                      setDraftRole(opt);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "date" ? (
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-[13px] text-primary-text hover:bg-zinc-50"
                    onClick={() => {
                      setDraftDate("From Jan 6, 2026 - To Jan 6, 2026");
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
                setAppliedRole(draftRole === "All roles" ? null : draftRole);
                setAppliedDate(draftDate);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedRole(null);
                setAppliedDate(null);
                setDraftRole("All roles");
                setDraftDate("From Jan 6, 2026 - To Jan 6, 2026");
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
      <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
        <span className="shrink-0 text-[15px] font-semibold text-primary-text">
          Pending Invites ({totalItems.toLocaleString()})
        </span>
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
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
            onClick={() => {
              setSearch("");
              setFilterMode(true);
            }}
          >
            <ListFilter size={16} strokeWidth={2} color="var(--color-brand-navy)" />
            Filter
          </button>
          <TableExportMenu
            disabled={filtered.length === 0}
            onExportCsv={() => runPendingExport("csv")}
            onExportPdf={() => runPendingExport("pdf")}
            onExportJson={() => runPendingExport("json")}
          />
        </div>
      </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Role</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Onboarded</th>
              <th className="h-11 w-48 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-primary-text font-medium align-middle">
                  {row.email}
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.role}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                  {row.dateSent.replace(",", " |")}
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleResend(row.id, row.email)}
                    className="text-[13px] font-bold text-[#0B294F] underline underline-offset-4 hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Resend Invite
                  </button>
                </td>
              </tr>
            ))}
            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={4} className="h-32 text-center text-zinc-500">
                  No pending invites found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      {actionError ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg"
          role="alert"
        >
          {actionError}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => setActionError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {successMessage ? (
        <SuccessModal
          message={successMessage}
          confirmLabel="Done"
          onContinue={() => setSuccessMessage(null)}
        />
      ) : null}

      {cancelTarget ? (
        <ConfirmModal
          title="Cancel Invitation"
          message={`Are you sure you want to cancel the invitation for ${cancelTarget.email}?`}
          confirmLabel={actionLoading ? "Please wait…" : "Cancel Invite"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleCancelConfirm()}
          onCancel={() => {
            if (!actionLoading) setCancelTarget(null);
          }}
        />
      ) : null}
    </>
  );
}
