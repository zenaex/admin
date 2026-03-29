"use client";

import React, { useMemo, useState } from "react";
import { Import, Sort, More, Add, People, Setting2, Chart, ShieldTick, Headphone, Code1, Notification, SearchNormal1 } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";

/* ── Tab config ── */
type AdminTab = "Team" | "Roles & Permission" | "Pending Invites";
const TABS: AdminTab[] = ["Team", "Roles & Permission", "Pending Invites"];

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
  const [activeTab, setActiveTab] = useState<AdminTab>("Team");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_MEMBERS;
    return ALL_MEMBERS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
    );
  }, [search]);

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
            <button type="button" className="relative hover:text-primary-text transition-colors">
              <Notification size={24} variant="Outline" color="currentColor" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[9px] font-bold text-white">
                2
              </span>
            </button>
            <button type="button" className="hover:text-primary-text transition-colors">
              <Setting2 size={24} variant="Outline" color="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <UnderlineTabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
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
          {/* Toolbar */}
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
              >
                <Sort size={18} variant="Outline" color="var(--color-brand-navy)" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle"
              >
                <Import size={18} variant="Outline" color="var(--color-brand-navy)" />
                Export
              </button>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                <Add size={18} variant="Outline" color="currentColor" />
                Add Employee
              </button>
            </div>
          </div>

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
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-outline hover:text-zinc-600"
                        aria-label={`Actions for ${row.name}`}
                      >
                        <More size={18} variant="Outline" color="currentColor" className="rotate-90" />
                      </button>
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

      {activeTab === "Pending Invites" && (
        <PendingInvitesTab />
      )}
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

function RolesPermissionTab() {
  const [roleSearch, setRoleSearch] = useState("");

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return ROLES;
    return ROLES.filter((r) => r.name.toLowerCase().includes(q));
  }, [roleSearch]);

  return (
    <>
      {/* Toolbar */}
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
          <button type="button" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle" aria-label="Filter">
            <Sort size={18} variant="Outline" color="var(--color-brand-navy)" />
          </button>
          <button type="button" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle">
            <Import size={18} variant="Outline" color="var(--color-brand-navy)" />
            Export
          </button>
          <button type="button" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90">
            <Add size={18} variant="Outline" color="currentColor" />
            Role
          </button>
        </div>
      </div>

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

/* ── Pending Invites tab ── */
function PendingInvitesTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const pendingMembers = useMemo(() => ALL_MEMBERS.filter(m => m.status === "Pending"), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendingMembers;
    return pendingMembers.filter(
      (m) => m.email.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
    );
  }, [search, pendingMembers]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  return (
    <>
      {/* Toolbar */}
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
          <button type="button" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-surface-subtle" aria-label="Filter">
            <Sort size={18} variant="Outline" color="var(--color-brand-navy)" />
          </button>
          <button type="button" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-surface-subtle">
            <Import size={18} variant="Outline" color="var(--color-brand-navy)" />
            Export
          </button>
        </div>
      </div>

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
