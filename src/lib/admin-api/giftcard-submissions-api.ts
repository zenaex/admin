import { adminRequest } from "@/lib/admin-api/client";
import type { AdminGiftcardDeclineBody, AdminGiftcardECodeResult } from "@/lib/admin-api/types";
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
  await adminRequest<unknown>(submissionPath(submissionId, "approve"), {
    method: "POST",
    auth: true,
  });
}

export async function postGiftcardSubmissionDecline(
  submissionId: string,
  body: AdminGiftcardDeclineBody,
): Promise<void> {
  const reason = body.reason.trim();
  if (!reason) {
    throw new Error("Reason is required");
  }
  await adminRequest<unknown>(submissionPath(submissionId, "decline"), {
    method: "POST",
    auth: true,
    body: JSON.stringify({ reason }),
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
