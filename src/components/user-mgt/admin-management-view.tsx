"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { More, Add, People, Setting2, Chart, ShieldTick, Headphone, Code1, Edit2, PasswordCheck, Forbidden, Trash, DocumentText, Document } from "iconsax-react";
import { CalendarDays, Download, ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { NotificationDrawerTrigger } from "@/components/notifications/notification-drawer";
import { postInvitation, postPasswordResetApprove } from "@/lib/admin-api/auth-api";
import { AdminApiError } from "@/lib/admin-api/client";
import { isLikelySuperAdminFromToken } from "@/lib/auth/jwt";
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

/* ── Tab config ── */
type AdminTab = "Team" | "Roles & Permission" | "Pending Invites" | "Password resets";

const INVITE_ROLE_OPTIONS = ["Super Admin", "Admin", "Operations", "Compliance", "Customer Care", "Tech Support"] as const;

/* ── Types ── */
type MemberStatus = "Successful" | "Pending" | "Failed";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: MemberStatus;
  dateOnboarded: string;
};

/* ── Seed data ── */
const BASE_MEMBERS: Omit<TeamMember, "id">[] = [
  { name: "Adeboye Temidayo", email: "Adeboye.temidayo@zaneax.com", phone: "08077657678", role: "Superadmin", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Azuka Adefemi", email: "Azuka.adefemi@zaneax.com", phone: "08077657678", role: "Admin", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Babangida Tunde", email: "Babangida.tunde@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Pending", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiamaka Ngozi", email: "Chiamaka.ngozi@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Pending", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiroma Ikechukwu", email: "Chiroma.ikechukwu@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Chizoba Adekunle", email: "Chizoba.adekunle@shago.com", phone: "08077657678", role: "Admin", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Lala Jibola", email: "Lala.jibola@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Failed", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Lola Serubawon", email: "Lala.serubawon@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Successful", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Pelumi Fetuga", email: "Pelumi.fetuga@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Pending", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Poco Lee", email: "Poco.lee@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Failed", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Shakur Wasiu", email: "Shakur.wasiu@zaneax.com", phone: "08077657678", role: "Tech Support", status: "Failed", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
];

const ALL_MEMBERS: TeamMember[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_MEMBERS[i % BASE_MEMBERS.length],
  id: `member-${i}`,
  name:
    i < BASE_MEMBERS.length
      ? BASE_MEMBERS[i].name
      : `${BASE_MEMBERS[i % BASE_MEMBERS.length].name} (${i + 1})`,
}));

const TEAM_ROLE_FILTER = ["All roles", ...Array.from(new Set(BASE_MEMBERS.map((m) => m.role))).sort()];
const TEAM_STATUS_FILTER = ["All statuses", "Successful", "Pending", "Failed"] as const;

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
function StatusBadge({ status }: { status: MemberStatus }) {
  const styles: Record<MemberStatus, string> = {
    Successful: "bg-green-50 text-green-600",
    Pending: "bg-orange-50 text-orange-500",
    Failed: "bg-red-50 text-red-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
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
  const [teamExportOpen, setTeamExportOpen] = useState(false);

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
    return ALL_MEMBERS.filter((m) => {
      if (appliedTeamRole && appliedTeamRole !== "All roles" && m.role !== appliedTeamRole) return false;
      if (appliedTeamStatus && appliedTeamStatus !== "All statuses" && m.status !== appliedTeamStatus)
        return false;
      if (appliedTeamDate && !m.dateOnboarded.includes("Jan 6, 2026")) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    });
  }, [search, appliedTeamRole, appliedTeamStatus, appliedTeamDate]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTeamExportOpen((o) => !o)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
                >
                  <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
                  Export
                </button>
                {teamExportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setTeamExportOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                      <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
                        <button type="button" onClick={() => setTeamExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                          <DocumentText size={18} variant="Outline" color="currentColor" />
                          CSV
                        </button>
                        <button type="button" onClick={() => setTeamExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                          <Document size={18} variant="Outline" color="currentColor" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                <Add size={18} variant="Outline" color="currentColor" />
                Add Employee
              </button>
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
                          onClick={() => setOpenMenuId((id) => id === row.id ? null : row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-outline hover:text-zinc-600"
                          aria-label={`Actions for ${row.name}`}
                        >
                          <More size={18} variant="Outline" color="currentColor" className="rotate-90" />
                        </button>
                        {openMenuId === row.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg">
                              <button type="button" onClick={() => setOpenMenuId(null)} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                                <Edit2 size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                                Edit
                              </button>
                              <button type="button" onClick={() => setOpenMenuId(null)} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                                <PasswordCheck size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                                Reset Password
                              </button>
                              <button type="button" onClick={() => setOpenMenuId(null)} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                                <Forbidden size={16} variant="Outline" color="currentColor" className="text-zinc-500" />
                                Deactivate
                              </button>
                              <button type="button" onClick={() => setOpenMenuId(null)} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50">
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
  const [exportOpen, setExportOpen] = useState(false);
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
            >
              <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
              Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <DocumentText size={18} variant="Outline" color="currentColor" />
                      CSV
                    </button>
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <Document size={18} variant="Outline" color="currentColor" />
                      PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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

function InviteAdminForm() {
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
      await postInvitation({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
      });
      setSuccess("Invitation sent.");
      setFirstName("");
      setLastName("");
      setEmail("");
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

const DEMO_PASSWORD_RESET_ROWS = [
  { requestId: "demo-req-1", email: "pending.user@example.com", createdAt: "Jan 10, 2026" },
];

function PasswordResetsTab() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const approve = async (requestId: string) => {
    setError(null);
    setMessage(null);
    setBusyId(requestId);
    try {
      await postPasswordResetApprove({ requestId });
      setMessage(`Request ${requestId} approved. The user will receive a reset link by email.`);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-zinc-500">
        Demo rows below; replace with a GET list from the API when available. Approve calls{" "}
        <code className="text-xs">POST /admin/password-reset/approve</code>.
      </p>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
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
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Requested</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PASSWORD_RESET_ROWS.map((row) => (
              <tr key={row.requestId} className="hover:bg-zinc-50">
                <td className="border-b border-zinc-100 px-4 py-3 font-mono text-xs">{row.requestId}</td>
                <td className="border-b border-zinc-100 px-4 py-3">{row.email}</td>
                <td className="border-b border-zinc-100 px-4 py-3 text-zinc-500">{row.createdAt}</td>
                <td className="border-b border-zinc-100 px-4 py-3">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyId === row.requestId}
                    onClick={() => approve(row.requestId)}
                  >
                    {busyId === row.requestId ? "Approving…" : "Approve"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Pending Invites tab ── */
function PendingInvitesTab({ showInvite }: { showInvite: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [exportOpen, setExportOpen] = useState(false);
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "role" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role" | "date">(openFilter, filterMode);

  const [draftRole, setDraftRole] = useState("All roles");
  const [draftDate, setDraftDate] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedRole, setAppliedRole] = useState<string | null>(null);
  const [appliedDate, setAppliedDate] = useState<string | null>(null);

  const pendingMembers = useMemo(() => ALL_MEMBERS.filter((m) => m.status === "Pending"), []);
  const pendingRoleOptions = useMemo(
    () => ["All roles", ...Array.from(new Set(pendingMembers.map((m) => m.role))).sort()],
    [pendingMembers],
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
    return pendingMembers.filter((m) => {
      if (appliedRole && appliedRole !== "All roles" && m.role !== appliedRole) return false;
      if (appliedDate && !m.dateOnboarded.includes("Jan 6, 2026")) return false;
      if (!q) return true;
      return m.email.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    });
  }, [search, pendingMembers, appliedRole, appliedDate]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  return (
    <>
      {showInvite ? <InviteAdminForm /> : null}
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
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle"
            aria-label="Filter"
            onClick={() => {
              setSearch("");
              setFilterMode(true);
            }}
          >
            <ListFilter size={18} strokeWidth={2} color="var(--color-brand-navy)" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
            >
              <Download size={18} strokeWidth={2} color="var(--color-brand-navy)" />
              Export
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <div className="overflow-hidden rounded-xl border border-dashed border-zinc-300">
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <DocumentText size={18} variant="Outline" color="currentColor" />
                      CSV
                    </button>
                    <button type="button" onClick={() => setExportOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-primary-text transition-colors hover:bg-zinc-50">
                      <Document size={18} variant="Outline" color="currentColor" />
                      PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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
              <th className="h-11 w-32 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.role}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.dateOnboarded}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <button type="button" className="text-[13px] font-bold text-primary-text underline underline-offset-4 hover:text-brand-navy transition-colors">
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
    </>
  );
}
