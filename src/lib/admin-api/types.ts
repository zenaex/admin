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

/** Body for `POST /admin/users/customer/{accountId}/pnd`. */
export type AdminCustomerPndBody = {
  reason: string;
};

/** Body for `POST /admin/users/customer/{accountId}/lien`. */
export type AdminCustomerLienBody = {
  amount: string;
  lienType: string;
  reason: string;
  walletId?: string;
};

/** Body for `POST /admin/users/customer/{accountId}/remove-lien`. */
export type AdminCustomerRemoveLienBody = {
  walletId?: string;
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
  provider: string;
  status: string;
  date: string;
};

/** `summary` on `GET /admin/customers/{accountId}/transactions`. */
export type AdminCustomerTransactionSummary = {
  totalAvailableBalance?: number;
  totalInflowAllTime?: number;
  totalOutflowAllTime?: number;
  totalTransactionsAllTime?: number;
  totalInflow?: number;
  totalOutflow?: number;
  totalTransactions?: number;
};

export type AdminCustomerTransactionListResult = {
  items: AdminCustomerTransactionRow[];
  total: number;
  page: number;
  pageSize: number;
  summary?: AdminCustomerTransactionSummary;
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

/** Normalized Tier 1 row for customer KYC details UI. */
export type AdminCustomerKycTier1 = {
  name: string;
  bvn: string;
  dateOfBirth: string;
  status: string;
  gender?: string;
  submittedAt?: string;
  provider?: string;
  errorMessage?: string;
};

/** Normalized Tier 2 row for customer KYC details UI. */
export type AdminCustomerKycTier2 = {
  name: string;
  idType: string;
  idNumber: string;
  dateIssued: string;
  dateOfExpiry: string;
  status: string;
  dateOfBirth?: string;
  gender?: string;
  submittedAt?: string;
  provider?: string;
  errorMessage?: string;
};

export type AdminCustomerKycDetails = {
  tier1: AdminCustomerKycTier1;
  tier2: AdminCustomerKycTier2;
};

/** Query for `GET /admin/transactions` (OpenAPI `tab`, `limit`, `dateFrom`, `dateTo`). */
export type AdminTransactionListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  /** Channel tab: all, utility, crypto, gift-card, esim, e-trade, deposit, withdrawal */
  tab?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AdminProviderListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
};

export type AdminProviderListRow = {
  id: string;
  name: string;
  category: string;
  dateAdded: string;
  lastUpdated: string;
  noOfProducts: number;
  status: "Active" | "Inactive";
};

export type AdminProviderListResult = {
  items: AdminProviderListRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminProviderDetail = {
  id: string;
  providerId: string;
  providerName: string;
  email: string;
  category: string;
  dateOnboarded: string;
  lastUpdated: string;
  status: "Active" | "Inactive";
};

export type AdminProviderProductRow = {
  id: string;
  slug: string;
  productName: string;
  productCategory: string;
  commissionType: "Percentage" | "% capped @" | "Flat" | "None";
  commissionRate: string;
  cap: string;
  status: boolean;
  /** API `chargeType` slug for PATCH commission. */
  chargeTypeApi: string;
  chargeValue?: number;
  chargeCap?: number;
};

/** `PATCH /admin/providers/{providerId}` */
export type AdminProviderEmailBody = {
  email: string;
};

/** `PATCH /admin/providers/{providerId}/toggle` */
export type AdminProviderToggleBody = {
  isActive: boolean;
};

/** `PATCH /admin/providers/{providerId}/products/{productSlug}/commission` */
export type AdminProviderCommissionBody = {
  chargeType: "flat" | "percentage" | "percentage_with_cap" | "none";
  chargeValue: number;
  chargeCap?: number;
};

/** `PATCH /admin/providers/{providerId}/products/{productSlug}/toggle` */
export type AdminProviderProductToggleBody = {
  isActive: boolean;
};

/** `GET /admin/providers/{providerId}` — provider header + product list. */
export type AdminProviderDetailResult = {
  provider: AdminProviderDetail;
  products: AdminProviderProductRow[];
  totalProducts: number;
};

/** Normalized row for global transactions list UI. */
export type AdminTransactionListRow = {
  id: string;
  refNo: string;
  customerName: string;
  channel: string;
  product: string;
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

/** Body for `POST /admin/transactions/gift-cards/submissions/{id}/adjust`. */
export type AdminGiftcardAdjustBody = {
  faceValueCents: number;
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
export type ReferralThresholdType = "transaction_count" | "amount_spent" | "signup_count";

/** Body for `POST /admin/referrals/config` (amount fields are strings). */
export type AdminReferralConfigBody = {
  minTransactionAmount: string;
  currency: string;
  maxDaysFromOnboarding: number;
  cycleSize: number;
  allowedProducts: string[];
  rewardAmount: string;
  rewardCurrency: string;
  thresholdType: ReferralThresholdType;
};

/** Body for `PUT /admin/referrals/config` (amount fields are numbers). */
export type AdminReferralConfigUpdateBody = {
  minTransactionAmount: number;
  currency: string;
  maxDaysFromOnboarding: number;
  cycleSize: number;
  allowedProducts: string[];
  rewardAmount: number;
  rewardCurrency: string;
  thresholdType: ReferralThresholdType;
};

/** Normalized config for the Configure Earnings form. */
export type AdminReferralConfigForm = {
  minTransactionAmount: string;
  currency: string;
  maxDaysFromOnboarding: number;
  cycleSize: number;
  allowedProducts: string[];
  rewardAmount: string;
  rewardCurrency: string;
  thresholdType: ReferralThresholdType;
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

/* ── Admin Team Management ── */

export type AdminRole = {
  id: string;
  name: string;
  description?: string;
};

export type AdminPermissionItem = {
  key: string;
  label: string;
  description?: string;
};

export type AdminPermissionModule = {
  module: string;
  permissions: AdminPermissionItem[];
};

export type AdminRoleListItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  isSystem: boolean;
};

export type AdminRoleDetail = AdminRoleListItem & {
  permissionKeys: string[];
};

export type AdminRoleMemberPreview = {
  id: string;
  name: string;
  initials: string;
};

export type AdminRoleUpsertBody = {
  name: string;
  description: string;
  icon: string;
  permissionKeys: string[];
};

/** Normalized row for admin team member list. */
export type AdminTeamMember = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  roleId: string;
  status: string;
  dateOnboarded: string;
  department: string;
};

export type AdminTeamListResult = {
  items: AdminTeamMember[];
  total: number;
};

/** Body for `POST /admin/team` — invite a new team member. */
export type AdminTeamInviteBody = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string;
  department: string;
};

/** Body for `PUT /admin/team/{id}` — update team member details. */
export type AdminTeamUpdateBody = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
  roleId: string;
};

/** Body for `POST /admin/team/{id}/deactivate` — deactivate an admin account. */
export type AdminTeamDeactivateBody = {
  reason: string;
  notes: string;
};

/** Body for `POST /admin/team/{id}/suspend` — suspend an admin account. */
export type AdminTeamSuspendBody = {
  reason: string;
  notes: string;
  suspendUntil: string;
  message: string;
};

/** Normalized row for pending admin invitation. */
export type AdminPendingInvite = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  dateSent: string;
  status: string;
};

export type AdminPendingInviteListResult = {
  items: AdminPendingInvite[];
  total: number;
};

/* ── Communications Campaign Types ── */

export type AdminCampaignStatus = "Publish" | "Unpublished" | "Pending";

export type AdminCampaign = {
  id: string;
  title: string;
  description: string;
  campaign: string;
  status: AdminCampaignStatus;
  campaignCategory: string;
  campaignSubCategory: string;
  targetAudience: string;
  targetSubCategory: string;
  communicationCategory: string;
  content: string;
  imageUrl?: string;
  scheduleMode: "Immediate" | "Scheduled" | "Recurring";
  period: string;
  startDate: string;
  endDate: string;
  lastModified: string;
};

export type AdminCampaignListResult = {
  items: AdminCampaign[];
  total: number;
};

/** `POST /admin/communications` request body (OpenAPI). */
export type AdminCreateCampaignApiBody = {
  title: string;
  subject: string;
  body: string;
  channel: string;
  audience: string;
  imageUrl?: string;
};

/** UI form values mapped to {@link AdminCreateCampaignApiBody} on create. */
export type AdminCreateCampaignBody = {
  title: string;
  /** Maps to API `subject`. */
  description: string;
  /** Maps to API `body` (HTML). */
  content: string;
  /** Maps to API `channel`. */
  communicationCategory: string;
  /** Maps to API `audience`. */
  targetAudience: string;
  imageUrl?: string;
  campaignCategory?: string;
  campaignSubCategory?: string;
  targetSubCategory?: string;
  scheduleMode?: "Immediate" | "Scheduled" | "Recurring";
  period?: string;
};
