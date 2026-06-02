import type {
  AdminTransactionListQuery,
  AdminTransactionListResult,
  AdminTransactionListRow,
} from "@/lib/admin-api/types";
import type { TransactionLogEntry } from "@/lib/admin-api/transaction-detail-mapper";

/** Demo references — open from Transactions list or `/dashboard/transactions/{ref}`. */
export const GIFTCARD_MOCK_REFS = {
  successful: "GC-MOCK-SUCCESS-001",
  pending: "GC-MOCK-PENDING-001",
  rejected: "GC-MOCK-REJECTED-001",
} as const;

export type GiftcardMockScenario = keyof typeof GIFTCARD_MOCK_REFS;

const MOCK_SUBMISSION_IDS: Record<string, string> = {
  [GIFTCARD_MOCK_REFS.successful]: "a1111111-1111-4111-8111-111111111111",
  [GIFTCARD_MOCK_REFS.pending]: "b2222222-2222-4222-8222-222222222222",
  [GIFTCARD_MOCK_REFS.rejected]: "c3333333-3333-4333-8333-333333333333",
};

const REF_BY_SUBMISSION = new Map(
  Object.entries(MOCK_SUBMISSION_IDS).map(([ref, id]) => [id, ref]),
);

type MockRuntimeStatus = "successful" | "pending" | "failed";

type MockRuntime = {
  status: MockRuntimeStatus;
  rejectionReason?: string;
};

const DEFAULT_RUNTIME: Record<string, MockRuntime> = {
  [GIFTCARD_MOCK_REFS.successful]: { status: "successful" },
  [GIFTCARD_MOCK_REFS.pending]: { status: "pending" },
  [GIFTCARD_MOCK_REFS.rejected]: {
    status: "failed",
    rejectionReason: "Card image is blurry and the security code is not visible.",
  },
};

const STORAGE_KEY = "zena-giftcard-mock-runtime";

const SCENARIO_META: Record<
  string,
  {
    customerName: string;
    displayCategory: string;
    product: string;
    cardAmount: number;
    currency: string;
    paidOutNgn: number;
    rateFee: string;
    provider: string;
    opsInCharge: string;
    country: string;
    eCode: string;
  }
> = {
  [GIFTCARD_MOCK_REFS.successful]: {
    customerName: "Naomi Salisu",
    displayCategory: "Amazon Gift Card",
    product: "Amazon Gift Card",
    cardAmount: 250,
    currency: "USD",
    paidOutNgn: 412_500,
    rateFee: "₦1,650/$1",
    provider: "Amazon US",
    opsInCharge: "Florence Arinze",
    country: "United States | USD",
    eCode: "AMZN-GC-DEMO-7842-9901",
  },
  [GIFTCARD_MOCK_REFS.pending]: {
    customerName: "Job Awolowo",
    displayCategory: "iTunes Gift Card",
    product: "iTunes Gift Card",
    cardAmount: 100,
    currency: "USD",
    paidOutNgn: 165_000,
    rateFee: "₦1,650/$1",
    provider: "Apple iTunes",
    opsInCharge: "Ezekiel Olajolo",
    country: "United States | USD",
    eCode: "ITUNES-DEMO-5521-0044",
  },
  [GIFTCARD_MOCK_REFS.rejected]: {
    customerName: "Martha Kalio",
    displayCategory: "Steam Wallet",
    product: "Steam Wallet",
    cardAmount: 50,
    currency: "EUR",
    paidOutNgn: 92_500,
    rateFee: "₦1,850/€1",
    provider: "Steam",
    opsInCharge: "Florence Arinze",
    country: "Germany | EUR",
    eCode: "STEAM-DEMO-9912-7733",
  },
};

function readStoredRuntime(): Record<string, MockRuntime> {
  if (typeof window === "undefined") return { ...DEFAULT_RUNTIME };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RUNTIME };
    const parsed = JSON.parse(raw) as Record<string, MockRuntime>;
    return { ...DEFAULT_RUNTIME, ...parsed };
  } catch {
    return { ...DEFAULT_RUNTIME };
  }
}

function writeStoredRuntime(all: Record<string, MockRuntime>): void {
  if (typeof window === "undefined") return;
  const payload: Record<string, MockRuntime> = {};
  for (const ref of Object.values(GIFTCARD_MOCK_REFS)) {
    payload[ref] = all[ref] ?? DEFAULT_RUNTIME[ref];
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function getRuntime(ref: string): MockRuntime {
  const all = readStoredRuntime();
  return all[ref] ?? DEFAULT_RUNTIME[ref] ?? { status: "pending" };
}

function setRuntime(ref: string, next: MockRuntime): void {
  const all = readStoredRuntime();
  all[ref] = next;
  writeStoredRuntime(all);
}

export function giftcardMocksEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_GIFTCARD_MOCKS?.trim();
  if (flag === "false") return false;
  if (flag === "true") return true;
  return process.env.NODE_ENV === "development";
}

export function isGiftcardMockReference(reference: string): boolean {
  const ref = reference.trim();
  return Object.values(GIFTCARD_MOCK_REFS).includes(ref as (typeof GIFTCARD_MOCK_REFS)[GiftcardMockScenario]);
}

export function isGiftcardMockSubmissionId(submissionId: string): boolean {
  return REF_BY_SUBMISSION.has(submissionId.trim());
}

function statusForApi(runtime: MockRuntime): string {
  if (runtime.status === "successful") return "successful";
  if (runtime.status === "pending") return "pending";
  return "failed";
}

function buildLogs(ref: string, runtime: MockRuntime): TransactionLogEntry[] {
  const meta = SCENARIO_META[ref];
  const entries: TransactionLogEntry[] = [
    { step: 1, title: "Giftcard uploaded by customer", date: "Jun 2, 2026 | 9:32AM" },
    { step: 2, title: "Queued for admin review", date: "Jun 2, 2026 | 9:33AM" },
  ];
  if (runtime.status === "successful") {
    entries.push({
      step: 3,
      title: `Approved — ${meta?.displayCategory ?? "Giftcard"}`,
      date: "Jun 2, 2026 | 9:45AM",
    });
    entries.push({
      step: 4,
      title: "Payout completed",
      date: "Jun 2, 2026 | 9:46AM",
    });
    return entries;
  }
  if (runtime.status === "pending") {
    entries.push({
      step: 3,
      title: "Awaiting admin approval",
      date: "Jun 2, 2026 | 9:34AM",
    });
    return entries;
  }
  entries.push({
    step: 3,
    title: runtime.rejectionReason
      ? `Rejected — ${runtime.rejectionReason}`
      : "Rejected by admin",
    date: "Jun 2, 2026 | 10:05AM",
  });
  return entries;
}

function buildDetailRaw(reference: string): Record<string, unknown> {
  const ref = reference.trim();
  const meta = SCENARIO_META[ref];
  if (!meta) return {};

  const runtime = getRuntime(ref);
  const submissionId = MOCK_SUBMISSION_IDS[ref] ?? "";
  const initiated = "2026-06-02T09:32:00.000Z";
  const completed =
    runtime.status === "pending" ? initiated : "2026-06-02T09:46:00.000Z";

  return {
    reference: ref,
    status: statusForApi(runtime),
    categorySlug: "gift-card",
    displayCategory: meta.displayCategory,
    productSlug: meta.product.toLowerCase().replace(/\s+/g, "-"),
    product: meta.product,
    customerName: meta.customerName,
    amount: meta.cardAmount,
    currency: meta.currency,
    amountPaidOut: meta.paidOutNgn,
    paidOut: meta.paidOutNgn,
    rate: meta.rateFee,
    rateFeeGiven: meta.rateFee,
    balanceAfterGift: "₦2,450,000.00",
    country: meta.country,
    giftcardType: meta.displayCategory,
    provider: meta.provider,
    opsInCharge: meta.opsInCharge,
    assignedTo: meta.opsInCharge,
    sessionId: `SES-GC-${ref.slice(-3)}`,
    createdAt: initiated,
    completedAt: completed,
    uploadedAt: initiated,
    dateUploaded: initiated,
    device: "iPhone 15 Pro",
    deviceId: "c83738d53yedhd",
    location: "Lagos, Nigeria",
    locationCoordinate: "Lat: 6.5244, Lng: 3.3792",
    submissionId,
    giftCardSubmissionId: submissionId,
    giftCardSubmission: { id: submissionId },
    code: runtime.status === "successful" ? "" : "••••-••••-••••",
    rejectionMessage: runtime.rejectionReason ?? "",
    rejectionReason: runtime.rejectionReason ?? "",
    logs: buildLogs(ref, runtime).map((e) => ({
      step: e.step,
      title: e.title,
      message: e.title,
      createdAt: baseDateFromStep(e.step),
    })),
  };
}

function baseDateFromStep(step: number): string {
  const minutes = 32 + step;
  return `2026-06-02T09:${String(minutes).padStart(2, "0")}:00.000Z`;
}

export function getGiftcardMockDetail(reference: string): Record<string, unknown> {
  return buildDetailRaw(reference);
}

export function getGiftcardMockLogs(reference: string): TransactionLogEntry[] {
  const ref = reference.trim();
  return buildLogs(ref, getRuntime(ref));
}

function buildListRaw(ref: string): Record<string, unknown> {
  const detail = buildDetailRaw(ref);
  return {
    ...detail,
    reference: ref,
    id: ref,
  };
}

function listStatusLabel(runtime: MockRuntime): string {
  if (runtime.status === "successful") return "Successful";
  if (runtime.status === "pending") return "Pending";
  return "Failed";
}

export function buildGiftcardMockListRows(): AdminTransactionListRow[] {
  return Object.values(GIFTCARD_MOCK_REFS).map((ref) => {
    const meta = SCENARIO_META[ref];
    const runtime = getRuntime(ref);
    const raw = buildListRaw(ref);
    return {
      id: ref,
      refNo: ref,
      customerName: meta.customerName,
      channel: "Giftcard",
      product: meta.product,
      amount: `${meta.currency} ${meta.cardAmount.toLocaleString()}`,
      provider: meta.provider,
      status: listStatusLabel(runtime),
      date: "Jun 2, 2026 | 9:32AM",
      dateSortKey: "2026-06-02T09:32:00.000Z",
      raw,
    };
  });
}

export function mergeGiftcardMockTransactions(
  result: AdminTransactionListResult,
  query?: AdminTransactionListQuery,
): AdminTransactionListResult {
  const page = query?.page ?? 1;
  if (page !== 1) return result;

  const tab = query?.tab?.trim();
  if (tab && tab !== "gift-card") return result;

  const mockRows = buildGiftcardMockListRows();
  const existingRefs = new Set(result.items.map((r) => r.refNo));
  const toAdd = mockRows.filter((r) => !existingRefs.has(r.refNo));
  if (toAdd.length === 0) return result;

  return {
    ...result,
    items: [...toAdd, ...result.items],
    total: result.total + toAdd.length,
  };
}

export function mockGiftcardApprove(submissionId: string): void {
  const ref = REF_BY_SUBMISSION.get(submissionId.trim());
  if (!ref) return;
  setRuntime(ref, { status: "successful" });
}

export function mockGiftcardDecline(submissionId: string, reason: string): void {
  const ref = REF_BY_SUBMISSION.get(submissionId.trim());
  if (!ref) return;
  setRuntime(ref, { status: "failed", rejectionReason: reason.trim() || "Declined by admin." });
}

export function mockGiftcardECode(submissionId: string): string {
  const ref = REF_BY_SUBMISSION.get(submissionId.trim());
  if (!ref) return "";
  return SCENARIO_META[ref]?.eCode ?? "DEMO-ECODE-0000";
}

/** Reset demo pending → approve/reject flow (browser only). */
export function resetGiftcardMockRuntime(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
