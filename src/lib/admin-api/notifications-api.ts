import { adminRequest } from "@/lib/admin-api/client";

export type AdminNotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  timeMeta: string;
  ago: string;
  read?: boolean;
  createdAt?: string;
};

export type NotificationPopup = {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  createdAt?: string;
};

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

function formatAgo(dateStr: string): string {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Just now";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function formatTimeMeta(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    day: "numeric",
    month: "short",
  });
}

function extractItems(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const r = asRecord(body);
  if (!r) return [];
  for (const k of ["data", "items", "notifications", "results", "content", "records"]) {
    const arr = r[k];
    if (Array.isArray(arr)) return arr;
  }
  const dataRec = asRecord(r.data);
  if (dataRec) {
    for (const k of ["items", "notifications", "results"]) {
      const arr = dataRec[k];
      if (Array.isArray(arr)) return arr;
    }
  }
  return [];
}

/** `GET /notifications` — Get in-app notifications for the authenticated user */
export async function getAdminNotifications(): Promise<AdminNotificationItem[]> {
  const endpoints = ["/notifications", "/admin/notifications", "/admin/communications/notifications"];
  let rawItems: unknown[] = [];

  for (const endpoint of endpoints) {
    try {
      const res = await adminRequest<unknown>(endpoint, { method: "GET" });
      const items = extractItems(res);
      if (items.length > 0 || Array.isArray(res)) {
        rawItems = items;
        break;
      }
    } catch {
      // Continue to next endpoint attempt
    }
  }

  return rawItems.map((raw, idx) => {
    const r = asRecord(raw) ?? {};
    const id = pickStr(r, ["id", "uuid", "notificationId", "notification_id"]) || `notif-${idx}`;
    const title = pickStr(r, ["title", "subject", "name", "type", "header"]) || "Notification";
    const subtitle = pickStr(r, ["subtitle", "message", "content", "description", "body", "text"]) || "No details provided";
    const created = pickStr(r, ["createdAt", "created_at", "timestamp", "time", "date"]);
    const read = r.read === true || r.isRead === true || r.status === "read";

    return {
      id,
      title,
      subtitle,
      timeMeta: formatTimeMeta(created),
      ago: formatAgo(created),
      read,
      createdAt: created,
    };
  });
}

/** `POST /notifications/read` — Mark in-app notifications as read (empty array = mark all read) */
export async function postMarkNotificationsRead(ids?: string[]): Promise<void> {
  const body = ids ?? [];
  try {
    await adminRequest("/notifications/read", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch {
    // Try fallback object payload if server expects object
    try {
      await adminRequest("/notifications/read", {
        method: "POST",
        body: JSON.stringify({ notificationIds: body, ids: body }),
      });
    } catch (e) {
      console.error("Failed to mark notifications as read:", e);
    }
  }
}

/** `GET /notifications/popup` — Get the active pop-up notification for the authenticated user */
export async function getNotificationPopup(): Promise<NotificationPopup | null> {
  try {
    const res = await adminRequest<unknown>("/notifications/popup", { method: "GET" });
    const r = asRecord(res) ?? asRecord(asRecord(res)?.data);
    if (!r) return null;
    const id = pickStr(r, ["id", "uuid", "popupId", "popup_id"]);
    if (!id) return null;
    return {
      id,
      title: pickStr(r, ["title", "header", "subject"]) || "Notice",
      message: pickStr(r, ["message", "content", "subtitle", "body"]) || "",
      imageUrl: pickStr(r, ["imageUrl", "image_url", "image"]),
      actionUrl: pickStr(r, ["actionUrl", "action_url", "link", "url"]),
      createdAt: pickStr(r, ["createdAt", "created_at", "timestamp"]),
    };
  } catch {
    return null;
  }
}

/** `POST /notifications/popup/{id}/dismiss` — Dismiss a pop-up notification */
export async function postDismissNotificationPopup(id: string): Promise<void> {
  if (!id) return;
  try {
    await adminRequest(`/notifications/popup/${encodeURIComponent(id)}/dismiss`, {
      method: "POST",
    });
  } catch (e) {
    console.error(`Failed to dismiss notification popup ${id}:`, e);
  }
}
