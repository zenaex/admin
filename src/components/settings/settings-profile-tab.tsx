"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { getAdminSettingsProfile, patchAdminSettingsProfile } from "@/lib/admin-api/settings-api";
import { AdminApiError } from "@/lib/admin-api/client";
import type { AdminSettingsProfile } from "@/lib/admin-api/types";

function displayName(p: AdminSettingsProfile): string {
  const fn = p.firstName?.trim() ?? "";
  const ln = p.lastName?.trim() ?? "";
  return [fn, ln].filter(Boolean).join(" ");
}

function displayField(value?: string): string {
  return value?.trim() ?? "";
}

export function SettingsProfileTab() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AdminSettingsProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const p = await getAdminSettingsProfile();
      setProfile(p);
      setFirstName(p.firstName?.trim() ?? "");
      setLastName(p.lastName?.trim() ?? "");
      setPhoneNumber(p.phoneNumber?.trim() ?? "");
      setDepartment(p.department?.trim() ?? "");
    } catch (e) {
      setProfile(null);
      setLoadError(e instanceof AdminApiError ? e.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = () => {
    if (!profile) return;
    setSaveOk(false);
    setSaveError(null);
    setFirstName(profile.firstName?.trim() ?? "");
    setLastName(profile.lastName?.trim() ?? "");
    setPhoneNumber(profile.phoneNumber?.trim() ?? "");
    setDepartment(profile.department?.trim() ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError(null);
    if (profile) {
      setFirstName(profile.firstName?.trim() ?? "");
      setLastName(profile.lastName?.trim() ?? "");
      setPhoneNumber(profile.phoneNumber?.trim() ?? "");
      setDepartment(profile.department?.trim() ?? "");
    }
  };

  const canSave = useMemo(
    () =>
      firstName.trim() &&
      lastName.trim() &&
      phoneNumber.trim() &&
      department.trim() &&
      !saving,
    [firstName, lastName, phoneNumber, department, saving],
  );

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      const updated = await patchAdminSettingsProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        department: department.trim(),
      });
      setProfile(updated);
      setEditing(false);
      setSaveOk(true);
    } catch (err) {
      setSaveError(err instanceof AdminApiError ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-outline bg-white px-6 py-10 text-center text-sm text-zinc-500">
        Loading profile…
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="rounded-xl border border-outline bg-white px-6 py-10">
        <p className="text-sm text-red-700" role="alert">
          {loadError ?? "Profile unavailable."}
        </p>
        <Button type="button" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {saveOk ? (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
          Profile updated.
        </p>
      ) : null}

      {!editing ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={startEdit}>
              Edit profile
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-outline bg-white">
            <table className="w-full min-w-200 border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-subtle text-zinc-500">
                  <th className="border-b border-outline px-4 py-3 font-medium">Employee ID</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Name</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Email Address</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Phone Number</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Department</th>
                  <th className="border-b border-outline px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-outline px-4 py-5 font-medium text-black underline underline-offset-2">
                    {displayField(profile.employeeId)}
                  </td>
                  <td className="border-r border-outline px-4 py-5 text-primary-text">{displayName(profile)}</td>
                  <td className="border-r border-outline px-4 py-5 text-zinc-500">{displayField(profile.email)}</td>
                  <td className="border-r border-outline px-4 py-5 text-zinc-500">{displayField(profile.phoneNumber)}</td>
                  <td className="border-r border-outline px-4 py-5 text-zinc-500">{displayField(profile.department)}</td>
                  <td className="border-r border-outline px-4 py-5 text-zinc-500">{displayField(profile.role)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-outline bg-surface-subtle py-4">
            <div>
              <p className="mb-2 px-4 text-sm font-medium text-zinc-500">Date Joined</p>
            </div>
            <div className="h-16 rounded-b-xl bg-white">
              <hr className="my-2 w-full border-t border-outline" />
              <p className="h-10 px-4 text-sm text-primary-text">{displayField(profile.dateJoined)}</p>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSave} className="max-w-xl space-y-4 rounded-xl border border-outline bg-white p-6">
          <h2 className="text-base font-semibold text-primary-text">Edit profile</h2>
          {saveError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {saveError}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField id="prof-fn" label="First name" value={firstName} onChange={(ev) => setFirstName(ev.target.value)} />
            <InputField id="prof-ln" label="Last name" value={lastName} onChange={(ev) => setLastName(ev.target.value)} />
            <InputField
              id="prof-phone"
              label="Phone number"
              className="sm:col-span-2"
              value={phoneNumber}
              onChange={(ev) => setPhoneNumber(ev.target.value)}
            />
            <InputField
              id="prof-dept"
              label="Department"
              className="sm:col-span-2"
              value={department}
              onChange={(ev) => setDepartment(ev.target.value)}
            />
          </div>
          <p className="text-xs text-zinc-500">Employee ID, email, role, and date joined are managed by your administrator.</p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!canSave}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={cancelEdit} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
