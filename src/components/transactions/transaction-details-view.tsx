"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2, DocumentDownload } from "iconsax-react";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AdminApiError } from "@/lib/admin-api/client";
import { getAdminTransactionDetail } from "@/lib/admin-api/transactions-api";

type DetailTab = "Transaction Details" | "Transaction Log";
const TABS: DetailTab[] = ["Transaction Details", "Transaction Log"];

type TransactionDetailsViewProps = {
  id?: string;
};

function pickStatus(data: Record<string, unknown>): string {
  const raw = data.status ?? data.state ?? data.outcome;
  if (typeof raw === "string" && raw.trim()) {
    const t = raw.replace(/_/g, " ").trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return "—";
}

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function extractLogEntries(data: Record<string, unknown>): Record<string, unknown>[] {
  for (const key of ["logs", "timeline", "events", "transactionLog", "transaction_log", "history"]) {
    const val = data[key];
    if (Array.isArray(val)) {
      return val.map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : { message: String(x) }));
    }
  }
  return [];
}

function ApiStatusBanner({ status }: { status: string }) {
  const key = status.toLowerCase();
  if (key.includes("fail")) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        <strong>Failed!</strong>
      </div>
    );
  }
  if (key.includes("pending")) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
        <strong>Pending!</strong>
      </div>
    );
  }
  if (key.includes("success") || key.includes("complete")) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
        <strong>Successful!</strong>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
      {status}
    </div>
  );
}

function TransactionDetailsFromApi({ data }: { data: Record<string, unknown> }) {
  const skipKeys = new Set(["logs", "timeline", "events", "transactionLog", "transaction_log", "history"]);
  const entries = Object.entries(data).filter(([k]) => !skipKeys.has(k));

  if (entries.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">No detail fields returned.</p>;
  }

  return (
    <section className="mt-6 space-y-6">
      {entries.map(([key, val]) => (
        <div key={key}>
          <h3 className="text-[16px] font-semibold capitalize text-primary-text">{key.replace(/_/g, " ")}</h3>
          <div className="mt-2 rounded-xl border border-outline bg-white p-4 text-sm text-zinc-600">
            {val !== null && typeof val === "object" ? (
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(val, null, 2)}</pre>
            ) : (
              formatCell(val)
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

function TransactionLogFromApi({ data }: { data: Record<string, unknown> }) {
  const entries = extractLogEntries(data);

  if (entries.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">No log entries from API.</p>;
  }

  return (
    <section className="mt-6 rounded-xl border border-outline bg-white px-6 py-8">
      <div className="relative">
        {entries.map((entry, idx) => {
          const isLast = idx === entries.length - 1;
          const title =
            String(entry.title ?? entry.message ?? entry.description ?? entry.action ?? entry.step ?? `Step ${idx + 1}`);
          const date = String(
            entry.date ?? entry.timestamp ?? entry.createdAt ?? entry.created_at ?? "",
          );
          return (
            <div key={idx} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-green text-xs font-bold text-primary-text">
                  {idx + 1}
                </span>
                {!isLast ? <div className="w-px flex-1 bg-zinc-200" /> : null}
              </div>
              <div className={isLast ? "pb-0" : "pb-8"}>
                <p className="text-sm font-semibold leading-8 text-primary-text">{title}</p>
                {date ? <p className="mt-0.5 text-xs text-zinc-400">{date}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TransactionDetailsView({ id }: TransactionDetailsViewProps) {
  const reference = id?.trim() ?? "";
  const [activeTab, setActiveTab] = useState<DetailTab>("Transaction Details");
  const [actionOpen, setActionOpen] = useState(false);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!reference) {
      setError("Missing transaction reference.");
      setDetail(null);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const d = await getAdminTransactionDetail(reference);
      setDetail(d);
    } catch (e) {
      setDetail(null);
      setError(e instanceof AdminApiError ? e.message : "Could not load transaction.");
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const statusLabel = detail ? pickStatus(detail) : "—";

  return (
    <div className="relative pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-1 text-primary-text hover:underline"
          >
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Transactions
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Transaction Details</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setActionOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-primary-text shadow-sm hover:bg-surface-subtle"
            aria-expanded={actionOpen}
            aria-label="Action"
          >
            Action
            <ArrowDown2 size={14} variant="Outline" color="currentColor" />
          </button>

          {actionOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActionOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-[200px] overflow-hidden rounded-[12px] border border-zinc-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[14px] text-primary-text hover:bg-zinc-50"
                  onClick={() => setActionOpen(false)}
                >
                  <DocumentDownload size={16} variant="Outline" color="currentColor" />
                  Download Receipt
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading transaction…</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void loadDetail()}>
            Retry
          </button>{" "}
          <Link href="/dashboard/transactions" className="font-semibold underline">
            Back to list
          </Link>
        </div>
      ) : detail ? (
        <>
          <ApiStatusBanner status={statusLabel} />

          <div className="mt-6">
            <UnderlineTabs
              tabs={TABS.map((t) => ({ id: t, label: t }))}
              active={activeTab}
              onChange={(tabId) => setActiveTab(tabId as DetailTab)}
            />
          </div>

          {activeTab === "Transaction Details" ? <TransactionDetailsFromApi data={detail} /> : null}
          {activeTab === "Transaction Log" ? <TransactionLogFromApi data={detail} /> : null}
        </>
      ) : (
        <p className="text-sm text-zinc-500">No transaction data.</p>
      )}
    </div>
  );
}
