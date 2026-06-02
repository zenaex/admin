"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Copy, DocumentDownload, Forbidden, Refresh, Wallet, CardReceive, CardSend } from "iconsax-react";
import { ListFilter } from "lucide-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { ConfirmModal, SuccessModal } from "@/components/provider/provider-modals";
import { exportClientTable } from "@/lib/export/export-handlers";
import { TableExportMenu } from "@/components/ui/table-export-menu";
import {
  getAdminAuditCustomerLogs,
  getAdminCustomerKyc,
  getAdminCustomerProfile,
  getAdminCustomerTransactions,
  getAdminCustomerWallets,
  pickCustomerPasswordStatus,
  pickCustomerPinStatus,
  pickCustomerSecurityQuestionStatus,
} from "@/lib/admin-api/customers-api";
import { AdminApiError } from "@/lib/admin-api/client";
import {
  classifyCustomerAccountStatus,
  postCustomerDeactivate,
  postCustomerReactivate,
  postCustomerSuspend,
} from "@/lib/admin-api/users-api";
import type { AdminCustomerTransactionRow, AdminCustomerWalletItem } from "@/lib/admin-api/types";
import {
  canDeactivateCustomer,
  canSuspendOrReactivateCustomer,
} from "@/lib/auth/jwt";
import { getAccessToken } from "@/lib/auth/token-storage";
import { ErrorAlert } from "@/components/ui/error-alert";
import { StatCard } from "@/components/ui/stat-card";

type CustomerDetailTab = "Customer Details" | "Transaction History" | "KYC Details" | "Wallet" | "Audit Log";
const TABS: CustomerDetailTab[] = ["Customer Details", "Transaction History", "KYC Details", "Wallet", "Audit Log"];

function pickStr(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickNum(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function boolToSet(v: unknown): "Set" | "Not Set" {
  if (v === true || v === "true" || v === 1) return "Set";
  if (v === false || v === "false" || v === 0) return "Not Set";
  return "Not Set";
}

function formatWhen(isoOrTimestamp: unknown): string {
  if (!isoOrTimestamp) return "—";
  if (typeof isoOrTimestamp === "string") {
    const d = new Date(isoOrTimestamp);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    return isoOrTimestamp;
  }
  if (typeof isoOrTimestamp === "object" && isoOrTimestamp !== null) {
    const obj = isoOrTimestamp as Record<string, unknown>;
    const sec = obj.seconds ?? obj._seconds;
    if (typeof sec === "number") {
      const d = new Date(sec * 1000);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return "—";
}

export type CustomerDetailsViewProps = {
  id: string;
};

type CustomerAccountAction = "suspend" | "deactivate" | "reactivate";

const ACTION_COPY: Record<
  CustomerAccountAction,
  { title: string; message: string; confirmLabel: string; success: string }
> = {
  suspend: {
    title: "Suspend account",
    message: "Are you sure you want to suspend this customer account?",
    confirmLabel: "Suspend",
    success: "Customer account has been suspended.",
  },
  deactivate: {
    title: "Deactivate account",
    message: "Are you sure you want to deactivate this customer account? This blocks the account.",
    confirmLabel: "Deactivate",
    success: "Customer account has been deactivated.",
  },
  reactivate: {
    title: "Reactivate account",
    message: "Are you sure you want to reactivate this customer account?",
    confirmLabel: "Reactivate",
    success: "Customer account has been reactivated.",
  },
};

export function CustomerDetailsView({ id: accountId }: CustomerDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>("Customer Details");
  const [actionOpen, setActionOpen] = useState(false);

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [pendingAction, setPendingAction] = useState<CustomerAccountAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const token = getAccessToken();
  const canDeactivate = canDeactivateCustomer(token);
  const canSuspendReactivate = canSuspendOrReactivateCustomer(token);

  const accountStatusRaw = useMemo(() => {
    const p = profile ?? {};
    return pickStr(p, ["accountStatus", "account_status", "status"]) || "";
  }, [profile]);

  const accountStatusKind = useMemo(
    () => classifyCustomerAccountStatus(accountStatusRaw),
    [accountStatusRaw],
  );

  const customerDisplayName = useMemo(() => {
    const p = profile ?? {};
    const first = pickStr(p, ["firstName", "first_name", "givenName"]);
    const last = pickStr(p, ["lastName", "last_name", "familyName"]);
    const fromParts = [first, last].filter(Boolean).join(" ").trim();
    if (fromParts) return fromParts;
    return pickStr(p, ["fullName", "full_name", "name", "customerName", "displayName"]) || "";
  }, [profile]);

  const loadProfile = useCallback(async () => {
    setProfileError(null);
    setProfileLoading(true);
    try {
      const p = await getAdminCustomerProfile(accountId);
      setProfile(p);
    } catch (e) {
      setProfile(null);
      setProfileError(e instanceof AdminApiError ? e.message : "Could not load customer.");
    } finally {
      setProfileLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const actionMenuItems = useMemo(() => {
    const items: { key: string; label: string; icon: ReactNode; disabled?: boolean; title?: string; onClick?: () => void }[] = [
      {
        key: "statement",
        label: "Account Statement",
        icon: <DocumentDownload size={16} variant="Outline" color="currentColor" />,
        disabled: true,
        title: "Coming soon",
      },
    ];

    const showSuspendDeactivate =
      accountStatusKind === "active" || accountStatusKind === "unknown";
    const showReactivate =
      accountStatusKind === "inactive" || accountStatusKind === "unknown";

    if (showSuspendDeactivate && canSuspendReactivate) {
      items.push({
        key: "suspend",
        label: "Suspend Account",
        icon: <Forbidden size={16} variant="Outline" color="currentColor" />,
        onClick: () => {
          setActionError(null);
          setPendingAction("suspend");
          setActionOpen(false);
        },
      });
    }
    if (showSuspendDeactivate && canDeactivate) {
      items.push({
        key: "deactivate",
        label: "Deactivate Account",
        icon: <Forbidden size={16} variant="Outline" color="currentColor" />,
        onClick: () => {
          setActionError(null);
          setPendingAction("deactivate");
          setActionOpen(false);
        },
      });
    }
    if (showReactivate && canSuspendReactivate) {
      items.push({
        key: "reactivate",
        label: "Reactivate Account",
        icon: <Refresh size={16} variant="Outline" color="currentColor" />,
        onClick: () => {
          setActionError(null);
          setPendingAction("reactivate");
          setActionOpen(false);
        },
      });
    }

    return items;
  }, [accountStatusKind, canDeactivate, canSuspendReactivate]);

  const handleDeactivateConfirm = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      await postCustomerDeactivate(accountId);
      setPendingAction(null);
      setSuccessMessage(ACTION_COPY.deactivate.success);
      await loadProfile();
    } catch (e) {
      setActionError(e instanceof AdminApiError ? e.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendReactivateSubmit = async (reason: string, notes?: string) => {
    const action = pendingAction;
    if (action !== "suspend" && action !== "reactivate") return;
    setActionError(null);
    setActionLoading(true);
    try {
      if (action === "suspend") {
        await postCustomerSuspend(accountId, {
          reason: reason.trim(),
          notes: (notes ?? reason).trim(),
        });
      } else {
        await postCustomerReactivate(accountId, { reason: reason.trim() });
      }
      setPendingAction(null);
      setSuccessMessage(ACTION_COPY[action].success);
      await loadProfile();
    } catch (e) {
      setActionError(e instanceof AdminApiError ? e.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCopy = pendingAction === "deactivate" ? ACTION_COPY.deactivate : null;

  return (
    <div>
      <div className="mb-6 flex h-[66px] items-center justify-between rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/user-mgt/customers" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Customers
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Customer Details</span>
        </div>

        <div className="relative">
          <button
            type="button"
            disabled={actionLoading}
            onClick={() => setActionOpen((o) => !o)}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text disabled:opacity-50"
          >
            Action
            <ArrowDown2 size={12} variant="Outline" color="currentColor" className={`transition-transform ${actionOpen ? "rotate-180" : ""}`} />
          </button>
          {actionOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActionOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg">
                {actionMenuItems.map(({ key, label, icon, disabled, title, onClick }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled || actionLoading}
                    title={title}
                    onClick={() => {
                      if (disabled) return;
                      onClick?.();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-primary-text transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-zinc-500">{icon}</span>
                    {label}
                    {disabled && title ? (
                      <span className="ml-auto text-[10px] text-zinc-400">{title}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </div>
      ) : null}

      <ErrorAlert error={profileError} onRetry={() => void loadProfile()} className="mb-4" />

      <UnderlineTabs
        tabs={TABS.map((t) => ({ id: t, label: t }))}
        active={activeTab}
        onChange={(tid) => setActiveTab(tid as CustomerDetailTab)}
      />

      {activeTab === "Customer Details" ? (
        <CustomerDetailsTab accountId={accountId} profile={profile} loading={profileLoading} />
      ) : null}
      {activeTab === "Transaction History" ? (
        <TransactionHistoryTab accountId={accountId} customerDisplayName={customerDisplayName} profile={profile} />
      ) : null}
      {activeTab === "KYC Details" ? <KycDetailsTab accountId={accountId} /> : null}
      {activeTab === "Wallet" ? <WalletTab accountId={accountId} /> : null}
      {activeTab === "Audit Log" ? <AuditLogTab accountId={accountId} /> : null}

      {pendingCopy ? (
        <ConfirmModal
          title={pendingCopy.title}
          message={pendingCopy.message}
          confirmLabel={actionLoading ? "Please wait…" : pendingCopy.confirmLabel}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={() => void handleDeactivateConfirm()}
          onCancel={() => {
            if (!actionLoading) setPendingAction(null);
          }}
        />
      ) : null}

      {pendingAction === "suspend" || pendingAction === "reactivate" ? (
        <CustomerAccountActionFormModal
          action={pendingAction}
          loading={actionLoading}
          onClose={() => {
            if (!actionLoading) setPendingAction(null);
          }}
          onSubmit={(reason, notes) => void handleSuspendReactivateSubmit(reason, notes)}
        />
      ) : null}

      {successMessage ? (
        <SuccessModal
          message={successMessage}
          confirmLabel="Done"
          onContinue={() => setSuccessMessage(null)}
        />
      ) : null}
    </div>
  );
}

function CustomerAccountActionFormModal({
  action,
  loading,
  onClose,
  onSubmit,
}: {
  action: "suspend" | "reactivate";
  loading: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const copy = ACTION_COPY[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-8 pt-6 shadow-xl">
        <h2 className="text-[17px] font-bold text-brand-navy">{copy.title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{copy.message}</p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reason.trim()) return;
            if (action === "suspend" && !notes.trim()) return;
            onSubmit(reason, notes);
          }}
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Reason</label>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={reason}
              disabled={loading}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required"
              required
            />
          </div>
          {action === "suspend" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">Internal notes</label>
              <textarea
                className="min-h-[80px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={notes}
                disabled={loading}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Required"
                required
              />
            </div>
          ) : null}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 rounded-full bg-outline py-3 text-sm font-semibold text-primary-text hover:bg-zinc-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !reason.trim() ||
                (action === "suspend" && !notes.trim())
              }
              className={`flex-1 rounded-full py-3 text-sm font-semibold text-primary-text disabled:opacity-50 ${
                action === "reactivate" ? "bg-primary-green hover:opacity-90" : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {loading ? "Please wait…" : copy.confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomerDetailsTab({
  accountId,
  profile,
  loading,
}: {
  accountId: string;
  profile: Record<string, unknown> | null;
  loading: boolean;
}) {
  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Loading customer details…</p>;
  }
  const p = profile ?? {};
  const name =
    [pickStr(p, ["firstName", "first_name"]), pickStr(p, ["lastName", "last_name"])].filter(Boolean).join(" ").trim() ||
    pickStr(p, ["fullName", "full_name", "name", "customerName"]) ||
    "—";
  const username = pickStr(p, ["username", "userName", "handle"]) || "—";
  const email = pickStr(p, ["email", "emailAddress"]) || "—";
  const phone = pickStr(p, ["phone", "phoneNumber", "mobile"]) || "—";
  const onboard = p.createdAt ?? p.created_at ?? p.dateOnboarded ?? p.onboardedAt;
  const displayId = pickStr(p, ["accountId", "id", "uuid"]) || accountId;

  const password = pickCustomerPasswordStatus(p);
  const pin = pickCustomerPinStatus(p);
  const kycRaw = p.kycLevel ?? p.kyc_level ?? p.kycTier;
  const kycLevel = kycRaw !== undefined && kycRaw !== null ? String(kycRaw) : "—";
  const acctStatus = pickStr(p, ["accountStatus", "account_status", "status"]) || "—";
  const lastTx = p.lastTransactedAt ?? p.lastTransactionAt ?? p.dateTransactedLast ?? p.last_activity_at;
  const secQ = pickCustomerSecurityQuestionStatus(p);

  return (
    <>
      <section className="mt-6">
        <h2 className="text-[18px] font-semibold text-primary-text">Customer Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Account ID</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Customer Name</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Username</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Phone Number</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Email Address</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date Onboarded</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-r border-outline px-4 py-5 font-medium text-gray-900 underline underline-offset-2">{displayId}</td>
                <td className="border-r border-outline px-4 py-5 text-primary-text">{name}</td>
                <td className="border-r border-outline px-4 py-5 text-zinc-500">{username}</td>
                <td className="border-r border-outline px-4 py-5 text-zinc-500">{phone}</td>
                <td className="border-r border-outline px-4 py-5 text-zinc-500">{email}</td>
                <td className="whitespace-nowrap px-4 py-5 text-zinc-500">{formatWhen(onboard)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <div className="overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-outline px-4 py-3 font-medium">Password</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Transaction PIN</th>
                <th className="border-b border-outline px-4 py-3 font-medium">KYC Level</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Account Status</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Date Transacted Last</th>
                <th className="border-b border-outline px-4 py-3 font-medium">Security Question</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-r border-outline px-4 py-5">
                  <SetBadge value={password} />
                </td>
                <td className="border-r border-outline px-4 py-5">
                  <SetBadge value={pin} />
                </td>
                <td className="border-r border-outline px-4 py-5 text-zinc-500">{kycLevel}</td>
                <td className="border-r border-outline px-4 py-5">
                  <AccountStatusBadge status={acctStatus} />
                </td>
                <td className="border-r border-outline whitespace-nowrap px-4 py-5 text-zinc-500">
                  {formatWhen(lastTx)}
                </td>
                <td className="px-4 py-5">
                  <SetBadge value={secQ} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SetBadge({ value }: { value: "Set" | "Not Set" }) {
  return (
    <span className={`text-sm font-medium ${value === "Set" ? "text-green-600" : "text-red-500"}`}>
      {value}
    </span>
  );
}

function AccountStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-500";
  if (key.includes("active")) cls = "bg-green-50 text-green-600";
  else if (key.includes("block") || key.includes("pnd") || key.includes("lien") || key.includes("suspend"))
    cls = "bg-red-50 text-red-500";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function TxStatusBadge({ status }: { status: string }) {
  const k = status.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-600";
  if (k.includes("success") || k.includes("complete")) cls = "bg-green-50 text-green-600";
  else if (k.includes("pend")) cls = "bg-orange-50 text-orange-500";
  else if (k.includes("fail")) cls = "bg-red-50 text-red-500";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function TransactionHistoryTab({
  accountId,
  customerDisplayName,
  profile,
}: {
  accountId: string;
  customerDisplayName?: string;
  profile: Record<string, unknown> | null;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [rows, setRows] = useState<AdminCustomerTransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const p = profile ?? {};
  const inflow = pickNum(p, ["totalInflow", "total_inflow", "inflow", "inflows", "totalInflowAmount"]) ?? 100000;
  const outflow = pickNum(p, ["totalOutflow", "total_outflow", "outflow", "outflows", "totalOutflowAmount"]) ?? 50000;
  const balance = pickNum(p, ["balance", "availableBalance", "available_balance", "walletBalance", "totalBalance"]) ?? 150000;

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getAdminCustomerTransactions(accountId, {
        page,
        pageSize,
        customerDisplayName: customerDisplayName || undefined,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e) {
      setRows([]);
      setTotal(0);
      setError(e instanceof AdminApiError ? e.message : "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }, [accountId, page, pageSize, customerDisplayName]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const visible = q
    ? rows.filter(
        (r) =>
          r.referenceNo.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q),
      )
    : rows;

  const toggleSelectAll = () => {
    if (selectedIds.length === visible.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visible.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runExport = async (format: "csv" | "json" | "pdf") => {
    try {
      const res = await getAdminCustomerTransactions(accountId, {
        page: 1,
        pageSize: 100,
        customerDisplayName: customerDisplayName || undefined,
      });
      exportClientTable(`customer-${accountId}-transactions`, format, res.items, [
        { header: "Reference No", value: (r) => r.referenceNo },
        { header: "Customer Name", value: (r) => r.customerName },
        { header: "Channel", value: (r) => r.channel },
        { header: "Amount", value: (r) => r.amount },
        { header: "Provider", value: (r) => r.provider },
        { header: "Status", value: (r) => r.status },
        { header: "Date", value: (r) => r.date },
      ]);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const safePage = Math.min(page, Math.max(1, Math.ceil(Math.max(total, 1) / pageSize)));

  return (
    <>
      {/* 3-Card Summary Grid */}
      <div className="mt-6 flex min-w-0 gap-3">
        <StatCard
          label="Total Available Balance"
          value={`₦${balance.toLocaleString()}`}
          accentColor="#8BE300"
          icon={<Wallet size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Amount Inflow"
          value={`₦${inflow.toLocaleString()}`}
          accentColor="#3B82F6"
          icon={<CardReceive size={20} variant="Outline" color="#0B294F" />}
        />
        <StatCard
          label="Total Amount Outflow"
          value={`₦${outflow.toLocaleString()}`}
          accentColor="#EF4444"
          icon={<CardSend size={20} variant="Outline" color="#0B294F" />}
        />
      </div>

      {/* Toolbar / Search Section */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white px-4 py-3">
        <div className="flex items-center gap-4 flex-1 min-w-[280px]">
          <span className="shrink-0 text-[15px] font-semibold text-primary-text">
            All Transactions ({total.toLocaleString()})
          </span>
          <div className="w-full max-w-[280px]">
            <AuditTrailIconSearch
              variant="toolbar"
              placeholder="Search by Reference No"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-surface-subtle"
          >
            <ListFilter size={18} strokeWidth={2} />
            Filter
          </button>
          <TableExportMenu
            disabled={visible.length === 0}
            onExportCsv={() => void runExport("csv")}
            onExportPdf={() => void runExport("pdf")}
            onExportJson={() => void runExport("json")}
          />
        </div>
      </div>

      <ErrorAlert error={error} onRetry={() => void load()} />

      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-outline text-xs text-zinc-400">
              <th className="w-12 border-b border-zinc-200 px-4 py-0 align-middle">
                <input
                  type="checkbox"
                  checked={selectedIds.length === visible.length && visible.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-zinc-300 accent-secondary-green cursor-pointer"
                  aria-label="Select all transactions"
                />
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                <span className="inline-flex items-center gap-1">
                  Reference No
                  <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 13l-7 7-7-7" />
                  </svg>
                </span>
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Customer Names</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Channel</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Amount</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Provider</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  No transactions.
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                  <td className="w-12 border-b border-zinc-100 px-4 py-0 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelectOne(row.id)}
                      className="h-4 w-4 rounded border-zinc-300 accent-secondary-green cursor-pointer"
                      aria-label={`Select transaction ${row.referenceNo}`}
                    />
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle font-medium text-grey-900 underline underline-offset-2 hover:opacity-80">
                    <Link href={`/dashboard/transactions/${encodeURIComponent(row.referenceNo)}`}>
                      {row.referenceNo}
                    </Link>
                  </td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.customerName}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.channel}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.amount}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.provider}</td>
                  <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                    <TxStatusBadge status={row.status} />
                  </td>
                  <td className="h-16 whitespace-nowrap border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">
                    {row.date.replace(/,\s*/, " | ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!q ? (
        <AuditTrailPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Clear search to use server pagination.</p>
      )}
    </>
  );
}

const WALLET_ASSET_META: Record<string, { name: string; code: string; bgClass: string; textClass: string }> = {
  BTC: { name: "Bitcoin", code: "BTC", bgClass: "bg-[#F7931A]", textClass: "text-white" },
  ETH: { name: "Ethereum", code: "ETH", bgClass: "bg-[#E5E7EB]", textClass: "text-[#374151]" },
  ADA: { name: "Cardano", code: "ADA", bgClass: "bg-[#EEF2FF]", textClass: "text-[#1D4ED8]" },
  TRX: { name: "Tron", code: "TRX", bgClass: "bg-[#EF4444]", textClass: "text-white" },
  SOL: { name: "Solana", code: "SOL", bgClass: "bg-[#EDE9FE]", textClass: "text-[#7C3AED]" },
  USDT: { name: "Tether", code: "USDT", bgClass: "bg-[#10B981]", textClass: "text-white" },
};

function pickWalletDisplayMeta(wallet: AdminCustomerWalletItem) {
  const rawType = String(wallet.walletType ?? "").trim();
  const rawCurrency = String(wallet.currency ?? "").trim().toUpperCase();
  const code = rawCurrency || (rawType ? rawType.slice(0, 6).toUpperCase() : "WALLET");
  const known = WALLET_ASSET_META[code];
  if (known) return known;

  if (rawType) {
    return {
      name: rawType,
      code,
      bgClass: "bg-zinc-200",
      textClass: "text-zinc-700",
    };
  }

  return {
    name: code,
    code,
    bgClass: "bg-zinc-200",
    textClass: "text-zinc-700",
  };
}

function WalletTab({ accountId }: { accountId: string }) {
  const [wallets, setWallets] = useState<AdminCustomerWalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminCustomerWallets(accountId);
        if (cancelled) return;
        setWallets(res.wallets ?? []);
      } catch (e) {
        if (!cancelled) {
          setWallets([]);
          setError(e instanceof AdminApiError ? e.message : "Could not load wallets.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const handleCopy = (text: string, idx: number) => {
    void navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  if (loading) return <p className="mt-6 text-sm text-zinc-500">Loading wallets…</p>;
  if (error)
    return (
      <p className="mt-6 text-sm text-red-700" role="alert">
        {error}
      </p>
    );

  if (wallets.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">No wallets for this customer.</p>;
  }

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-zinc-100 bg-white">
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-[18px] font-semibold text-primary-text">Wallet Details</h2>
        </div>
        {wallets.map((w, idx) => {
          const display = pickWalletDisplayMeta(w);
          const addr =
            pickStr(w as unknown as Record<string, unknown>, ["address", "walletAddress", "publicKey"]) ||
            w.walletId ||
            "—";
          return (
            <div
              key={`${w.walletId ?? idx}`}
              className={`grid grid-cols-[220px_1fr] items-center gap-3 px-5 py-3 ${idx < wallets.length - 1 ? "border-b border-zinc-100" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${display.bgClass} ${display.textClass}`}
                >
                  {display.code.slice(0, 1)}
                </span>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-primary-text">{display.name}</span>
                  <span className="text-[11px] font-medium text-zinc-400">{display.code}</span>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-zinc-700" title={addr}>
                  {addr}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(addr, idx)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
                  aria-label="Copy address"
                >
                  {copiedIdx === idx ? <span className="text-xs font-medium text-green-600">✓</span> : <Copy size={16} variant="Outline" color="currentColor" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function KycDetailsTab({ accountId }: { accountId: string }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const k = await getAdminCustomerKyc(accountId);
        if (!cancelled) setData(k);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof AdminApiError ? e.message : "Could not load KYC.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (loading) return <p className="mt-6 text-sm text-zinc-500">Loading KYC…</p>;
  if (error)
    return (
      <p className="mt-6 text-sm text-red-700" role="alert">
        {error}
      </p>
    );

  if (data == null) return <p className="mt-6 text-sm text-zinc-500">No KYC data.</p>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="mt-6 text-sm text-zinc-500">No KYC records.</p>;
    const first = data[0];
    if (first && typeof first === "object") {
      const keys = Object.keys(first as object);
      return (
        <section className="mt-6 overflow-x-auto rounded-xl border border-outline bg-white">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                {keys.map((k) => (
                  <th key={k} className="border-b border-outline px-4 py-3 font-medium">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {keys.map((k) => (
                    <td key={k} className="border-b border-zinc-100 px-4 py-3 text-zinc-600">
                      {formatCell((row as Record<string, unknown>)[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    }
  }

  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    return (
      <section className="mt-6 space-y-6">
        {Object.entries(o).map(([section, val]) => (
          <div key={section}>
            <h3 className="text-[16px] font-semibold capitalize text-primary-text">{section.replace(/_/g, " ")}</h3>
            <div className="mt-2 rounded-xl border border-outline bg-white p-4 text-sm text-zinc-600">
              {typeof val === "object" ? <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(val, null, 2)}</pre> : String(val)}
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <pre className="mt-6 overflow-x-auto rounded-xl border border-outline bg-white p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function AuditLogTab({ accountId }: { accountId: string }) {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getAdminAuditCustomerLogs(accountId);
        if (!cancelled) setLogs(list);
      } catch (e) {
        if (!cancelled) {
          setLogs([]);
          setError(e instanceof AdminApiError ? e.message : "Could not load audit log.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (loading) return <p className="mt-6 text-sm text-zinc-500">Loading audit log…</p>;
  if (error)
    return (
      <p className="mt-6 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  if (logs.length === 0) return <p className="mt-6 text-sm text-zinc-500">No audit entries.</p>;

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const toOrdinal = (n: number) => {
    const rem10 = n % 10;
    const rem100 = n % 100;
    if (rem10 === 1 && rem100 !== 11) return `${n}st`;
    if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
    if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
    return `${n}th`;
  };
  const formatBadgeTime = (time: string) => {
    const d = new Date(time);
    if (Number.isNaN(d.getTime())) return time || "—";
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  };
  const formatGroupLabel = (d: Date) => {
    const base = `${toOrdinal(d.getDate())} ${d.toLocaleDateString(undefined, { month: "long" })}, ${d.getFullYear()}`;
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfRow = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayDiff = Math.round((startOfToday.getTime() - startOfRow.getTime()) / 86400000);
    if (dayDiff === 0) return `Today - ${base}`;
    if (dayDiff === 1) return `Yesterday - ${base}`;
    return base;
  };

  const normalized = logs.map((log, idx) => {
    const time = pickStr(log, ["timestamp", "createdAt", "created_at", "time", "date"]);
    const message = pickStr(log, ["message", "action", "description", "event", "type"]);
    const ua = pickStr(log, ["userAgent", "user_agent", "browser"]);
    const ip = pickStr(log, ["ip", "ipAddress", "ip_address", "clientIp"]);
    const parsed = time ? new Date(time) : null;
    const hasValidDate = Boolean(parsed && !Number.isNaN(parsed.getTime()));
    const dayLabel = hasValidDate ? formatGroupLabel(parsed!) : "Unknown date";
    return {
      id: `${idx}-${time}-${message}`,
      time,
      message,
      ua,
      ip,
      dayLabel,
      raw: log,
    };
  });

  const q = search.trim().toLowerCase();
  const visible = q
    ? normalized.filter((row) =>
        [row.message, row.ua, row.ip, row.time].join(" ").toLowerCase().includes(q),
      )
    : normalized;

  const groups = visible.reduce(
    (acc, row) => {
      if (!acc[row.dayLabel]) acc[row.dayLabel] = [];
      acc[row.dayLabel].push(row);
      return acc;
    },
    {} as Record<string, typeof visible>,
  );

  return (
    <section className="mt-6">
      <AuditTrailToolbar
        className="rounded-xl border border-zinc-100 bg-[#FAFAFA] px-3 py-2.5"
        title="Activities"
        tableSearch={search}
        onTableSearchChange={setSearch}
        onFilterClick={() => {}}
        rightSlot={
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-surface-subtle"
          >
            Jan 6, 2024 - Jan 6, 2024
          </button>
        }
        exportDisabled={visible.length === 0}
        onExportCsv={() =>
          exportClientTable(`customer-${accountId}-audit-log`, "csv", visible, [
            { header: "Timestamp", value: (r) => r.time || "—" },
            { header: "Activity", value: (r) => r.message || JSON.stringify(r.raw) },
            { header: "User Agent", value: (r) => r.ua || "—" },
            { header: "IP", value: (r) => r.ip || "—" },
          ])
        }
        onExportPdf={() =>
          exportClientTable(`customer-${accountId}-audit-log`, "pdf", visible, [
            { header: "Timestamp", value: (r) => r.time || "—" },
            { header: "Activity", value: (r) => r.message || JSON.stringify(r.raw) },
            { header: "User Agent", value: (r) => r.ua || "—" },
            { header: "IP", value: (r) => r.ip || "—" },
          ])
        }
        onExportJson={() =>
          exportClientTable(`customer-${accountId}-audit-log`, "json", visible, [
            { header: "Timestamp", value: (r) => r.time || "—" },
            { header: "Activity", value: (r) => r.message || JSON.stringify(r.raw) },
            { header: "User Agent", value: (r) => r.ua || "—" },
            { header: "IP", value: (r) => r.ip || "—" },
          ])
        }
      />

      <div className="mt-5 space-y-7">
        {Object.entries(groups).map(([dayLabel, rows]) => (
          <div key={dayLabel}>
            <h3 className="mb-3 text-[18px] leading-none font-medium text-zinc-900">
              {dayLabel}
            </h3>
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[132px_1fr_230px_120px] items-center gap-4 rounded-xl bg-[#FAFAFA] px-4 py-4 text-sm"
                >
                  <span className="inline-flex w-fit rounded-md bg-[#ECEFF1] px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {row.time ? formatBadgeTime(row.time) : "—"}
                  </span>
                  <span className="truncate text-[14px] text-zinc-700">{row.message || JSON.stringify(row.raw)}</span>
                  <span className="truncate text-[14px] text-zinc-700">{row.ua || "—"}</span>
                  <span className="text-right text-[14px] text-zinc-700">{row.ip || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
