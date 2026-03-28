"use client";

import { useEffect, useRef, useState, ChangeEvent, KeyboardEvent } from "react";
import { Eye, EyeSlash, Timer1 } from "iconsax-react";
import { SuccessModal } from "@/components/provider/provider-modals";

const CORRECT_OTP = "000000";

/* ── OTP input ── */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const length = 6;
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = ch;
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
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`h-11 w-11 rounded-lg border-2 bg-white text-center text-base font-semibold outline-none transition-colors ${
            digit ? "border-red-500 text-red-500" : "border-zinc-300 text-primary-text focus:border-secondary-green"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Countdown hook ── */
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return { label: `${mm}:${ss}`, expired: remaining <= 0, reset: () => setRemaining(seconds) };
}

/* ── Password field with eye toggle ── */
function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-primary-text">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••••"
          className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 pr-10 text-sm text-primary-text outline-none focus:border-zinc-400"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeSlash size={18} variant="Outline" color="currentColor" /> : <Eye size={18} variant="Outline" color="currentColor" />}
        </button>
      </div>
    </div>
  );
}

/* ── OTP Modal ── */
function OtpModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const { label, expired, reset } = useCountdown(33);

  const handleSubmit = () => {
    if (otp === CORRECT_OTP) { setError(""); onSuccess(); }
    else setError("Incorrect OTP. Please try again.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white px-8 pb-7 pt-7 shadow-xl">
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
            <button type="button" onClick={() => { reset(); setOtp(""); setError(""); }}
              className="font-semibold text-primary-text hover:underline">Resend</button>
          </span>
        </div>
        <button type="button" onClick={handleSubmit} disabled={otp.length !== 6 || expired}
          className="mt-6 w-full rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text transition-opacity disabled:opacity-40 hover:opacity-90">
          Submit
        </button>
      </div>
    </div>
  );
}

/* ── Password Reset Tab ── */
export function SettingsPasswordReset() {
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => { e.preventDefault(); setShowOtp(true); };

  const handleContinue = () => {
    setShowSuccess(false); setIsEditing(false);
    setOldPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  return (
    <div className="w-[566px] rounded-xl border border-[#E8EBEE] bg-white p-4">
      {!isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Password</label>
            <input type="password" readOnly value="placeholder" placeholder="••••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-400 outline-none" />
          </div>
          <button type="button" onClick={() => setIsEditing(true)}
            className="rounded-full border border-zinc-200 bg-zinc-200 px-5 py-2 text-sm font-medium text-primary-text transition-colors">
            Edit Password
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <PasswordField label="Old Password" value={oldPassword} onChange={setOldPassword} />
          <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
          <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
          <button type="submit"
            className="rounded-full bg-primary-green px-6 py-2.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90">
            Save Changes
          </button>
        </form>
      )}

      {showOtp && <OtpModal onSuccess={() => { setShowOtp(false); setShowSuccess(true); }} onClose={() => setShowOtp(false)} />}
      {showSuccess && <SuccessModal message="Password has been reset." onContinue={handleContinue} />}
    </div>
  );
}
