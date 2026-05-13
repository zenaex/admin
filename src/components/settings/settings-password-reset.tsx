"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/button";
import { PasswordField } from "@/components/password-field";
import { SuccessModal } from "@/components/provider/provider-modals";
import { postAdminSettingsChangePassword } from "@/lib/admin-api/settings-api";
import { AdminApiError } from "@/lib/admin-api/client";

export function SettingsPasswordReset() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && hasMinLength && hasNumber && passwordsMatch && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await postAdminSettingsChangePassword({
        currentPassword,
        newPassword,
      });
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not change password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    setShowSuccess(false);
    setIsEditing(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  return (
    <div className="w-[566px] rounded-xl border border-outline bg-white p-4">
      {!isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Password</label>
            <input
              type="password"
              readOnly
              value="••••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-400 outline-none"
              aria-hidden
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
            Edit password
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <PasswordField id="set-cur-pw" label="Current password" value={currentPassword} onChange={setCurrentPassword} />
          <PasswordField id="set-new-pw" label="New password" value={newPassword} onChange={setNewPassword} />
          <PasswordField id="set-confirm-pw" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} />
          <p className="text-xs text-zinc-500">At least 8 characters including one number.</p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                setIsEditing(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {showSuccess && <SuccessModal message="Password has been updated." onContinue={handleContinue} />}
    </div>
  );
}
