/**
 * Admin Communications API — `/admin/communications` endpoints.
 */
import { adminRequest, AdminApiError } from "@/lib/admin-api/client";
import type {
  AdminCampaign,
  AdminCampaignListResult,
  AdminCampaignStatus,
  AdminCreateCampaignApiBody,
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
  if (
    status === "publish" ||
    status === "published" ||
    status === "active" ||
    status === "live"
  ) {
    return "Publish";
  }
  if (status === "pending" || status === "scheduled") return "Pending";
  if (status === "draft" || status === "unpublished" || status === "cancelled" || status === "canceled") {
    return "Unpublished";
  }
  return "Unpublished";
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  for (const key of ["data", "items", "campaigns", "communications", "results", "records", "list", "content"]) {
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

function pickCampaignId(o: Record<string, unknown>): string {
  return pickStr(o, [
    "id",
    "campaignId",
    "campaign_id",
    "uuid",
    "communicationId",
    "communication_id",
  ]);
}

const CAMPAIGN_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickIdFromResponse(data: unknown): string {
  const visit = (node: unknown, depth: number): string => {
    if (depth > 5 || node == null) return "";
    if (typeof node === "string" && CAMPAIGN_ID_RE.test(node.trim())) return node.trim();
    const r = asRecord(node);
    if (!r) return "";
    const direct = pickCampaignId(r);
    if (direct) return direct;
    for (const val of Object.values(r)) {
      const found = visit(val, depth + 1);
      if (found) return found;
    }
    return "";
  };
  return visit(data, 0);
}

function unwrapCampaignRecord(data: unknown): Record<string, unknown> | null {
  if (data == null) return null;
  const r = asRecord(data);
  if (!r) return null;

  if (pickCampaignId(r)) return r;

  for (const key of ["data", "campaign", "communication", "item", "result"]) {
    const nested = asRecord(r[key]);
    if (nested && pickCampaignId(nested)) return nested;
  }

  const dataInner = asRecord(r.data);
  if (dataInner) {
    for (const key of ["campaign", "communication", "item"]) {
      const nested = asRecord(dataInner[key]);
      if (nested && pickCampaignId(nested)) return nested;
    }
    if (pickCampaignId(dataInner)) return dataInner;
  }

  return r;
}

function buildCampaignFromPayload(
  payload: AdminCreateCampaignApiBody,
  ui: AdminCreateCampaignBody,
  id: string,
): AdminCampaign {
  return {
    id,
    title: payload.title,
    description: payload.subject,
    campaign: payload.title,
    status: "Unpublished",
    campaignCategory: ui.campaignCategory ?? "Transactional",
    campaignSubCategory: ui.campaignSubCategory ?? "Vouchers offers",
    targetAudience: mapAudienceFromApi(payload.audience),
    targetSubCategory: ui.targetSubCategory ?? "Tech support",
    communicationCategory: mapChannelFromApi(payload.channel),
    content: payload.body,
    imageUrl: payload.imageUrl,
    scheduleMode: ui.scheduleMode ?? "Immediate",
    period: ui.period ?? "Daily",
    startDate: "—",
    endDate: "—",
    lastModified: "—",
  };
}

async function resolveCreatedCampaign(
  payload: AdminCreateCampaignApiBody,
  ui: AdminCreateCampaignBody,
  data: unknown,
): Promise<AdminCampaign> {
  const record = unwrapCampaignRecord(data);
  const fromRecord = record ? normalizeCampaign(record) : null;
  if (fromRecord?.id) return fromRecord;

  const id = pickIdFromResponse(data);
  if (id) {
    const fetched = await getAdminCampaign(id);
    if (fetched?.id) return fetched;
    return buildCampaignFromPayload(payload, ui, id);
  }

  const list = await getAdminCampaigns({ limit: 25 });
  const byTitle = list.items.filter((c) => c.title === payload.title);
  const draft = byTitle.find((c) => c.status === "Unpublished") ?? byTitle[0];
  if (draft?.id) return draft;

  throw new Error("Campaign was created but the response did not include an ID.");
}

/* ── Normalizer ── */

export function normalizeCampaign(raw: unknown): AdminCampaign | null {
  const o = unwrapCampaignRecord(raw);
  if (!o) return null;
  const id = pickCampaignId(o);
  if (!id) return null;

  const title = pickStr(o, ["title", "campaignName", "campaign", "name"]) || "Untitled Campaign";
  const description =
    pickStr(o, ["subject", "description", "desc", "subtitle"]) || "";
  const statusRaw = pickStr(o, ["status", "campaignStatus", "state"]) || "Draft";
  const status = normalizeCampaignStatus(statusRaw);

  const campaignCategory = pickStr(o, ["campaignCategory", "campaign_category", "category"]) || "Transactional";
  const campaignSubCategory = pickStr(o, ["campaignSubCategory", "campaign_sub_category", "subCategory"]) || "Vouchers offers";
  const audienceRaw = pickStr(o, ["audience", "targetAudience", "target_audience"]) || "all";
  const targetAudience = mapAudienceFromApi(audienceRaw);
  const targetSubCategory = pickStr(o, ["targetSubCategory", "target_sub_category", "targetSub"]) || "Tech support";

  const channelRaw = pickStr(o, ["channel", "communicationCategory", "communication_category"]) || "email";
  const communicationCategory = mapChannelFromApi(channelRaw);
  const content = pickStr(o, ["body", "content", "editorHtml", "editor_html", "message"]) || "";
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

/** API `channel` values (OpenAPI example: `email`). */
export function mapChannelToApi(uiChannel: string): string {
  const k = uiChannel.trim().toLowerCase();
  if (k === "email" || k.includes("mail")) return "email";
  if (k.includes("pop")) return "popup";
  if (k.includes("app")) return "in_app";
  if (k === "in_app" || k === "popup") return k;
  return "email";
}

export function mapChannelFromApi(apiChannel: string): string {
  const k = apiChannel.trim().toLowerCase();
  if (k === "email") return "Email";
  if (k === "popup" || k === "pop_up" || k === "pop-up") return "Pop up";
  if (k === "in_app" || k === "in-app") return "In-app";
  return apiChannel;
}

/** API `audience` values (OpenAPI example: `all`). */
export function mapAudienceToApi(uiAudience: string): string {
  const k = uiAudience.trim().toLowerCase();
  if (k === "all" || k.includes("all user")) return "all";
  if (k.includes("transaction level")) return "transaction_level";
  if (k.includes("last transaction")) return "last_transaction_type";
  if (k.includes("activity")) return "activity_status";
  if (k.includes("user type")) return "user_type";
  if (k.includes("app version")) return "app_version";
  if (k.includes("onboarding")) return "onboarding_date";
  return "all";
}

export function mapAudienceFromApi(apiAudience: string): string {
  const k = apiAudience.trim().toLowerCase();
  if (k === "all") return "All users";
  if (k === "transaction_level") return "Transaction level";
  if (k === "last_transaction_type") return "Last transaction type";
  if (k === "activity_status") return "Activity status";
  if (k === "user_type") return "User type";
  if (k === "app_version") return "App version";
  if (k === "onboarding_date") return "Onboarding date";
  return apiAudience;
}

export function buildCreateCampaignPayload(body: AdminCreateCampaignBody): AdminCreateCampaignApiBody {
  const title = body.title.trim();
  const subject = body.description.trim();
  const htmlBody = body.content.trim();
  const channel = mapChannelToApi(body.communicationCategory);
  const audience = mapAudienceToApi(body.targetAudience);

  const payload: AdminCreateCampaignApiBody = {
    title,
    subject,
    body: htmlBody,
    channel,
    audience,
  };

  const imageUrl = body.imageUrl?.trim();
  if (imageUrl && !imageUrl.startsWith("blob:")) {
    payload.imageUrl = imageUrl;
  }

  return payload;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AdminApiError) {
    const body = error.body;
    if (body && typeof body === "object") {
      const b = body as Record<string, unknown>;
      if (typeof b.message === "string" && b.message.trim()) return b.message;
      if (Array.isArray(b.errors)) {
        return b.errors.map((e) => (typeof e === "string" ? e : JSON.stringify(e))).join("; ");
      }
      const fieldErrors = b.errors as Record<string, string[]> | undefined;
      if (fieldErrors && typeof fieldErrors === "object") {
        return Object.entries(fieldErrors)
          .flatMap(([field, msgs]) => msgs.map((m) => `${field}: ${m}`))
          .join("; ");
      }
    }
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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
    query.set("status", backStatus.toLowerCase());
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
  const inner = unwrapCampaignRecord(data);
  return inner ? normalizeCampaign(inner) : null;
}

/** `POST /admin/communications` — Create a new campaign (status: draft). */
export async function createAdminCampaign(body: AdminCreateCampaignBody): Promise<AdminCampaign> {
  const payload = buildCreateCampaignPayload(body);
  if (!payload.title) throw new Error("Title is required.");
  if (!payload.subject) throw new Error("Subject is required.");
  if (!payload.body) throw new Error("Body is required.");

  const data = await adminRequest<unknown>("/admin/communications", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });

  return resolveCreatedCampaign(payload, body, data);
}

/** `DELETE /admin/communications/{id}` — Delete a draft campaign. */
export async function deleteAdminCampaign(id: string): Promise<void> {
  await adminRequest(`/admin/communications/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

export type AdminPublishCampaignOptions = {
  scheduleMode?: "Immediate" | "Scheduled" | "Recurring";
  period?: string;
  scheduledAt?: string;
};

function buildPublishPayload(options?: AdminPublishCampaignOptions): Record<string, unknown> {
  const mode = options?.scheduleMode ?? "Immediate";
  const scheduledAt = options?.scheduledAt?.trim();

  if (mode === "Immediate" && !scheduledAt) {
    return {};
  }

  const payload: Record<string, unknown> = {};
  if (scheduledAt) payload.scheduledAt = scheduledAt;
  if (mode === "Recurring" && options?.period?.trim()) {
    payload.period = options.period.trim();
  }
  if (mode !== "Immediate") {
    payload.scheduleMode = mode.toLowerCase();
  }
  return payload;
}

/** `POST /admin/communications/{id}/publish` — Publish or schedule a campaign (go live). */
export async function publishAdminCampaign(
  id: string,
  options?: AdminPublishCampaignOptions,
): Promise<AdminCampaign | null> {
  await adminRequest(`/admin/communications/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(buildPublishPayload(options)),
  });
  return getAdminCampaign(id);
}

export { apiErrorMessage as campaignApiErrorMessage };

/** `POST /admin/communications/{id}/cancel` — Cancel a scheduled campaign. */
export async function cancelAdminCampaign(id: string): Promise<void> {
  await adminRequest(`/admin/communications/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({}),
  });
}
