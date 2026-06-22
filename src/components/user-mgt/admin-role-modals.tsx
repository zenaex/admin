"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CloseCircle } from "iconsax-react";
import { ConfirmModal } from "@/components/provider/provider-modals";
import { InputField } from "@/components/input-field";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  deleteAdminRole,
  getAdminPermissionsCatalog,
  getAdminRoleDetail,
  getAdminRolePermissionKeys,
  postAdminRole,
  putAdminRole,
} from "@/lib/admin-api/roles-api";
import type { AdminPermissionModule, AdminRoleListItem, AdminRoleUpsertBody } from "@/lib/admin-api/types";

const ROLE_ICON_OPTIONS = [
  { value: "people", label: "People" },
  { value: "setting2", label: "Settings" },
  { value: "chart", label: "Operations" },
  { value: "shield", label: "Compliance" },
  { value: "headphone", label: "Customer care" },
  { value: "code", label: "Tech support" },
] as const;

type RoleFormModalProps = {
  mode: "create" | "edit";
  roleId?: string;
  initial?: AdminRoleUpsertBody;
  isSystem?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function RoleFormModal({
  mode,
  roleId,
  initial,
  isSystem,
  onClose,
  onSaved,
}: RoleFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? ROLE_ICON_OPTIONS[0].value);
  const [permissionKeys, setPermissionKeys] = useState<string[]>(initial?.permissionKeys ?? []);
  const [catalog, setCatalog] = useState<AdminPermissionModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [modules, detailKeys] = await Promise.all([
          getAdminPermissionsCatalog(),
          mode === "edit" && roleId
            ? getAdminRoleDetail(roleId).then(async (d) => {
                if (d?.permissionKeys.length) return d.permissionKeys;
                return getAdminRolePermissionKeys(roleId);
              })
            : Promise.resolve(initial?.permissionKeys ?? []),
        ]);
        if (cancelled) return;
        setCatalog(modules);
        if (mode === "edit" && detailKeys.length > 0) setPermissionKeys(detailKeys);
        if (initial && mode === "edit") {
          setName(initial.name);
          setDescription(initial.description);
          setIcon(initial.icon);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof AdminApiError ? e.message : "Could not load permissions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, roleId, initial]);

  const toggleKey = (key: string) => {
    setPermissionKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const body: AdminRoleUpsertBody = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim() || ROLE_ICON_OPTIONS[0].value,
      permissionKeys,
    };
    try {
      if (mode === "create") {
        await postAdminRole(body);
      } else if (roleId) {
        await putAdminRole(roleId, body);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not save role.");
    } finally {
      setSaving(false);
    }
  };

  const nameDisabled = Boolean(isSystem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-brand-navy">
            {mode === "create" ? "Create role" : "Edit role"}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600" aria-label="Close">
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            {isSystem ? (
              <p className="text-xs text-amber-700">
                System role: name cannot be changed. You may still update description, icon, and permissions if allowed.
              </p>
            ) : null}

            <InputField
              id="role-name"
              label="Name"
              value={name}
              disabled={nameDisabled || saving}
              onChange={(ev) => setName(ev.target.value)}
            />
            <div>
              <label htmlFor="role-desc" className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Description
              </label>
              <textarea
                id="role-desc"
                rows={3}
                value={description}
                disabled={saving}
                onChange={(e) => setDescription(e.target.value)}
                className="text-primary-text w-full resize-none rounded-md border border-secondary-green/25 bg-white px-3 py-2 text-sm outline-none focus:border-secondary-green"
              />
            </div>
            <div>
              <label htmlFor="role-icon" className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Icon
              </label>
              <select
                id="role-icon"
                value={icon}
                disabled={saving}
                onChange={(e) => setIcon(e.target.value)}
                className="text-primary-text h-10 w-full rounded-md border border-secondary-green/25 bg-white px-3 text-sm outline-none focus:border-secondary-green"
              >
                {ROLE_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-primary-text">Permissions</p>
              <div className="max-h-64 space-y-4 overflow-y-auto rounded-xl border border-outline p-3">
                {catalog.length === 0 ? (
                  <p className="text-sm text-zinc-500">No permissions available.</p>
                ) : (
                  catalog.map((mod) => (
                    <div key={mod.module}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{mod.module}</p>
                      <ul className="space-y-2">
                        {mod.permissions.map((perm) => (
                          <li key={perm.key}>
                            <label className="flex cursor-pointer items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 accent-secondary-green text-secondary-green focus:ring-secondary-green/20 cursor-pointer"
                                checked={permissionKeys.includes(perm.key)}
                                disabled={saving}
                                onChange={() => toggleKey(perm.key)}
                              />
                              <span>
                                <span className="font-medium text-primary-text">{perm.label}</span>
                                {perm.description ? (
                                  <span className="mt-0.5 block text-xs text-zinc-500">{perm.description}</span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="flex-1 rounded-full bg-outline py-3 text-sm font-semibold text-primary-text hover:bg-zinc-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : mode === "create" ? "Create role" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

type RolePermissionsModalProps = {
  role: AdminRoleListItem;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function RolePermissionsModal({
  role,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: RolePermissionsModalProps) {
  const [catalog, setCatalog] = useState<AdminPermissionModule[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
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
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof AdminApiError ? e.message : "Could not load permissions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role.id]);

  const assignedSet = useMemo(() => new Set(assigned), [assigned]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-brand-navy">{role.name} — permissions</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600" aria-label="Close">
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto">
            {catalog.map((mod) => {
              const visible = mod.permissions.filter((p) => assignedSet.has(p.key));
              if (visible.length === 0) return null;
              return (
                <div key={mod.module}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{mod.module}</p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600">
                    {visible.map((p) => (
                      <li key={p.key}>{p.label}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {assigned.length === 0 ? <p className="text-sm text-zinc-500">No permissions assigned.</p> : null}
          </div>
        )}

        {canManage ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full bg-primary-green px-5 py-2.5 text-sm font-semibold text-primary-text hover:opacity-90"
            >
              Edit role
            </button>
            {!role.isSystem ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete role
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-outline px-5 py-2.5 text-sm font-semibold text-primary-text hover:bg-zinc-200"
            >
              Close
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-outline py-3 text-sm font-semibold text-primary-text hover:bg-zinc-200"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

type DeleteRoleModalProps = {
  role: AdminRoleListItem;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteRoleModal({ role, loading, onConfirm, onCancel }: DeleteRoleModalProps) {
  return (
    <ConfirmModal
      title="Delete role"
      message={
        role.memberCount > 0
          ? `Delete "${role.name}"? This role has ${role.memberCount} member(s). The server may block deletion if members are still assigned.`
          : `Are you sure you want to delete "${role.name}"? This cannot be undone.`
      }
      confirmLabel={loading ? "Deleting…" : "Delete"}
      cancelLabel="Cancel"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={() => {
        if (!loading) onCancel();
      }}
    />
  );
}

export function useDeleteRole(onDone: () => void) {
  const [target, setTarget] = useState<AdminRoleListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      await deleteAdminRole(target.id);
      setTarget(null);
      onDone();
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Could not delete role.");
    } finally {
      setLoading(false);
    }
  }, [target, onDone]);

  return { target, setTarget, loading, error, setError, confirmDelete };
}
