import type { AdminSettingsProfile } from "@/lib/admin-api/types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function pickNestedString(o: Record<string, unknown>, paths: string[][]): string {
  for (const path of paths) {
    let cur: unknown = o;
    for (const key of path) {
      const rec = asRecord(cur);
      if (!rec) {
        cur = undefined;
        break;
      }
      cur = rec[key];
    }
    if (typeof cur === "string" && cur.trim()) return cur.trim();
  }
  return "";
}

/** Values the API uses when a field is missing — treat as blank in the UI. */
function isPlaceholderValue(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  const k = s.toLowerCase();
  if (k === "—" || k === "-" || k === "–" || k === "=" || k === "n/a" || k === "na" || k === "null" || k === "undefined") {
    return true;
  }
  return /^[-–—=]+$/.test(s);
}

function cleanField(raw: string): string | undefined {
  const v = raw.trim();
  if (!v || isPlaceholderValue(v)) return undefined;
  return v;
}

function formatJoinedDate(raw: string): string | undefined {
  const v = cleanField(raw);
  if (!v) return undefined;
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    const datePart = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${datePart} | ${timePart}`;
  }
  return isPlaceholderValue(v) ? undefined : v;
}

function unwrapProfilePayload(data: unknown): Record<string, unknown> {
  const root = asRecord(data);
  if (!root) return {};
  for (const key of ["profile", "user", "admin", "account", "data", "payload", "result"]) {
    const inner = asRecord(root[key]);
    if (
      inner &&
      (pickString(inner, ["email", "firstName", "first_name", "id", "employeeId", "employee_id"]) ||
        pickNestedString(inner, [["user", "email"]]))
    ) {
      return inner;
    }
  }
  return root;
}

/**
 * Normalize `GET|PATCH /admin/settings/profile` into a stable client shape.
 * Missing or placeholder API values become `undefined` so the UI can stay blank.
 */
export function normalizeAdminSettingsProfile(data: unknown): AdminSettingsProfile {
  const o = unwrapProfilePayload(data);

  const firstName = cleanField(
    pickString(o, ["firstName", "first_name"]) ||
      pickNestedString(o, [["user", "firstName"], ["user", "first_name"], ["admin", "firstName"]]),
  );
  const lastName = cleanField(
    pickString(o, ["lastName", "last_name"]) ||
      pickNestedString(o, [["user", "lastName"], ["user", "last_name"], ["admin", "lastName"]]),
  );
  const email = cleanField(
    pickString(o, ["email", "emailAddress", "email_address"]) ||
      pickNestedString(o, [["user", "email"], ["admin", "email"]]),
  );
  const phoneNumber = cleanField(
    pickString(o, ["phoneNumber", "phone_number", "phone", "mobile"]) ||
      pickNestedString(o, [["user", "phoneNumber"], ["user", "phone"]]),
  );
  const department = cleanField(
    pickString(o, ["department", "dept", "team"]) ||
      pickNestedString(o, [["user", "department"], ["admin", "department"]]),
  );
  const role = cleanField(
    pickString(o, ["role", "adminRole", "admin_role", "userRole", "user_role"]) ||
      pickNestedString(o, [["user", "role"], ["admin", "role"]]),
  );
  const employeeId = cleanField(
    pickString(o, [
      "employeeId",
      "employee_id",
      "employeeID",
      "staffId",
      "staff_id",
      "personnelId",
      "personnel_id",
      "id",
      "adminId",
      "admin_id",
      "userId",
      "user_id",
    ]) ||
      pickNestedString(o, [
        ["user", "employeeId"],
        ["user", "id"],
        ["admin", "employeeId"],
        ["admin", "id"],
      ]),
  );
  const dateJoined = formatJoinedDate(
    pickString(o, [
      "dateJoined",
      "date_joined",
      "joinedAt",
      "joined_at",
      "hireDate",
      "hire_date",
      "createdAt",
      "created_at",
      "onboardedAt",
      "onboarded_at",
    ]) ||
      pickNestedString(o, [
        ["user", "dateJoined"],
        ["user", "createdAt"],
        ["admin", "dateJoined"],
      ]),
  );

  return {
    ...(employeeId !== undefined ? { employeeId } : {}),
    ...(firstName !== undefined ? { firstName } : {}),
    ...(lastName !== undefined ? { lastName } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(phoneNumber !== undefined ? { phoneNumber } : {}),
    ...(department !== undefined ? { department } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(dateJoined !== undefined ? { dateJoined } : {}),
  };
}
