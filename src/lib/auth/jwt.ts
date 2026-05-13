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

export type AdminProfileHints = {
  email: string | null;
  displayName: string | null;
  roleLabel: string | null;
  initials: string;
};

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

/** UI hints from access token only — not for authorization. */
export function adminProfileHintsFromToken(accessToken: string | null): AdminProfileHints {
  const empty: AdminProfileHints = { email: null, displayName: null, roleLabel: null, initials: "?" };
  if (!accessToken) return empty;
  const p = decodeJwtPayload(accessToken);
  if (!p) return empty;

  const fromEmail = str(p.email);
  const preferred = str(p.preferred_username);
  const sub = str(p.sub);
  const email = fromEmail ?? preferred ?? (sub?.includes("@") ? sub : null);
  const first =
    str(p.firstName) ??
    str(p.given_name) ??
    str(p.givenName) ??
    str(p["given_name"]);
  const last =
    str(p.lastName) ??
    str(p.family_name) ??
    str(p.familyName) ??
    str(p["family_name"]);
  const full = [first, last].filter(Boolean).join(" ").trim();
  const displayName = full || str(p.name) || email;

  const rawRole = p.role ?? p.adminRole ?? p["admin_role"] ?? p.roles;
  let roleLabel: string | null = null;
  if (Array.isArray(rawRole) && rawRole.length) roleLabel = String(rawRole[0]);
  else if (typeof rawRole === "string" && rawRole.trim()) roleLabel = rawRole.trim();

  const initialsFromName = (name: string) => {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase().slice(0, 2);
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    if (parts.length === 1 && parts[0].length === 1) return `${parts[0]}?`.toUpperCase().slice(0, 2);
    return "?";
  };

  const initialsFromEmail = (em: string) => {
    const local = em.split("@")[0] ?? em;
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return (local[0] ?? "?").toUpperCase();
  };

  const initials =
    displayName && displayName.includes("@")
      ? initialsFromEmail(displayName)
      : displayName
        ? initialsFromName(displayName)
        : email
          ? initialsFromEmail(email)
          : "?";

  return {
    email,
    displayName: displayName || null,
    roleLabel,
    initials: initials.padEnd(2, "?").slice(0, 2),
  };
}
