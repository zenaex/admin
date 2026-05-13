export type AdminLoginBody = { email: string; password: string };

export type AdminLoginResponse = {
  success?: boolean;
  message?: string;
  requires_2fa?: boolean;
  accessToken?: string;
  refreshToken?: string;
};

export type AdminVerifyOtpBody = { email: string; otp: string };
export type AdminResendOtpBody = { email: string };

export type AdminTokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AdminRefreshBody = { refreshToken: string };

export type AdminForgotPasswordBody = { email: string };

export type AdminInvitationCreateBody = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type AdminInvitationValidateResponse = {
  valid: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export type AdminInvitationAcceptBody = { token: string; password: string };

export type AdminPasswordResetApproveBody = { requestId: string };

export type AdminPasswordResetDeclineBody = { requestId: string };

/** `GET /admin/password-reset/validate` */
export type AdminPasswordResetValidateResponse = {
  valid: boolean;
  email?: string;
};

export type AdminPasswordResetResetBody = { token: string; newPassword: string };

export type ApiErrorBody = {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

/** `GET /admin/settings/profile` — tolerate extra/renamed fields from backend. */
export type AdminSettingsProfile = {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  role?: string;
  dateJoined?: string;
};

/** `PATCH /admin/settings/profile` */
export type AdminSettingsProfilePatchBody = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  department: string;
};

/** `POST /admin/settings/change-password` */
export type AdminSettingsChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
};

/** Row from `GET /admin/settings/password-reset-requests` (normalized client-side). */
export type AdminSettingsPasswordResetRequestRow = {
  requestId: string;
  name?: string;
  email?: string;
  role?: string;
  dateRequested?: string;
};

/**
 * DTO for `GET`/`PATCH /admin/settings/password-policy`.
 * Adjust field names to match OpenAPI when available; mappers live in `settings-policy-map.ts`.
 */
export type AdminSettingsPasswordPolicyDto = {
  passwordExpiryUnit?: "day" | "week" | "month";
  passwordExpiryValue?: number;
  allowReusablePassword?: boolean;
  minPasswordLength?: number;
  maxPasswordLength?: number;
  requireDigits?: boolean;
  requireLetters?: boolean;
  requireAlphanumericAndSpecial?: boolean;
};

/** `GET /admin/customers/summary` */
export type AdminCustomersSummary = {
  totalUsers?: number;
  activeUsers?: number;
  inactiveUsers?: number;
  newSignupsThisMonth?: number;
};

/** Query for `GET /admin/customers` (OpenAPI names). */
export type AdminCustomerListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "created_at" | "first_name" | "last_name";
  sortOrder?: "asc" | "desc";
  accountStatus?: "" | "active" | "suspended" | "blocked";
  activityStatus?: "" | "active" | "inactive";
  kycTier?: number;
  fromDate?: string;
  toDate?: string;
};

/** Normalized row for customer list UI. */
export type AdminCustomerListRow = {
  accountId: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  statusLabel: string;
  dateOnboarded: string;
  /** Raw item for client-side PND/Lien heuristics when API has no query filter. */
  raw: Record<string, unknown>;
};

export type AdminCustomerListResult = {
  items: AdminCustomerListRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** Normalized wallet transaction row (customer detail tab). */
export type AdminCustomerTransactionRow = {
  id: string;
  referenceNo: string;
  customerName: string;
  channel: string;
  amount: string;
  biller: string;
  status: string;
  date: string;
};

export type AdminCustomerTransactionListResult = {
  items: AdminCustomerTransactionRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** `GET /admin/customers/{accountId}/wallets` */
export type AdminCustomerWalletItem = {
  walletId?: string;
  userId?: string;
  walletType?: string;
  status?: string;
  currency?: string;
  availableBalance?: number;
  currentBalance?: number;
  heldBalance?: number;
};

export type AdminCustomerWalletsResponse = {
  wallets?: AdminCustomerWalletItem[];
  totalCount?: number;
  nextPageToken?: string;
};
