"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Add, People, Setting2, Chart, ShieldTick, Headphone, Code1 } from "iconsax-react";
import { ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import {
  DeleteRoleModal,
  RoleFormModal,
  RolePermissionsModal,
  useDeleteRole,
} from "@/components/user-mgt/admin-role-modals";
import { ErrorAlert } from "@/components/ui/error-alert";
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
import { getAdminRoleMembers, getAdminRolesList } from "@/lib/admin-api/roles-api";
import type { AdminRoleListItem, AdminRoleMemberPreview, AdminRoleUpsertBody } from "@/lib/admin-api/types";
import { SuccessModal } from "@/components/provider/provider-modals";

type RoleExportRow = { name: string; members: number; description: string };

const ROLE_EXPORT_COLUMNS: ExportColumn<RoleExportRow>[] = [
  { header: "Role", value: (r) => r.name },
  { header: "Members", value: (r) => String(r.members) },
  { header: "Description", value: (r) => r.description },
];

function roleIconNode(icon: string) {
  const k = icon.toLowerCase().replace(/[_\s-]/g, "");
  const props = { size: 22 as const, variant: "Outline" as const, color: "currentColor" };
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
};

export function AdminRolesTab({ canManage, onRolesChanged }: AdminRolesTabProps) {
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
    } catch (e) {
      setRoles([]);
      setLoadError(e instanceof AdminApiError ? e.message : "Could not load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const { target: deleteTarget, setTarget: setDeleteTarget, loading: deleteLoading, error: deleteError, setError: setDeleteError, confirmDelete } =
    useDeleteRole(() => {
      setSuccessMessage("Role deleted.");
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
        <div className="mt-6 flex h-14 items-center gap-2 rounded-xl bg-white px-3 sm:px-4">
          <span className="shrink-0 text-[15px] font-semibold text-primary-text">
            Roles &amp; Permission ({loading ? "…" : roles.length})
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
            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  setEditRole(null);
                  setFormMode("create");
                }}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                <Add size={18} variant="Outline" color="currentColor" />
                Role
              </button>
            ) : null}
          </div>
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-zinc-500">Loading roles…</p>
      ) : filteredRoles.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">No roles found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onSeePermissions={() => setPermissionsRole(role)}
            />
          ))}
        </div>
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
}: {
  role: RoleCardData;
  onSeePermissions: () => void;
}) {
  const memberCount = role.memberCount > 0 ? role.memberCount : role.memberPreviews.length;
  const previews =
    role.memberPreviews.length > 0
      ? role.memberPreviews
      : [];

  return (
    <div className="rounded-xl border border-outline bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-outline text-zinc-500">
            {roleIconNode(role.icon)}
          </span>
          <span className="text-[15px] font-semibold text-primary-text">
            {role.name}
            {role.isSystem ? (
              <span className="ml-2 text-xs font-normal text-zinc-400">System</span>
            ) : null}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {previews.length > 0 ? (
            <div className="flex -space-x-2">
              {previews.map((m) => (
                <span
                  key={m.id}
                  title={m.name}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-profile-picture text-[10px] font-semibold text-blue-grey"
                >
                  {m.initials}
                </span>
              ))}
            </div>
          ) : null}
          <span className="text-xs text-zinc-400">
            {memberCount} Member{memberCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-500">{role.description}</p>

      <button
        type="button"
        onClick={onSeePermissions}
        className="mt-3 text-sm font-semibold text-brand-navy underline underline-offset-2 hover:opacity-80"
      >
        See Permissions
      </button>
    </div>
  );
}
