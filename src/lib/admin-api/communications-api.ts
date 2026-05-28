/**
 * Admin Communications API — `/admin/communications` endpoints.
 */
import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminCampaign,
  AdminCampaignListResult,
  AdminCampaignStatus,
  AdminCreateCampaignBody,
} from "@/lib/admin-api/types";

/* ── Helpers ── */

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickStr(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function formatDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }).replace(",", " |");
}

function normalizeCampaignStatus(s: string): AdminCampaignStatus {
  if (!s) return "Unpublished";
  const status = s.toLowerCase();
  if (status === "publish" || status === "published" || status === "active") return "Publish";
  if (status === "pending" || status === "scheduled") return "Pending";
  return "Unpublished"; // covers draft/cancelled/etc.
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  for (const key of ["data", "items", "campaigns", "results", "records", "list", "content"]) {
    const v = r[key];
    if (Array.isArray(v)) return v;
  }
  const inner = asRecord(r.data);
  if (inner) {
    for (const key of ["items", "campaigns", "results"]) {
      const v = inner[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function extractTotal(data: unknown, fallback: number): number {
  const r = asRecord(data);
  if (!r) return fallback;
  for (const key of ["total", "totalCount", "count", "totalItems", "totalElements"]) {
    const v = r[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  }
  const inner = asRecord(r.data) ?? asRecord(r.meta) ?? asRecord(r.pagination);
  if (inner) {
    for (const key of ["total", "totalCount", "count"]) {
      const v = inner[key];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
    }
  }
  return fallback;
}

/* ── Normalizer ── */

export function normalizeCampaign(raw: unknown): AdminCampaign | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickStr(o, ["id", "campaignId", "uuid"]);
  if (!id) return null;

  const title = pickStr(o, ["title", "campaignName", "campaign", "name"]) || "Untitled Campaign";
  const description = pickStr(o, ["description", "desc", "subtitle"]) || "";
  const statusRaw = pickStr(o, ["status", "campaignStatus", "state"]) || "Draft";
  const status = normalizeCampaignStatus(statusRaw);

  const campaignCategory = pickStr(o, ["campaignCategory", "campaign_category", "category"]) || "Transactional";
  const campaignSubCategory = pickStr(o, ["campaignSubCategory", "campaign_sub_category", "subCategory"]) || "Vouchers offers";
  const targetAudience = pickStr(o, ["targetAudience", "target_audience", "audience"]) || "Transaction level";
  const targetSubCategory = pickStr(o, ["targetSubCategory", "target_sub_category", "targetSub"]) || "Tech support";
  
  const communicationCategory = pickStr(o, ["communicationCategory", "communication_category", "channel"]) || "In-app";
  const content = pickStr(o, ["content", "body", "editorHtml", "editor_html", "message"]) || "";
  const imageUrl = pickStr(o, ["imageUrl", "image_url", "image", "uploadedImage"]) || undefined;

  const scheduleModeRaw = pickStr(o, ["scheduleMode", "schedule_mode", "mode"]) || "Immediate";
  const scheduleMode = (scheduleModeRaw === "Scheduled" || scheduleModeRaw === "Recurring" ? scheduleModeRaw : "Immediate") as "Immediate" | "Scheduled" | "Recurring";
  const period = pickStr(o, ["period", "frequency", "interval"]) || "Daily";

  const startRaw = pickStr(o, ["startDate", "start_date", "start", "createdAt", "created_at"]);
  const startDate = startRaw ? formatDate(startRaw) : "—";

  const endRaw = pickStr(o, ["endDate", "end_date", "end", "expiresAt", "expires_at"]);
  const endDate = endRaw ? formatDate(endRaw) : "—";

  const lastModRaw = pickStr(o, ["lastModified", "last_modified", "updatedAt", "updated_at"]);
  const lastModified = lastModRaw ? formatDate(lastModRaw) : startDate;

  return {
    id,
    title,
    description,
    campaign: title,
    status,
    campaignCategory,
    campaignSubCategory,
    targetAudience,
    targetSubCategory,
    communicationCategory,
    content,
    imageUrl,
    scheduleMode,
    period,
    startDate,
    endDate,
    lastModified,
  };
}

/* ── Endpoints ── */

/** `GET /admin/communications` — List campaigns with optional filters and pagination. */
export async function getAdminCampaigns(params: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<AdminCampaignListResult> {
  const query = new URLSearchParams();
  if (params.status && params.status !== "All statuses") {
    let backStatus = params.status;
    if (params.status === "Publish") backStatus = "published";
    if (params.status === "Unpublished") backStatus = "draft";
    if (params.status === "Pending") backStatus = "scheduled";
    query.set("status", backStatus);
  }
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);

  const path = `/admin/communications?${query.toString()}`;
  const data = await adminRequest<unknown>(path, { method: "GET" });
  const raw = extractArray(data);
  const items = raw.map(normalizeCampaign).filter((x): x is AdminCampaign => x !== null);
  const total = extractTotal(data, items.length);
  return { items, total };
}

/** `GET /admin/communications/{id}` — Get campaign details. */
export async function getAdminCampaign(id: string): Promise<AdminCampaign | null> {
  const data = await adminRequest<unknown>(`/admin/communications/${encodeURIComponent(id)}`, { method: "GET" });
  const r = asRecord(data);
  const inner = r ? (asRecord(r.data) ?? r) : null;
  return inner ? normalizeCampaign(inner) : null;
}

/** `POST /admin/communications` — Create a new campaign (status: draft). */
export async function createAdminCampaign(body: AdminCreateCampaignBody): Promise<AdminCampaign> {
  const data = await adminRequest<unknown>("/admin/communications", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
  const r = asRecord(data);
  const inner = r ? (asRecord(r.data) ?? r) : null;
  const campaign = inner ? normalizeCampaign(inner) : null;
  if (!campaign) throw new Error("Failed to create campaign");
  return campaign;
}

/** `DELETE /admin/communications/{id}` — Delete a draft campaign. */
export async function deleteAdminCampaign(id: string): Promise<void> {
  await adminRequest(`/admin/communications/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

/** `POST /admin/communications/{id}/publish` — Publish or schedule a campaign. */
export async function publishAdminCampaign(id: string): Promise<void> {
  await adminRequest(`/admin/communications/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    auth: true,
  });
}

/** `POST /admin/communications/{id}/cancel` — Cancel a scheduled campaign. */
export async function cancelAdminCampaign(id: string): Promise<void> {
  await adminRequest(`/admin/communications/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    auth: true,
  });
}
