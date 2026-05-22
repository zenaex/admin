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

/** Body for `POST /admin/users/admin/{adminId}/role`. */
export type AdminChangeAdminRoleBody = {
  newRole: string;
};

/** Body for `POST /admin/users/customer/{accountId}/suspend`. */
export type AdminCustomerSuspendBody = {
  reason: string;
  notes: string;
  suspendedUntil?: string;
  customerMessage?: string;
};

/** Body for `POST /admin/users/customer/{accountId}/reactivate`. */
export type AdminCustomerReactivateBody = {
  reason: string;
};

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
  /** Displayed as Employee ID; mapped from API `id` when no dedicated employee field. */
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

/** Query for `GET /admin/transactions` and `GET /admin/transactions/wallet` (common params; not all documented in OpenAPI). */
export type AdminTransactionListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  channel?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
};

/** Normalized row for global transactions list UI. */
export type AdminTransactionListRow = {
  id: string;
  refNo: string;
  customerName: string;
  channel: string;
  amount: string;
  provider: string;
  status: string;
  date: string;
  /** ISO or raw timestamp for sorting merged lists. */
  dateSortKey: string;
  raw: Record<string, unknown>;
};

export type AdminTransactionListResult = {
  items: AdminTransactionListRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** Body for `POST /admin/transactions/gift-cards/submissions/{id}/decline`. */
export type AdminGiftcardDeclineBody = {
  reason: string;
};

/** Normalized decrypted e-code from `POST .../e-code`. */
export type AdminGiftcardECodeResult = {
  code: string;
};

/** Normalized metrics for `GET /admin/transactions/summary`. */
export type AdminTransactionsSummary = {
  totalAmountDeposited?: number | string;
  totalAmountWithdrawn?: number | string;
  totalTransactions?: number;
  totalUsers?: number;
};

/** `GET /admin/referrals/summary` */
export type AdminReferralsSummary = {
  totalReferrers?: number;
  totalReferralsMade?: number;
  pendingReferrals?: number;
  totalRewardsEarned?: string;
};

/** Query for `GET /admin/referrals` */
export type AdminReferralListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "" | "qualified" | "pending";
  fromDate?: string;
  toDate?: string;
};

export type AdminReferralListRow = {
  accountId: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  referralMade: number;
  totalRewardsEarned: string;
  raw: Record<string, unknown>;
};

export type AdminReferralListResult = {
  items: AdminReferralListRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** `POST /admin/referrals/config` */
export type AdminReferralConfigBody = {
  minTransactionAmount: string;
  currency: string;
  maxDaysFromOnboarding: number;
  cycleSize: number;
  allowedProducts: string[];
  rewardAmount: string;
  rewardCurrency: string;
};

export type AdminReferredUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  date: string;
  status: string;
  raw: Record<string, unknown>;
};

/** Row for audit trail list (internal users or customer sessions). */
export type AdminAuditTrailRow = {
  id: string;
  subjectId: string;
  subjectType: "internal" | "customers";
  name: string;
  email: string;
  role: string;
  action: string;
  sessionIn: string;
  sessionOut: string;
  raw: Record<string, unknown>;
};

export type AdminAuditActivityLogEntry = {
  id: string;
  time: string;
  message: string;
  userAgent: string;
  ip: string;
  raw: Record<string, unknown>;
};

export type AdminAuditSubjectDetails = {
  name: string;
  role: string;
  phoneNumber: string;
  emailAddress: string;
  dateAdded: string;
};

export type AdminReferralDetailResult = {
  referrer: {
    accountId: string;
    name: string;
    username: string;
    email: string;
    phone: string;
  };
  stats: {
    totalReferralsMade: string;
    onboardedReferredUsers: string;
    pendingReferredUsers: string;
    totalRewardsEarned: string;
  };
  referred: AdminReferredUserRow[];
  referredTotal: number;
  page: number;
  pageSize: number;
};
