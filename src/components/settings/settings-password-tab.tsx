"use client";

import { useEffect, useMemo, useRef, useState, ChangeEvent, KeyboardEvent } from "react";
import { ArrowDown2, Eye, EyeSlash, Timer1 } from "iconsax-react";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";

type PasswordSubTab = "reset" | "requests";

const CORRECT_OTP = "000000";

/* ── OTP input styled to match design (red border + text when filled) ── */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const length = 6;
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    onChange(next.join(""));
    if (ch && i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) focus(i - 1);
  };

  return (
    <div className="flex items-center justify-center gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`h-11 w-11 rounded-lg border-2 bg-white text-center text-base font-semibold outline-none transition-colors ${
            digit
              ? "border-red-500 text-red-500"
              : "border-zinc-300 text-primary-text focus:border-secondary-green"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Countdown timer hook ── */
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const reset = () => setRemaining(seconds);
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return { label: `${mm}:${ss}`, expired: remaining <= 0, reset };
}

/* ── Password field with show/hide toggle ── */
function PasswordField({
  label, value, onChange, placeholder = "••••••••••",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-primary-text">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 pr-10 text-sm text-primary-text outline-none focus:border-zinc-400"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show
            ? <EyeSlash size={18} variant="Outline" color="currentColor" />
            : <Eye size={18} variant="Outline" color="currentColor" />}
        </button>
      </div>
    </div>
  );
}

/* ── OTP Modal ── */
function OtpModal({
  onSuccess, onClose,
}: { onSuccess: () => void; onClose: () => void }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const { label, expired, reset } = useCountdown(33);
  const isFilled = otp.length === 6;

  const handleSubmit = () => {
    if (otp === CORRECT_OTP) {
      setError("");
      onSuccess();
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-8 pb-7 pt-7 shadow-xl mx-4">
        <h2 className="mb-1 text-center text-[18px] font-bold text-primary-text">OTP Verification Code</h2>
        <p className="mb-6 text-center text-sm text-zinc-400">Enter the code sent to your email</p>

        <OtpInput value={otp} onChange={setOtp} />

        {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Timer1 size={14} variant="Outline" color="currentColor" />
            Expires In : {expired ? "0:00" : label}
          </span>
          <span>
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={() => { reset(); setOtp(""); setError(""); }}
              className="font-semibold text-primary-text hover:underline"
            >
              Resend
            </button>
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFilled || expired}
          className="mt-6 w-full rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* ── Reset Requests Table ── */
type ResetRequest = { id: string; name: string; email: string; role: string; dateRequested: string };

const BASE_REQUESTS: Omit<ResetRequest, "id">[] = [
  { name: "Adeboye Temidayo",  email: "Adeboye.temidayo@zanaex.com",  role: "Superadmin",   dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Azuka Adefemi",     email: "Azuka.adefemi@zanaex.com",     role: "Admin",        dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Babangida Tunde",   email: "Babangida.tunde@zanaex.com",   role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiamaka Ngozi",    email: "Chiamaka.ngozi@zanaex.com",    role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiroma Ikechukwu", email: "Chiroma.ikechukwu@zanaex.com", role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Chizoba Adekunle",  email: "Chizoba.adekunle@shago.com",   role: "Admin",        dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Lala Jibola",       email: "Lala.jibola@zanaex.com",       role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
  { name: "Shakur Wasiu",      email: "Shakur.wasiu@zanaex.com",      role: "Tech Support", dateRequested: "Jan 6, 2026 | 9:32AM" },
];

const ALL_REQUESTS: ResetRequest[] = Array.from({ length: 48 }, (_, i) => ({
  ...BASE_REQUESTS[i % BASE_REQUESTS.length],
  id: `req-${i}`,
  name: i < BASE_REQUESTS.length ? BASE_REQUESTS[i].name : `${BASE_REQUESTS[i % BASE_REQUESTS.length].name} (${i + 1})`,
}));

function ResetRequestsTable() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [pending, setPending] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const safePage = Math.min(page, Math.max(1, Math.ceil(ALL_REQUESTS.length / pageSize)));
  const paginatedRows = useMemo(() => ALL_REQUESTS.slice((safePage - 1) * pageSize, safePage * pageSize), [safePage, pageSize]);
  const allChecked = paginatedRows.length > 0 && paginatedRows.every((r) => selected.has(r.id));

  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allChecked) paginatedRows.forEach((r) => next.delete(r.id));
    else paginatedRows.forEach((r) => next.add(r.id));
    return next;
  });
  const toggleRow = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleConfirm = () => {
    if (!pending) return;
    const msg = pending.action === "approve"
      ? "Password resent has been approved. Team Member will get a reset link."
      : "Password resent has been rejected.";
    setPending(null);
    setSuccessMsg(msg);
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-zinc-500">
              <th className="h-11 w-10 border-b border-zinc-200 px-4 py-0 align-middle">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green" />
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                <span className="inline-flex items-center gap-1">Name <ArrowDown2 size={12} variant="Outline" color="currentColor" /></span>
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Role</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Requested</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green" />
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <span className="cursor-pointer font-medium text-black underline underline-offset-2">{row.name}</span>
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.role}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">{row.dateRequested}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setPending({ id: row.id, action: "reject" })} className="text-sm font-medium text-red-500 underline transition-colors hover:text-red-700">Reject</button>
                    <button type="button" onClick={() => setPending({ id: row.id, action: "approve" })} className="text-sm font-medium text-green-600 underline transition-colors hover:text-green-800">Approve</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AuditTrailPagination page={safePage} pageSize={pageSize} totalItems={ALL_REQUESTS.length}
        onPageChange={(p) => setPage(p)} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />

      {pending?.action === "approve" && (
        <ConfirmModal
          variant="approve"
          title="Approve Request"
          message="Are you sure you want to approve this password reset?"
          confirmLabel="Approve"
          cancelLabel="Continue"
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      {pending?.action === "reject" && (
        <ConfirmModal
          variant="danger"
          title="Reject Reset"
          message="Are you sure you want to reject this password reset?"
          confirmLabel="Reject"
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      {successMsg && (
        <SuccessModal message={successMsg} onContinue={() => setSuccessMsg(null)} />
      )}
    </div>
  );
}

/* ── Main Password Tab ── */
export function SettingsPasswordTab() {
  const [subTab, setSubTab] = useState<PasswordSubTab>("reset");
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowOtp(true);
  };

  const handleOtpSuccess = () => {
    setShowOtp(false);
    setShowSuccess(true);
  };

  const handleContinue = () => {
    setShowSuccess(false);
    setIsEditing(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div>
      {/* Sub-tab bar — full-width white card */}
      <div className="mb-6 flex items-center gap-6 rounded-full border border-zinc-100 bg-white px-5 py-3.5">
        {(["reset", "requests"] as PasswordSubTab[]).map((id) => {
          const label = id === "reset" ? "Password Reset" : "Reset Requests";
          const active = subTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`text-sm transition-colors ${
                active
                  ? "font-semibold text-primary-text bg-zinc-200 rounded-full px-4.5 py-1.5"
                  : "font-medium text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {subTab === "reset" && (
        <div className="w-[566px] rounded-xl border border-zinc-100 bg-white p-4">
          {!isEditing ? (
            /* Read-only view */
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary-text">Password</label>
                <input
                  type="password"
                  readOnly
                  value="placeholder"
                  placeholder="••••••••••"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-400 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-full border border-zinc-200 bg-zinc-200 px-5 py-2 text-sm font-medium text-primary-text transition-colors"
              >
                Edit Password
              </button>
            </div>
          ) : (
            /* Edit form */
            <form onSubmit={handleSave} className="space-y-4">
              <PasswordField label="Old Password" value={oldPassword} onChange={setOldPassword} />
              <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
              <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
              <button
                type="submit"
                className="rounded-full bg-primary-green px-6 py-2.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>
      )}

      {subTab === "requests" && <ResetRequestsTable />}

      {showOtp && (
        <OtpModal onSuccess={handleOtpSuccess} onClose={() => setShowOtp(false)} />
      )}

      {showSuccess && (
        <SuccessModal message="Password has been reset." onContinue={handleContinue} />
      )}
    </div>
  );
}
