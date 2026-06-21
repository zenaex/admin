"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { More, Add, Setting2, Edit2, PasswordCheck, Forbidden, Trash, Refresh } from "iconsax-react";
import { AdminRolesTab } from "@/components/user-mgt/admin-roles-tab";
import { CalendarDays, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { NotificationDrawerTrigger } from "@/components/notifications/notification-drawer";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  getAdminTeamList,
  postAdminTeamInvite,
  postAdminTeamDeactivate,
  postAdminTeamSuspend,
  postAdminTeamActivate,
  postAdminTeamResetPassword,
  putAdminTeamMember,
  getAdminInvitations,
  postAdminInvitationResend,
  deleteAdminInvitation,
  getAdminRoles,
  humanizeRole,
} from "@/lib/admin-api/team-api";
import type { AdminTeamMember, AdminPendingInvite, AdminRole } from "@/lib/admin-api/types";
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
  TableFilterCalendar,
  formatDateRangeLabel,
} from "@/components/ui/table-filter-bar";
import type { DateRange } from "react-day-picker";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { ErrorAlert } from "@/components/ui/error-alert";

/* ── Tab config ── */
type AdminTab = "Team" | "Roles & Permission" | "Pending Invites";

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
    () => ["Team", "Roles & Permission", "Pending Invites"],
    [],
  );

  const [activeTab, setActiveTab] = useState<AdminTab>("Team");
  const [hasSelectedRole, setHasSelectedRole] = useState(false);
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
  const [dynamicRoles, setDynamicRoles] = useState<AdminRole[]>([]);

  // Deactivate modal states
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateNotes, setDeactivateNotes] = useState("");

  // Suspend modal states
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendNotes, setSuspendNotes] = useState("");
  const [suspendUntil, setSuspendUntil] = useState("");
  const [suspendMessage, setSuspendMessage] = useState("");

  const reloadRoleOptions = useCallback(() => {
    getAdminRoles()
      .then((list) => {
        if (list.length > 0) setDynamicRoles(list);
      })
      .catch((err) => {
        console.error("Failed to load admin roles dynamically:", err);
      });
  }, []);

  useEffect(() => {
    reloadRoleOptions();
  }, [reloadRoleOptions]);

  const resolvedRoles = useMemo<AdminRole[]>(() => {
    if (dynamicRoles.length > 0) return dynamicRoles;
    return INVITE_ROLE_OPTIONS.map((name) => ({ id: name, name }));
  }, [dynamicRoles]);

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
      await putAdminTeamMember(roleTarget.id, { roleId: roleDraft });
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
    if (!deactivateReason.trim()) {
      setAdminActionError("Reason is required to deactivate.");
      return;
    }
    setAdminActionError(null);
    setAdminActionLoading(true);
    try {
      await postAdminTeamDeactivate(deactivateTarget.id, {
        reason: deactivateReason.trim(),
        notes: deactivateNotes.trim(),
      });
      const name = deactivateTarget.name;
      setDeactivateTarget(null);
      setDeactivateReason("");
      setDeactivateNotes("");
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
    if (!suspendReason.trim()) {
      setAdminActionError("Reason is required to suspend.");
      return;
    }
    if (!suspendUntil) {
      setAdminActionError("Suspend Until date is required.");
      return;
    }
    setAdminActionError(null);
    setAdminActionLoading(true);
    try {
      let suspendUntilIso = "";
      if (suspendUntil) {
        const d = new Date(suspendUntil);
        if (!Number.isNaN(d.getTime())) {
          suspendUntilIso = d.toISOString();
        }
      }
      await postAdminTeamSuspend(suspendTarget.id, {
        reason: suspendReason.trim(),
        notes: suspendNotes.trim(),
        suspendUntil: suspendUntilIso,
        message: suspendMessage.trim(),
      });
      const name = suspendTarget.name;
      setSuspendTarget(null);
      setSuspendReason("");
      setSuspendNotes("");
      setSuspendUntil("");
      setSuspendMessage("");
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
      {!hasSelectedRole && (
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
      )}

      {/* Tabs */}
      {!hasSelectedRole && (
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
      )}

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
                                  const matchingRole = resolvedRoles.find(
                                    (r) =>
                                      r.id === row.roleId ||
                                      r.name.toLowerCase() === row.role.toLowerCase() ||
                                      humanizeRole(r.name).toLowerCase() === row.role.toLowerCase()
                                  );
                                  setRoleDraft(matchingRole ? matchingRole.id : row.roleId || resolvedRoles[0]?.id || "");
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
        <AdminRolesTab
          canManage={isSuper}
          onRolesChanged={reloadRoleOptions}
          onSelectionChange={setHasSelectedRole}
        />
      )}

      {activeTab === "Pending Invites" && <PendingInvitesTab showInvite={isSuper} />}

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
          roles={resolvedRoles}
        />
      ) : null}

      {deactivateTarget ? (
        <ConfirmModal
          title="Deactivate admin"
          confirmLabel={adminActionLoading ? "Please wait…" : "Deactivate"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleDeactivateAdminConfirm()}
          onCancel={() => {
            if (!adminActionLoading) {
              setDeactivateTarget(null);
              setDeactivateReason("");
              setDeactivateNotes("");
            }
          }}
        >
          <div className="grid gap-3 text-left">
            <p className="text-center text-sm text-zinc-400">
              Are you sure you want to deactivate {deactivateTarget.name}?
            </p>
            <InputField
              id="deact-reason"
              label="Reason *"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              placeholder="e.g. Inactivity"
              required
            />
            <InputField
              id="deact-notes"
              label="Notes"
              value={deactivateNotes}
              onChange={(e) => setDeactivateNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </ConfirmModal>
      ) : null}

      {suspendTarget ? (
        <ConfirmModal
          title="Suspend admin"
          confirmLabel={adminActionLoading ? "Please wait…" : "Suspend"}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleSuspendAdminConfirm()}
          onCancel={() => {
            if (!adminActionLoading) {
              setSuspendTarget(null);
              setSuspendReason("");
              setSuspendNotes("");
              setSuspendUntil("");
              setSuspendMessage("");
            }
          }}
        >
          <div className="grid gap-3 text-left">
            <p className="text-center text-sm text-zinc-400">
              Are you sure you want to suspend {suspendTarget.name}?
            </p>
            <InputField
              id="susp-reason"
              label="Reason *"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Policy violation"
              required
            />
            <InputField
              id="susp-notes"
              label="Notes"
              value={suspendNotes}
              onChange={(e) => setSuspendNotes(e.target.value)}
              placeholder="Optional notes"
            />
            <InputField
              id="susp-until"
              label="Suspend Until *"
              type="datetime-local"
              value={suspendUntil}
              onChange={(e) => setSuspendUntil(e.target.value)}
              required
            />
            <InputField
              id="susp-message"
              label="Message"
              value={suspendMessage}
              onChange={(e) => setSuspendMessage(e.target.value)}
              placeholder="Optional message to the user"
            />
          </div>
        </ConfirmModal>
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
          roles={resolvedRoles}
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
  roles: AdminRole[];
};

function AdminChangeRoleModal({
  member,
  roleDraft,
  loading,
  onRoleChange,
  onClose,
  onSubmit,
  roles,
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
          {roles.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {humanizeRole(opt.name)}
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

function InviteAdminModal({
  onClose,
  onSuccess,
  roles,
}: {
  onClose: () => void;
  onSuccess: () => void;
  roles: AdminRole[];
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roles.length > 0 && !role) {
      setRole(roles[1]?.name || roles[0]?.name || "");
    }
  }, [roles, role]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !department.trim() ||
      !role
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await postAdminTeamInvite({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: uiRoleLabelToApiRole(role),
        phoneNumber: phoneNumber.trim(),
        department: department.trim(),
      });
      setSuccess("Invitation sent.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhoneNumber("");
      setDepartment("");
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
          <InputField
            id="modal-ph"
            label="Phone number"
            type="tel"
            value={phoneNumber}
            onChange={(ev) => setPhoneNumber(ev.target.value)}
          />
          <InputField
            id="modal-dept"
            label="Department"
            type="text"
            value={department}
            onChange={(ev) => setDepartment(ev.target.value)}
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
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {humanizeRole(r.name)}
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

/** Bug #56: Status badge for pending invites */
function InviteStatusBadge({ status }: { status: string }) {
  const s = (status || "Pending").trim().toLowerCase();
  let cls = "bg-orange-50 text-orange-600";
  let dot = "bg-orange-500";
  if (s.includes("accept") || s.includes("complete")) {
    cls = "bg-green-50 text-green-700"; dot = "bg-green-600";
  } else if (s.includes("expir") || s.includes("cancel") || s.includes("reject")) {
    cls = "bg-red-50 text-red-600"; dot = "bg-red-500";
  }
  const label = status || "Pending";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

function PendingInvitesTab({ showInvite }: { showInvite: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "role" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role" | "date">(openFilter, filterMode);

  const [draftRole, setDraftRole] = useState("All roles");
  const [draftDate, setDraftDate] = useState<DateRange | undefined>(undefined);
  const [appliedRole, setAppliedRole] = useState<string | null>(null);
  const [appliedDate, setAppliedDate] = useState<DateRange | undefined>(undefined);

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
      if (appliedDate?.from) {
        const itemDate = new Date(m.dateSent);
        if (itemDate && !Number.isNaN(itemDate.getTime())) {
          const start = new Date(appliedDate.from);
          start.setHours(0, 0, 0, 0);
          const end = appliedDate.to ? new Date(appliedDate.to) : new Date(appliedDate.from);
          end.setHours(23, 59, 59, 999);
          if (itemDate < start || itemDate > end) return false;
        }
      }
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
                setAppliedRole(draftRole === "All roles" ? null : draftRole);
                setAppliedDate(draftDate);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedRole(null);
                setAppliedDate(undefined);
                setDraftRole("All roles");
                setDraftDate(undefined);
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
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
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
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <InviteStatusBadge status={row.status} />
                </td>
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
                <td colSpan={5} className="h-32 text-center text-zinc-500">
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
