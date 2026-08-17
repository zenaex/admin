import { adminRequest } from "@/lib/admin-api/client";
import {
  giftcardMocksEnabled,
  isGiftcardMockSubmissionId,
  mockGiftcardAdjust,
  mockGiftcardApprove,
  mockGiftcardDecline,
  mockGiftcardECode,
} from "@/lib/admin-api/giftcard-mock-transactions";
import type { AdminGiftcardAdjustBody, AdminGiftcardDeclineBody, AdminGiftcardECodeResult } from "@/lib/admin-api/types";
import {
  asRecord,
  pickNestedRecord,
  pickString,
  unwrapTransactionRecord,
} from "@/lib/admin-api/transactions-api";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function submissionPath(id: string, action: "approve" | "decline" | "e-code"): string {
  const enc = encodeURIComponent(id.trim());
  return `/admin/transactions/gift-cards/submissions/${enc}/${action}`;
}

/** Submission UUID for gift-card POST paths (never route `reference`). */
export function resolveGiftcardSubmissionId(raw: Record<string, unknown>): string {
  const o = unwrapTransactionRecord(raw);

  const direct =
    pickString(o, ["submissionId", "submission_id", "giftCardSubmissionId"]) ||
    pickString(pickNestedRecord(o, ["submission"]) ?? {}, ["id"]) ||
    pickString(pickNestedRecord(o, ["giftCardSubmission", "gift_card_submission"]) ?? {}, ["id"]);

  if (direct && isUuid(direct)) return direct;

  const topId = pickString(o, ["id"]);
  if (topId && isUuid(topId)) return topId;

  throw new Error("Missing submission ID");
}

export async function postGiftcardSubmissionApprove(submissionId: string): Promise<void> {
  if (giftcardMocksEnabled() && isGiftcardMockSubmissionId(submissionId)) {
    mockGiftcardApprove(submissionId);
    return;
  }
  await adminRequest<unknown>(submissionPath(submissionId, "approve"), {
    method: "POST",
    auth: true,
  });
}

export type GiftcardDeclineUploadUrlResponse = {
  uploadUrl?: string;
  url?: string;
  imageKey?: string;
  imageUrl?: string;
};

/** `POST /admin/transactions/gift-cards/submissions/decline/upload-url` — Presigned URL for rejection proof */
export async function postGiftcardDeclineUploadUrl(body?: {
  filename?: string;
  contentType?: string;
}): Promise<GiftcardDeclineUploadUrlResponse> {
  if (giftcardMocksEnabled()) {
    return {
      uploadUrl: "https://example.com/mock-upload",
      imageUrl: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?auto=format&fit=crop&q=80&w=600",
    };
  }
  return adminRequest<GiftcardDeclineUploadUrlResponse>(
    "/admin/transactions/gift-cards/submissions/decline/upload-url",
    {
      method: "POST",
      auth: true,
      body: body ? JSON.stringify(body) : undefined,
    },
  );
}

/** `POST /admin/transactions/gift-cards/submissions/{id}/decline` — Reject giftcard submission */
export async function postGiftcardSubmissionDecline(
  submissionId: string,
  body: AdminGiftcardDeclineBody,
): Promise<void> {
  const reason = body.reason.trim();
  if (!reason) {
    throw new Error("Reason is required");
  }
  if (giftcardMocksEnabled() && isGiftcardMockSubmissionId(submissionId)) {
    mockGiftcardDecline(submissionId, reason);
    return;
  }
  const enc = encodeURIComponent(submissionId.trim());
  await adminRequest<unknown>(`/admin/transactions/gift-cards/submissions/${enc}/decline`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      reason,
      proofImageUrl: body.proofImageUrl || body.imageUrl,
      imageUrl: body.imageUrl || body.proofImageUrl,
      imageKey: body.imageKey,
    }),
  });
}

function normalizeECodePayload(data: unknown): string {
  if (typeof data === "string" && data.trim()) return data.trim();
  const r = asRecord(data);
  if (!r) return "";
  const inner = asRecord(r.data);
  const o = inner ?? r;
  return (
    pickString(o, ["eCode", "e_code", "code", "decryptedCode", "decrypted_code", "value"]) ||
    pickString(r, ["eCode", "e_code", "code", "decryptedCode", "value"]) ||
    ""
  );
}

export async function postGiftcardSubmissionECode(
  submissionId: string,
): Promise<AdminGiftcardECodeResult> {
  if (giftcardMocksEnabled() && isGiftcardMockSubmissionId(submissionId)) {
    const code = mockGiftcardECode(submissionId);
    if (!code) throw new Error("No e-code returned");
    return { code };
  }
  const data = await adminRequest<unknown>(submissionPath(submissionId, "e-code"), {
    method: "POST",
    auth: true,
  });
  const code = normalizeECodePayload(data);
  if (!code) {
    throw new Error("No e-code returned");
  }
  return { code };
}

export async function postGiftcardSubmissionAdjust(
  submissionId: string,
  body: AdminGiftcardAdjustBody,
): Promise<unknown> {
  const enc = encodeURIComponent(submissionId.trim());
  if (giftcardMocksEnabled() && isGiftcardMockSubmissionId(submissionId)) {
    mockGiftcardAdjust(submissionId, body.faceValueCents);
    return { success: true };
  }
  return adminRequest<unknown>(`/admin/transactions/gift-cards/submissions/${enc}/adjust`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}
