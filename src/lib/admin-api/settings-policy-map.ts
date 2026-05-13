import type { AdminSettingsPasswordPolicyDto } from "@/lib/admin-api/types";

export type PolicyExpiryUnitUi = "Day" | "Week" | "Month";

export type AdminPasswordPolicyUiState = {
  expiryUnit: PolicyExpiryUnitUi;
  /** 1-based count within the selected unit (e.g. 3 months). */
  expiryCount: number;
  reusablePassword: boolean;
  minLength: number;
  maxLength: number;
  digitOnly: boolean;
  alphabetOnly: boolean;
  alphanumeric: boolean;
};

const UNIT_TO_API: Record<PolicyExpiryUnitUi, "day" | "week" | "month"> = {
  Day: "day",
  Week: "week",
  Month: "month",
};

const API_TO_UNIT: Record<string, PolicyExpiryUnitUi> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return v === true || v === "true";
}

export function defaultPasswordPolicyUi(): AdminPasswordPolicyUiState {
  return {
    expiryUnit: "Month",
    expiryCount: 1,
    reusablePassword: false,
    minLength: 8,
    maxLength: 32,
    digitOnly: true,
    alphabetOnly: true,
    alphanumeric: false,
  };
}

/** Map API DTO (flexible keys) into UI state for the settings password policy tab. */
export function policyDtoToUi(dto: AdminSettingsPasswordPolicyDto | null | undefined): AdminPasswordPolicyUiState {
  const base = defaultPasswordPolicyUi();
  if (!dto) return base;

  const rawUnit = String(dto.passwordExpiryUnit ?? "").toLowerCase();
  const expiryUnit = API_TO_UNIT[rawUnit] ?? base.expiryUnit;
  const expiryValue = num(dto.passwordExpiryValue, base.expiryCount);
  const expiryCount = Math.max(1, Math.min(expiryUnit === "Day" ? 30 : expiryUnit === "Week" ? 52 : 12, expiryValue));

  return {
    expiryUnit,
    expiryCount,
    reusablePassword: bool(dto.allowReusablePassword),
    minLength: Math.max(1, Math.min(32, num(dto.minPasswordLength, base.minLength))),
    maxLength: Math.max(1, Math.min(64, num(dto.maxPasswordLength, base.maxLength))),
    digitOnly: bool(dto.requireDigits),
    alphabetOnly: bool(dto.requireLetters),
    alphanumeric: bool(dto.requireAlphanumericAndSpecial),
  };
}

/** Build PATCH body from full UI state. */
export function uiStateToPolicyDto(ui: AdminPasswordPolicyUiState): AdminSettingsPasswordPolicyDto {
  return {
    passwordExpiryUnit: UNIT_TO_API[ui.expiryUnit],
    passwordExpiryValue: ui.expiryCount,
    allowReusablePassword: ui.reusablePassword,
    minPasswordLength: ui.minLength,
    maxPasswordLength: ui.maxLength,
    requireDigits: ui.digitOnly,
    requireLetters: ui.alphabetOnly,
    requireAlphanumericAndSpecial: ui.alphanumeric,
  };
}
