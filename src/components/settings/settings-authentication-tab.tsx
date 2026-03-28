"use client";

import { useState } from "react";
import { Import, Sort, Sms, Box, TickCircle, CloseCircle, Add, CloseSquare, Setting2, ArrowDown2 } from "iconsax-react";
import { useMemo } from "react";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";

/* ── QR Code SVG (static placeholder pattern) ── */
function QrCodeSvg() {
  // A visually realistic QR-like grid pattern
  const cells = [
    "11100001011100011100001",
    "10100101010001010100101",
    "10111101011101010111101",
    "10111100010001010111100",
    "10111101100101010111101",
    "10100100001001010100100",
    "11100101010101011100101",
    "00000001010001000000001",
    "01110101101101101110101",
    "10010001010011110010001",
    "11101101001100011101101",
    "01001001110001101001001",
    "00110101010101000110101",
    "11001001001100011001001",
    "01010101101101001010101",
    "00000001010001100000001",
    "11100101110101011100101",
    "10100001001001010100001",
    "10111101101101010111101",
    "10111100010001010111100",
    "10111101001001010111101",
    "10100101010101010100101",
    "11100001011100011100001",
  ];
  const size = 23;
  const cell = 8;
  return (
    <svg width={size * cell} height={size * cell} viewBox={`0 0 ${size * cell} ${size * cell}`}>
      {cells.map((row, r) =>
        row.split("").map((bit, c) =>
          bit === "1" ? (
            <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="white" />
          ) : null,
        ),
      )}
    </svg>
  );
}

/* ── QR Code Modal ── */
function QrCodeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [scanned, setScanned] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = () => {
    if (code.trim()) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white px-8 pb-8 pt-7 shadow-xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#E8EBEE] text-zinc-500 transition-colors hover:bg-zinc-200"
          aria-label="Close"
        >
          <CloseSquare size={16} variant="Outline" color="currentColor" />
        </button>

        <h2 className="mb-5 text-center text-base font-bold text-primary-text">QR Code</h2>

        {/* QR card */}
        <div className="overflow-hidden rounded-2xl bg-secondary-green">
          <div className="flex items-center justify-center p-5">
            <div className="rounded-xl bg-secondary-green p-1">
              <QrCodeSvg />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScanned(true)}
            className="w-full py-3 text-sm font-bold tracking-wide text-white transition-opacity hover:opacity-90"
          >
            SCAN ME
          </button>
        </div>

        {/* Security code input — appears after SCAN ME */}
        {scanned && (
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Security Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter security code generated"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!code.trim()}
              className="mt-4 w-full rounded-full bg-primary-green py-2.5 text-sm font-semibold text-primary-text transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              Verify
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type AuthSubTab = "general" | "users";

type AuthMethod = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
};

/* ── Toggle matching existing StatusToggle style ── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-zinc-300 transition-colors"
    >
      <span
        className={`inline-block h-4 w-4 rounded-full shadow transition-transform ${
          checked ? "translate-x-4 bg-primary-green" : "translate-x-0.5 bg-white"
        }`}
      />
    </button>
  );
}

/* ── General sub-tab ── */
function GeneralTab() {
  const [methods, setMethods] = useState<AuthMethod[]>([
    {
      id: "email",
      icon: <Sms size={22} variant="Outline" color="currentColor" />,
      title: "Email Authentication",
      description: "Set up 2FA verification code over email for every login on Pillar Admin",
      active: true,
    },
    {
      id: "authenticator",
      icon: <Box size={22} variant="Outline" color="currentColor" />,
      title: "Authenticator App",
      description: "Set up 2FA verification code over authenticator app for every login on Pillar Admin",
      active: false,
    },
  ]);
  const [showQr, setShowQr] = useState(false);

  const toggle = (id: string, value: boolean) => {
    // Opening authenticator → show QR flow first
    if (id === "authenticator" && value) {
      setShowQr(true);
      return;
    }
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, active: value } : m)));
  };

  return (
    <div className="rounded-xl border border-[#E8EBEE] bg-white">
      {methods.map((method, idx) => (
        <div key={method.id}>
          <div className="px-6 py-7">
            {/* Top row: icon + title + status + toggle */}
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-zinc-500">{method.icon}</div>
              <p className="flex-1 text-sm font-semibold text-primary-text">{method.title}</p>

              {/* Status badge + toggle */}
              <div className="flex shrink-0 items-center gap-3">
                {method.active ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <TickCircle size={14} variant="Outline" color="currentColor" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                    <CloseCircle size={14} variant="Outline" color="currentColor" />
                    Inactive
                  </span>
                )}
                <Toggle checked={method.active} onChange={(v) => toggle(method.id, v)} label={`Toggle ${method.title}`} />
              </div>
            </div>

            {/* Description below */}
            <p className="mt-3 text-xs text-zinc-400">{method.description}</p>
          </div>

          {idx < methods.length - 1 && <hr className="border-[#E8EBEE]" />}
        </div>
      ))}

      {showQr && (
        <QrCodeModal
          onClose={() => setShowQr(false)}
          onSuccess={() => {
            setShowQr(false);
            setMethods((prev) =>
              prev.map((m) => (m.id === "authenticator" ? { ...m, active: true } : m)),
            );
          }}
        />
      )}
    </div>
  );
}

/* ── Shared modal shell ── */
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white px-8 pb-8 pt-7 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#E8EBEE] text-zinc-500 transition-colors hover:bg-zinc-200"
          aria-label="Close"
        >
          <CloseSquare size={16} variant="Outline" color="currentColor" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ── Success screen (shared) ── */
function SuccessScreen({ message, buttonLabel, onClose }: { message: string; buttonLabel: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8EBEE]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-secondary-green">
          <TickCircle size={32} variant="Outline" color="#013220" />
        </div>
      </div>
      <h2 className="mb-2 text-lg font-bold text-primary-text">Successful</h2>
      <p className="mb-6 text-sm text-zinc-400">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/* ── Create MFA Modal ── */
function CreateMfaModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <ModalShell onClose={onClose}>
        <SuccessScreen
          message={`You have successfully created MFA for ${email}`}
          buttonLabel="Continue"
          onClose={onClose}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <h2 className="mb-5 text-lg font-bold text-primary-text">Create MFA/2FA</h2>
      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-medium text-primary-text">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
        />
      </div>
      <button
        type="button"
        onClick={() => { if (email.trim()) setSuccess(true); }}
        disabled={!email.trim()}
        className="w-full rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text transition-opacity disabled:opacity-40 hover:opacity-90"
      >
        Submit
      </button>
    </ModalShell>
  );
}

/* ── Disable MFA Modal ── */
type DisableStep = "form" | "confirm" | "success";
const TIME_RANGE_OPTIONS = ["24 hrs", "48 hrs", "Permanently"];

function DisableMfaModal({ userName, onClose }: { userName: string; onClose: () => void }) {
  const [step, setStep] = useState<DisableStep>("form");
  const [timeRange, setTimeRange] = useState("24 hrs");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (step === "success") {
    return (
      <ModalShell onClose={onClose}>
        <SuccessScreen
          message="This use MFA has been successfully disabled"
          buttonLabel="Cancel"
          onClose={onClose}
        />
      </ModalShell>
    );
  }

  if (step === "confirm") {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500">
              <span className="text-2xl font-bold text-red-500">!</span>
            </div>
          </div>
          <h2 className="mb-2 text-lg font-bold text-primary-text">Disable MFA</h2>
          <p className="mb-6 text-sm text-zinc-400">Are you sure you want to disable this use MFA?</p>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-zinc-200 bg-white py-3 text-sm font-semibold text-primary-text transition-colors hover:bg-[#F9FAFB]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("success")}
              className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Yes, Disable
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <h2 className="mb-5 text-lg font-bold text-primary-text">Disable MFA/2FA</h2>
      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-medium text-primary-text">Time Range</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text transition-colors hover:border-zinc-300"
          >
            <span>{timeRange}</span>
            <ArrowDown2 size={16} variant="Outline" color="currentColor" className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setTimeRange(opt); setDropdownOpen(false); }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[#F9FAFB] ${timeRange === opt ? "font-semibold text-primary-text" : "text-zinc-500"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setStep("confirm")}
        className="w-full rounded-full bg-primary-green py-3 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
      >
        Submit
      </button>
    </ModalShell>
  );
}

/* ── Users sub-tab ── */
type AuthStatus = "Active" | "Permanently Disabled" | "Temporarily Disabled";

type AuthUser = {
  id: string;
  name: string;
  role: string;
  status: AuthStatus;
};

const BASE_USERS: Omit<AuthUser, "id">[] = [
  { name: "Gagatuaga Emeka",  role: "Superadmin",   status: "Active" },
  { name: "Tunde Meranda",    role: "Admin",         status: "Active" },
  { name: "Ojora Kunle",      role: "Tech Support",  status: "Permanently Disabled" },
  { name: "Poco Lee",         role: "Tech Support",  status: "Active" },
  { name: "Tunde Perry",      role: "Tech Support",  status: "Temporarily Disabled" },
  { name: "Jibola Ayo",       role: "Admin",         status: "Active" },
  { name: "Funmi Bawa",       role: "Tech Support",  status: "Active" },
  { name: "Chizoba Williams", role: "Tech Support",  status: "Temporarily Disabled" },
  { name: "Ezekiel Olajolo",  role: "Tech Support",  status: "Active" },
  { name: "Olamide Eleniyan", role: "Tech Support",  status: "Permanently Disabled" },
  { name: "Pascal Okoye",     role: "Tech Support",  status: "Active" },
];

const ALL_USERS: AuthUser[] = Array.from({ length: 55 }, (_, i) => ({
  ...BASE_USERS[i % BASE_USERS.length],
  id: `user-${i}`,
  name: i < BASE_USERS.length
    ? BASE_USERS[i].name
    : `${BASE_USERS[i % BASE_USERS.length].name} (${i + 1})`,
}));

function StatusBadge({ status }: { status: AuthStatus }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <TickCircle size={14} variant="Outline" color="currentColor" /> Active
      </span>
    );
  }
  if (status === "Permanently Disabled") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
        <CloseCircle size={14} variant="Outline" color="currentColor" />
        <span><span className="font-bold">Permanently</span> Disabled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
      <CloseCircle size={14} variant="Outline" color="currentColor" />
      <span><span className="font-bold">Temporarily</span> Disabled</span>
    </span>
  );
}

function UsersTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [disablingUser, setDisablingUser] = useState<AuthUser | null>(null);

  const safePage = Math.min(page, Math.max(1, Math.ceil(ALL_USERS.length / pageSize)));
  const paginatedRows = useMemo(
    () => ALL_USERS.slice((safePage - 1) * pageSize, safePage * pageSize),
    [safePage, pageSize],
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-[#F9FAFB] text-zinc-400 text-xs">
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Name</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Role</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Authentication Status</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-[#F9FAFB]">
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 text-sm font-medium text-primary-text align-middle">
                  {row.name}
                </td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 text-sm text-zinc-500 align-middle">
                  {row.role}
                </td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 align-middle">
                  <StatusBadge status={row.status} />
                </td>
                <td className="h-16 border-b border-[#E8EBEE] px-4 py-0 align-middle">
                  <button
                    type="button"
                    onClick={() => setDisablingUser(row)}
                    className="text-zinc-400 transition-colors hover:text-zinc-600"
                    aria-label="Disable MFA"
                  >
                    <Setting2 size={18} variant="Outline" color="currentColor" />
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
        totalItems={ALL_USERS.length}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />

      {disablingUser && (
        <DisableMfaModal
          userName={disablingUser.name}
          onClose={() => setDisablingUser(null)}
        />
      )}
    </div>
  );
}

/* ── Main Authentication Tab ── */
export function SettingsAuthenticationTab() {
  const [subTab, setSubTab] = useState<AuthSubTab>("general");
  const [showCreateMfa, setShowCreateMfa] = useState(false);

  return (
    <div>
      {/* Header: title + search + filter + export + create MFA */}
      <div className="mb-6 flex flex-wrap items-center gap-3 border rounded-xl bg-white px-4 py-3">
        <h2 className="shrink-0 text-sm font-semibold text-primary-text">User Authentication</h2>

        {/* Search */}
        <div className="flex h-9 w-[240px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-400">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by Name or ID"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-400"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Filter */}
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-600 transition-colors hover:bg-[#F9FAFB]"
            aria-label="Filter"
          >
            <Sort size={18} variant="Outline" color="#17375E" />
          </button>

          {/* Export */}
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-[#17375E] transition-colors hover:bg-[#F9FAFB]"
          >
            <Import size={18} variant="Outline" color="#17375E" />
            Export
          </button>

          {/* Create MFA */}
          <button
            type="button"
            onClick={() => setShowCreateMfa(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-4 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            <Add size={16} variant="Outline" color="currentColor" />
            Create MFA
          </button>
        </div>
      </div>

      {/* Sub-tab bar */}
      <div className="mb-6 flex items-center gap-6 rounded-full border border-[#E8EBEE] bg-white px-5 py-3.5">
        {(["general", "users"] as AuthSubTab[]).map((id) => {
          const label = id === "general" ? "General" : "Users";
          const active = subTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`text-sm transition-colors ${
                active
                  ? "rounded-full bg-zinc-200 px-4.5 py-1.5 font-semibold text-primary-text"
                  : "font-medium text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {subTab === "general" && <GeneralTab />}
      {subTab === "users" && <UsersTab />}

      {showCreateMfa && <CreateMfaModal onClose={() => setShowCreateMfa(false)} />}
    </div>
  );
}
