/** Unsafe JWT payload decode for UI hints only. Do not trust for authorization. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let s = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    let json: string;
    if (typeof atob === "function") {
      json = atob(s);
    } else if (typeof Buffer !== "undefined") {
      json = Buffer.from(s, "base64").toString("utf8");
    } else {
      return null;
    }
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isLikelySuperAdminFromToken(accessToken: string | null): boolean {
  if (!accessToken) return false;
  const p = decodeJwtPayload(accessToken);
  if (!p) return false;
  const role = String(p.role ?? p.adminRole ?? p["admin_role"] ?? "").toLowerCase();
  return (
    role.includes("super") ||
    role === "super_admin" ||
    role === "superadmin" ||
    role === "super admin"
  );
}
