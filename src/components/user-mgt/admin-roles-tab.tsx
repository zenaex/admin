"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Add, People, Setting2, Chart, ShieldTick, Headphone, Code1, ArrowLeft2, ArrowDown2, Edit2, ArrowRight2 } from "iconsax-react";
import { ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import {
  DeleteRoleModal,
  RoleFormModal,
  RolePermissionsModal,
  useDeleteRole,
} from "@/components/user-mgt/admin-role-modals";
import { ErrorAlert } from "@/components/ui/error-alert";
import { InputField } from "@/components/input-field";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import type { ExportColumn } from "@/lib/export/table-export";
import { exportClientTable } from "@/lib/export/export-handlers";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  getAdminRoleMembers,
  getAdminRolesList,
  getAdminPermissionsCatalog,
  getAdminRoleDetail,
  getAdminRolePermissionKeys,
  putAdminRole,
} from "@/lib/admin-api/roles-api";
import { getAdminTeamList } from "@/lib/admin-api/team-api";
import type {
  AdminPermissionModule,
  AdminRoleListItem,
  AdminRoleMemberPreview,
  AdminRoleUpsertBody,
  AdminTeamMember,
} from "@/lib/admin-api/types";
import { SuccessModal } from "@/components/provider/provider-modals";

type RoleExportRow = { name: string; members: number; description: string };

const ROLE_EXPORT_COLUMNS: ExportColumn<RoleExportRow>[] = [
  { header: "Role", value: (r) => r.name },
  { header: "Members", value: (r) => String(r.members) },
  { header: "Description", value: (r) => r.description },
];

const SlidersHorizontalIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" y1="4" x2="14" y2="4" />
    <line x1="10" y1="4" x2="3" y2="4" />
    <line x1="21" y1="12" x2="12" y2="12" />
    <line x1="8" y1="12" x2="3" y2="12" />
    <line x1="21" y1="20" x2="16" y2="20" />
    <line x1="12" y1="20" x2="3" y2="20" />
    <line x1="14" y1="2" x2="14" y2="6" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="16" y1="18" x2="16" y2="22" />
  </svg>
);

function getAvatarStyle(index: number) {
  const styles = [
    { bg: "bg-[#FFF0F2]", text: "text-[#FF6A6C]" }, // pink/coral
    { bg: "bg-[#EEF4FF]", text: "text-[#3C8EFF]" }, // blue
    { bg: "bg-[#F4FAEB]", text: "text-[#82C341]" }, // green/lime
  ];
  return styles[index % styles.length];
}

function roleIconNode(icon: string) {
  const k = icon.toLowerCase().replace(/[_\s-]/g, "");
  const props = { size: 24 as const, variant: "Outline" as const, color: "currentColor" };
  if (k.includes("people") || k.includes("super")) return <People {...props} />;
  if (k.includes("chart") || k.includes("operation")) return <Chart {...props} />;
  if (k.includes("shield") || k.includes("compliance")) return <ShieldTick {...props} />;
  if (k.includes("headphone") || k.includes("customer")) return <Headphone {...props} />;
  if (k.includes("code") || k.includes("tech")) return <Code1 {...props} />;
  return <Setting2 {...props} />;
}

type RoleCardData = AdminRoleListItem & {
  memberPreviews: AdminRoleMemberPreview[];
};

type AdminRolesTabProps = {
  canManage: boolean;
  onRolesChanged?: () => void;
  onSelectionChange?: (hasSelected: boolean) => void;
};

export function AdminRolesTab({ canManage, onRolesChanged, onSelectionChange }: AdminRolesTabProps) {
  const [roles, setRoles] = useState<RoleCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [roleSearch, setRoleSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "role">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"role">(openFilter, filterMode);

  const [draftRoleTemplate, setDraftRoleTemplate] = useState("All templates");
  const [appliedRoleTemplate, setAppliedRoleTemplate] = useState<string | null>(null);

  const [permissionsRole, setPermissionsRole] = useState<AdminRoleListItem | null>(null);
  const [formMode, setFormMode] = useState<null | "create" | "edit">(null);
  const [editRole, setEditRole] = useState<AdminRoleListItem | null>(null);

  // Selected role detail view state
  const [selectedRole, setSelectedRole] = useState<RoleCardData | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<"members" | "permissions">("members");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    onSelectionChange?.(!!selectedRole);
  }, [selectedRole, onSelectionChange]);

  const loadRoles = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const list = await getAdminRolesList();
      const withMembers = await Promise.all(
        list.map(async (role) => {
          try {
            const members = await getAdminRoleMembers(role.id);
            return { ...role, memberPreviews: members.slice(0, 3) };
          } catch {
            return { ...role, memberPreviews: [] as AdminRoleMemberPreview[] };
          }
        }),
      );
      setRoles(withMembers);

      // Keep selectedRole synced if it was updated
      if (selectedRole) {
        const updated = withMembers.find((r) => r.id === selectedRole.id);
        if (updated) {
          setSelectedRole(updated);
        }
      }
    } catch (e) {
      setRoles([]);
      setLoadError(e instanceof AdminApiError ? e.message : "Could not load roles.");
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    void loadRoles();
  }, []); // Only fetch on mount, loadRoles will sync selectedRole inside itself if needed

  const { target: deleteTarget, setTarget: setDeleteTarget, loading: deleteLoading, error: deleteError, setError: setDeleteError, confirmDelete } =
    useDeleteRole(() => {
      setSuccessMessage("Role deleted.");
      if (selectedRole && deleteTarget && selectedRole.id === deleteTarget.id) {
        setSelectedRole(null);
      }
      void loadRoles();
      onRolesChanged?.();
    });

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

  const roleTemplateFilter = useMemo(
    () => ["All templates", ...roles.map((r) => r.name)],
    [roles],
  );

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    return roles.filter((r) => {
      if (appliedRoleTemplate && appliedRoleTemplate !== "All templates" && r.name !== appliedRoleTemplate)
        return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [roleSearch, appliedRoleTemplate, roles]);

  const runRoleExport = (format: "csv" | "json" | "pdf") => {
    const rows: RoleExportRow[] = filteredRoles.map((r) => ({
      name: r.name,
      members: r.memberCount > 0 ? r.memberCount : r.memberPreviews.length,
      description: r.description,
    }));
    exportClientTable("admin-roles", format, rows, ROLE_EXPORT_COLUMNS);
  };

  const openEdit = (role: AdminRoleListItem) => {
    setPermissionsRole(null);
    setEditRole(role);
    setFormMode("edit");
  };

  const editInitial: AdminRoleUpsertBody | undefined = editRole
    ? {
        name: editRole.name,
        description: editRole.description === "—" ? "" : editRole.description,
        icon: editRole.icon,
        permissionKeys: [],
      }
    : undefined;

  return (
    <>
      {loadError ? (
        <ErrorAlert className="mt-4" error={loadError} onRetry={() => void loadRoles()} />
      ) : null}
      {deleteError ? (
        <ErrorAlert className="mt-4" error={deleteError} onRetry={() => setDeleteError(null)} />
      ) : null}

      {selectedRole ? (
        isEditing ? (
          <EditRoleView
            role={selectedRole}
            onBack={() => {
              setIsEditing(false);
              setSelectedRole(null);
            }}
            onCancel={() => setIsEditing(false)}
            onSaved={(updatedRole) => {
              setIsEditing(false);
              setSelectedRole(updatedRole);
              void loadRoles();
            }}
          />
        ) : (
          <RoleDetailView
            key={selectedRole.id}
            role={selectedRole}
            canManage={canManage}
            initialTab={initialDetailTab}
            onBack={() => setSelectedRole(null)}
            onEdit={() => setIsEditing(true)}
            onDelete={() => setDeleteTarget(selectedRole)}
          />
        )
      ) : filterMode ? (
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
                  options={roleTemplateFilter}
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
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6 flex-1">
            <span className="shrink-0 text-[18px] font-semibold text-primary-text">
              Roles &amp; Permission ({loading ? "…" : roles.length})
            </span>
            <div className="w-[360px] max-w-full">
              <AuditTrailIconSearch
                variant="toolbar"
                placeholder="Search by Name or ID"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                wrapperClassName="border border-zinc-200 bg-white rounded-lg px-3.5 h-11"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition-opacity hover:opacity-80"
              onClick={() => {
                setRoleSearch("");
                setFilterMode(true);
              }}
            >
              <SlidersHorizontalIcon size={18} />
              <span>Filter</span>
            </button>
            <TableExportMenu
              disabled={filteredRoles.length === 0}
              onExportCsv={() => runRoleExport("csv")}
              onExportPdf={() => runRoleExport("pdf")}
              onExportJson={() => runRoleExport("json")}
              triggerClassName="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition-opacity hover:opacity-80 bg-transparent border-none p-0 shadow-none outline-none"
            />
            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  setEditRole(null);
                  setFormMode("create");
                }}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-primary-green px-5 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-hover-green"
              >
                <Add size={16} variant="Outline" color="currentColor" />
                Role
              </button>
            ) : null}
          </div>
        </div>
      )}

      {!selectedRole && (
        <>
          {loading ? (
            <p className="mt-8 text-sm text-zinc-500">Loading roles…</p>
          ) : filteredRoles.length === 0 ? (
            <p className="mt-8 text-sm text-zinc-500">No roles found.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               {filteredRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onSeePermissions={() => {
                    setInitialDetailTab("permissions");
                    setSelectedRole(role);
                  }}
                  onClick={() => {
                    setInitialDetailTab("members");
                    setSelectedRole(role);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {permissionsRole ? (
        <RolePermissionsModal
          role={permissionsRole}
          canManage={canManage}
          onClose={() => setPermissionsRole(null)}
          onEdit={() => openEdit(permissionsRole)}
          onDelete={() => {
            setPermissionsRole(null);
            setDeleteTarget(permissionsRole);
          }}
        />
      ) : null}

      {formMode === "create" ? (
        <RoleFormModal
          mode="create"
          onClose={() => setFormMode(null)}
          onSaved={() => {
            setSuccessMessage("Role created.");
            void loadRoles();
            onRolesChanged?.();
          }}
        />
      ) : null}

      {formMode === "edit" && editRole ? (
        <RoleFormModal
          mode="edit"
          roleId={editRole.id}
          initial={editInitial}
          isSystem={editRole.isSystem}
          onClose={() => {
            setFormMode(null);
            setEditRole(null);
          }}
          onSaved={() => {
            setSuccessMessage("Role updated.");
            void loadRoles();
            // If the edited role is currently selected, refresh its details!
            if (selectedRole && editRole && selectedRole.id === editRole.id) {
              getAdminRoleDetail(selectedRole.id).then((d) => {
                if (d) {
                  setSelectedRole((prev) => prev ? { ...prev, name: d.name, description: d.description, icon: d.icon } : null);
                }
              });
            }
            onRolesChanged?.();
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteRoleModal
          role={deleteTarget}
          loading={deleteLoading}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}

      {successMessage ? (
        <SuccessModal
          message={successMessage}
          confirmLabel="Done"
          onContinue={() => setSuccessMessage(null)}
        />
      ) : null}
    </>
  );
}

function RoleCard({
  role,
  onSeePermissions,
  onClick,
}: {
  role: RoleCardData;
  onSeePermissions: () => void;
  onClick: () => void;
}) {
  const memberCount = role.memberCount > 0 ? role.memberCount : role.memberPreviews.length;
  const previews =
    role.memberPreviews.length > 0
      ? role.memberPreviews
      : [];

  return (
    <div
      onClick={onClick}
      className="rounded-[20px] border border-[#E8EBEE] bg-white p-6 shadow-sm cursor-pointer hover:border-zinc-300 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F0F2F4] text-zinc-600">
            {roleIconNode(role.icon)}
          </span>
          <span className="text-[18px] font-semibold text-[#0A0A0A] flex items-center gap-2">
            {role.name}
            {role.isSystem ? (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-normal text-zinc-500">
                System
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          {previews.length > 0 ? (
            <div className="flex -space-x-1.5">
              {previews.map((m, idx) => {
                const style = getAvatarStyle(idx);
                return (
                  <span
                    key={m.id}
                    title={m.name}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold ${style.bg} ${style.text}`}
                  >
                    {m.initials}
                  </span>
                );
              })}
            </div>
          ) : null}
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
            {memberCount} Member{memberCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <p className="mt-6 text-[15px] leading-[1.5] text-[#6B6B6B] min-h-[44px]">{role.description}</p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSeePermissions();
        }}
        className="mt-6 text-[15px] font-semibold text-secondary-green underline underline-offset-4 hover:opacity-80 transition-opacity"
      >
        See Permissions
      </button>
    </div>
  );
}

function ActionDropdown({
  onEdit,
  onDelete,
  isSystem,
}: {
  onEdit: () => void;
  onDelete: () => void;
  isSystem: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-[#0A0A0A] hover:bg-zinc-50 transition-colors"
      >
        <span>Action</span>
        <ArrowDown2 size={14} variant="Outline" color="currentColor" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center px-4 py-2.5 text-sm text-[#0A0A0A] hover:bg-zinc-50 transition-colors text-left"
            >
              Edit role
            </button>
            {!isSystem && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                Delete role
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type RoleDetailViewProps = {
  role: RoleCardData;
  canManage: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  initialTab?: "members" | "permissions";
};

export function RoleDetailView({
  role,
  canManage,
  onBack,
  onEdit,
  onDelete,
  initialTab = "members",
}: RoleDetailViewProps) {
  const [detailTab, setDetailTab] = useState<"members" | "permissions">(initialTab);
  const [expandedModules, setExpandedModules] = useState<string[]>(["User Management"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [teamMembers, setTeamMembers] = useState<AdminTeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(18);

  const [catalog, setCatalog] = useState<AdminPermissionModule[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const toggleModule = (moduleName: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName],
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMembers(true);
      try {
        const res = await getAdminTeamList();
        if (!cancelled) {
          setTeamMembers(res.items);
        }
      } catch (err) {
        console.error("Failed to load team members", err);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingPermissions(true);
      try {
        const [modules, detail, keys] = await Promise.all([
          getAdminPermissionsCatalog(),
          getAdminRoleDetail(role.id),
          getAdminRolePermissionKeys(role.id),
        ]);
        if (cancelled) return;
        setCatalog(modules);
        const merged = detail?.permissionKeys.length ? detail.permissionKeys : keys;
        setAssigned(merged);
      } catch (err) {
        console.error("Failed to load permissions", err);
      } finally {
        if (!cancelled) setLoadingPermissions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role.id]);

  const assignedSet = useMemo(() => new Set(assigned), [assigned]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const roleSpecific = teamMembers.filter((m) => {
      const roleIdMatch = m.roleId === role.id;
      const roleNameMatch = m.role.toLowerCase() === role.name.toLowerCase();
      return roleIdMatch || roleNameMatch;
    });

    if (!q) return roleSpecific;
    return roleSpecific.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  }, [teamMembers, memberSearch, role.id, role.name]);

  const paginatedMembers = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));
    const safePage = Math.min(memberPage, totalPages);
    return filteredMembers.slice((safePage - 1) * memberPageSize, safePage * memberPageSize);
  }, [filteredMembers, memberPage, memberPageSize]);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[#E8EBEE] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-primary-text hover:underline font-semibold"
          >
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Roles &amp; Permission
          </button>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text font-semibold">{role.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text hover:bg-surface-subtle transition-colors"
              >
                Action
                <ArrowDown2 size={12} variant="Outline" color="currentColor" />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onEdit();
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-[#0A0A0A] hover:bg-zinc-50 transition-colors text-left font-semibold"
                    >
                      Edit role &amp; permission
                    </button>
                    {!role.isSystem && (
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onDelete();
                        }}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                      >
                        Delete role
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-zinc-200">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setDetailTab("members")}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              detailTab === "members" ? "text-[#0A0A0A]" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Team Members
            {detailTab === "members" && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-secondary-green" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDetailTab("permissions")}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              detailTab === "permissions" ? "text-[#0A0A0A]" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Permission
            {detailTab === "permissions" && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-secondary-green" />
            )}
          </button>
        </div>
      </div>

      {detailTab === "members" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-primary-text">
              Members ({filteredMembers.length})
            </span>
            <div className="w-[320px]">
              <AuditTrailIconSearch
                variant="toolbar"
                placeholder="Search by Name or ID"
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setMemberPage(1);
                }}
                wrapperClassName="border border-zinc-200 bg-white rounded-lg px-3.5 h-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-[8px] border border-outline bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#F7F7F7] text-xs text-zinc-400">
                  <th className="h-11 px-4 py-0 font-medium align-middle">Employee Name</th>
                  <th className="h-11 px-4 py-0 font-medium align-middle">Email</th>
                  <th className="h-11 px-4 py-0 font-medium align-middle">Date Onboarded</th>
                </tr>
              </thead>
              <tbody>
                {loadingMembers ? (
                  <tr>
                    <td colSpan={3} className="h-32 text-center text-sm text-zinc-500">
                      Loading members…
                    </td>
                  </tr>
                ) : paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="h-32 text-center text-sm text-zinc-500">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((m) => {
                    const formattedDate = m.dateOnboarded.replace(", ", " | ");
                    return (
                      <tr key={m.id} className="transition-colors hover:bg-zinc-50">
                        <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E9EDF0] text-xs font-semibold text-blue-grey">
                              {m.name
                                .split(" ")
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                            <span className="text-sm font-semibold text-[#0A0A0A]">{m.name}</span>
                          </div>
                        </td>
                        <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                          {m.email}
                        </td>
                        <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <AuditTrailPagination
            page={memberPage}
            pageSize={memberPageSize}
            totalItems={filteredMembers.length}
            onPageChange={(p) => setMemberPage(p)}
            onPageSizeChange={(size) => {
              setMemberPageSize(size);
              setMemberPage(1);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-[16px] font-bold text-primary-text">
            Permissions
          </h2>
          <div className="rounded-[20px] border border-[#E8EBEE] bg-white overflow-hidden shadow-sm">
            {loadingPermissions ? (
              <p className="text-sm text-zinc-500 p-6">Loading permissions…</p>
            ) : catalog.length === 0 ? (
              <p className="text-sm text-zinc-500 p-6">No permissions found.</p>
            ) : (
              catalog.map((mod) => {
                const expanded = expandedModules.includes(mod.module);
                const visible = mod.permissions.filter((p) => assignedSet.has(p.key));

                return (
                  <div key={mod.module} className="border-b border-[#E8EBEE] last:border-b-0">
                    <div
                      onClick={() => toggleModule(mod.module)}
                      className="h-14 flex items-center justify-between cursor-pointer px-6 hover:bg-zinc-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-primary-text">{mod.module}</span>
                      <span className={`text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
                        <ArrowDown2 size={16} variant="Outline" color="currentColor" />
                      </span>
                    </div>

                    {expanded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6 py-6 pl-10 pr-6 border-t border-[#E8EBEE] bg-white">
                        {visible.length === 0 ? (
                          <span className="col-span-full text-sm text-zinc-400 font-normal">
                            No permissions assigned.
                          </span>
                        ) : (
                          visible.map((p) => (
                            <div key={p.key} className="flex items-start gap-2 text-[13px] text-zinc-500">
                              <span className="text-zinc-300 font-bold select-none text-[16px] leading-none mt-0.5">•</span>
                              <span className="font-medium text-[13px] text-zinc-600 leading-tight">{p.label}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type EditRoleViewProps = {
  role: RoleCardData;
  onBack: () => void;
  onCancel: () => void;
  onSaved: (updatedRole: RoleCardData) => void;
};

export function EditRoleView({ role, onBack, onCancel, onSaved }: EditRoleViewProps) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description === "—" ? "" : role.description);
  const [icon, setIcon] = useState(role.icon);
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<AdminPermissionModule[]>([]);
  const [teamMembers, setTeamMembers] = useState<AdminTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(["User Management"]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [modules, detail, keys, team] = await Promise.all([
          getAdminPermissionsCatalog(),
          getAdminRoleDetail(role.id),
          getAdminRolePermissionKeys(role.id),
          getAdminTeamList(),
        ]);
        if (cancelled) return;
        setCatalog(modules);
        const mergedKeys = detail?.permissionKeys.length ? detail.permissionKeys : keys;
        setPermissionKeys(mergedKeys);
        setTeamMembers(team.items);
        if (detail) {
          setName(detail.name);
          setDescription(detail.description === "—" ? "" : detail.description);
          setIcon(detail.icon);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof AdminApiError ? err.message : "Failed to load data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role.id]);

  const employeesInRole = useMemo(() => {
    return teamMembers.filter((m) => {
      const roleIdMatch = m.roleId === role.id;
      const roleNameMatch = m.role.toLowerCase() === role.name.toLowerCase();
      return roleIdMatch || roleNameMatch;
    });
  }, [teamMembers, role.id, role.name]);

  const toggleModuleExpansion = (moduleName: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const toggleCategory = (mod: AdminPermissionModule) => {
    const keys = mod.permissions.map((p) => p.key);
    const allChecked = keys.every((k) => permissionKeys.includes(k));
    if (allChecked) {
      setPermissionKeys((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setPermissionKeys((prev) => {
        const next = [...prev];
        keys.forEach((k) => {
          if (!next.includes(k)) next.push(k);
        });
        return next;
      });
    }
  };

  const isCategoryAllChecked = (mod: AdminPermissionModule) => {
    if (mod.permissions.length === 0) return false;
    return mod.permissions.map((p) => p.key).every((k) => permissionKeys.includes(k));
  };

  const togglePermission = (key: string) => {
    setPermissionKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body: AdminRoleUpsertBody = {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim(),
        permissionKeys,
      };
      await putAdminRole(role.id, body);
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  const AVATAR_OPTIONS = [
    { key: "people", icon: <People size={20} variant="Outline" color="currentColor" /> },
    { key: "compliance", icon: <ShieldTick size={20} variant="Outline" color="currentColor" /> },
    { key: "setting2", icon: <Setting2 size={20} variant="Outline" color="currentColor" /> },
    { key: "operation", icon: <Chart size={20} variant="Outline" color="currentColor" /> },
    { key: "customer", icon: <Headphone size={20} variant="Outline" color="currentColor" /> },
    { key: "tech", icon: <Code1 size={20} variant="Outline" color="currentColor" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[#E8EBEE] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-primary-text hover:underline font-semibold"
          >
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            {role.name}
          </button>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text font-semibold">Edit Roles &amp; Permission</span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 py-6">Loading details…</p>
      ) : (
        <form onSubmit={(e) => void handleSave(e)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Form Details */}
          <div className="space-y-6 max-w-lg">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <InputField
              id="edit-role-name"
              label="Role"
              value={name}
              disabled={role.isSystem || saving}
              onChange={(e) => setName(e.target.value)}
              className="h-12 border border-zinc-200 focus:border-zinc-400 bg-white"
            />

            <div>
              <label htmlFor="edit-role-desc" className="mb-2 block text-xs font-semibold text-[#6B6B6B]">
                Description
              </label>
              <textarea
                id="edit-role-desc"
                rows={5}
                value={description}
                disabled={saving}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Role description..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[15px] font-medium text-[#0A0A0A] outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-xs font-semibold text-[#6B6B6B]">
                Change Avatar
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {AVATAR_OPTIONS.map((opt) => {
                  const isSelected = icon.toLowerCase().replace(/[_\s-]/g, "") === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={saving}
                      onClick={() => setIcon(opt.key)}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? "border-primary-green bg-[#F7FBE6] text-[#0A0A0A] ring-2 ring-primary-green/20"
                          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                      }`}
                    >
                      {opt.icon}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-zinc-400 font-medium">
                Tap{" "}
                <button type="button" className="text-secondary-green underline font-bold hover:opacity-85">
                  here
                </button>{" "}
                to upload custom Image
              </p>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold text-[#6B6B6B]">
                Employee in this role
              </p>
              {employeesInRole.length === 0 ? (
                <p className="text-xs text-zinc-400 font-medium">No employees assigned to this role.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {employeesInRole.map((m) => {
                    const initials = m.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={m.id}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 py-1.5 pl-1.5 pr-3 text-xs font-semibold text-[#0A0A0A]"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E9EDF0] text-[9px] font-bold text-blue-grey">
                          {initials}
                        </span>
                        <span>{m.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="edit-role-add-team" className="mb-2 block text-xs font-semibold text-[#6B6B6B]">
                Add team
              </label>
              <input
                id="edit-role-add-team"
                type="text"
                readOnly
                value={name}
                className="w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-[15px] font-semibold text-[#0a0a0a] outline-none cursor-default"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full h-12 rounded-full bg-primary-green text-[15px] font-bold text-[#0A0A0A] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving Changes..." : "Save Edit"}
              </button>
            </div>
          </div>

          {/* Right Column: Permissions Accordion */}
          <div className="space-y-4">
            <div>
              <h3 className="text-[16px] font-bold text-primary-text">Permissions</h3>
              <p className="text-xs text-zinc-400 font-medium mt-1">All available permission for this role</p>
            </div>

            <div className="rounded-[20px] border border-[#E8EBEE] bg-white overflow-hidden shadow-sm">
              {catalog.length === 0 ? (
                <p className="text-sm text-zinc-500 p-6">No permissions available.</p>
              ) : (
                catalog.map((mod) => {
                  const expanded = expandedModules.includes(mod.module);
                  const isChecked = isCategoryAllChecked(mod);

                  return (
                    <div key={mod.module} className="border-b border-[#E8EBEE] last:border-b-0">
                      <div className="h-14 flex items-center justify-between px-6 bg-white transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={saving}
                            onChange={() => toggleCategory(mod)}
                            className="h-4 w-4 rounded border-zinc-300 accent-secondary-green text-secondary-green focus:ring-secondary-green/20 cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-primary-text">{mod.module}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleModuleExpansion(mod.module)}
                          className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                        >
                          <span className={`inline-block transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
                            <ArrowDown2 size={16} variant="Outline" color="currentColor" />
                          </span>
                        </button>
                      </div>

                      {expanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 py-6 pl-10 pr-6 border-t border-[#E8EBEE] bg-zinc-50/50">
                          {mod.permissions.length === 0 ? (
                            <span className="col-span-full text-sm text-zinc-400 font-normal">
                              No sub-permissions.
                            </span>
                          ) : (
                            mod.permissions.map((p) => {
                              const isPermChecked = permissionKeys.includes(p.key);
                              return (
                                <label key={p.key} className="flex items-start gap-2.5 text-xs text-zinc-600 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isPermChecked}
                                    disabled={saving}
                                    onChange={() => togglePermission(p.key)}
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 accent-secondary-green text-secondary-green focus:ring-secondary-green/20 cursor-pointer"
                                  />
                                  <span className="font-medium text-[13px] text-zinc-600 leading-tight">
                                    {p.label}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>
      )}

      {showSuccess && (
        <SuccessModal
          message="Roles and permission has been updated"
          confirmLabel="Continue"
          onContinue={() => {
            setShowSuccess(false);
            const updated: RoleCardData = {
              ...role,
              name: name.trim(),
              description: description.trim(),
              icon: icon.trim(),
            };
            onSaved(updated);
          }}
        />
      )}
    </div>
  );
}
