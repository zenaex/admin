# Admin API Endpoints Worked On

This document tracks the admin endpoints already wired in the app and where each one is applied in the UI/business flow.

Base URL is provided by `NEXT_PUBLIC_ADMIN_API_URL`, and calls are made through `adminRequest` in `src/lib/admin-api/client.ts`.

## Shared API Behavior

- `adminRequest` auto-attaches Bearer token when `auth: true`.
- On `401`, it attempts `POST /admin/auth/refresh` once, then retries the original request.
- API errors are normalized into `AdminApiError` with `status`, `body`, `requestUrl`, and `requestMethod`.

---

## 1) Admin Auth + Invitation + Password Reset Endpoints

Source module: `src/lib/admin-api/auth-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| POST | `/admin/auth/login` | Step 1 admin sign-in (email/password), determines OTP vs direct dashboard | `src/lib/auth/auth-context.tsx` |
| POST | `/admin/auth/verify-otp` | Step 2 OTP verification, receives token pair | `src/lib/auth/auth-context.tsx` |
| POST | `/admin/auth/resend-otp` | Resend login OTP | `src/auth-screens/otp-page.tsx` |
| POST | `/admin/auth/forgot-password` | Request password reset link (anti-enumeration flow) | `src/auth-screens/forgot-password-page.tsx` |
| GET | `/admin/invitations/validate` | Validate invitation token before account activation | `src/app/accept-invitation/accept-invitation-form.tsx` |
| POST | `/admin/invitations/accept` | Complete invitation onboarding and receive auth tokens | `src/app/accept-invitation/accept-invitation-form.tsx` |
| POST | `/admin/invitations` | Super admin sends admin invitation | `src/components/user-mgt/admin-management-view.tsx` |
| POST | `/admin/password-reset/approve` | Super admin approves a pending reset request | `src/components/user-mgt/admin-management-view.tsx`, `src/components/settings/settings-reset-requests.tsx` |
| POST | `/admin/password-reset/decline` | Super admin declines a pending reset request | `src/components/user-mgt/admin-management-view.tsx`, `src/components/settings/settings-reset-requests.tsx` |
| GET | `/admin/password-reset/validate` | Validate reset token before rendering reset form | `src/app/reset-password/reset-password-form.tsx` |
| POST | `/admin/password-reset/reset` | Submit new password using validated reset token | `src/app/reset-password/reset-password-form.tsx` |

### Refresh/session endpoint

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| POST | `/admin/auth/refresh` | Silent session refresh on app boot and auto-retry on 401 | `src/lib/admin-api/client.ts`, `src/lib/auth/auth-context.tsx` |

---

## 2) Admin Settings Endpoints

Source module: `src/lib/admin-api/settings-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/settings/profile` | Fetch current admin profile for Settings > Profile tab | `src/components/settings/settings-profile-tab.tsx` |
| PATCH | `/admin/settings/profile` | Update profile fields (`firstName`, `lastName`, `phoneNumber`, `department`) | `src/components/settings/settings-profile-tab.tsx` |
| POST | `/admin/settings/change-password` | Change own password from Settings > Password | `src/components/settings/settings-password-reset.tsx` |
| GET | `/admin/settings/password-reset-requests` | Fetch reset requests list for super admin moderation table | `src/components/settings/settings-reset-requests.tsx` |
| GET | `/admin/settings/password-policy` | Load password policy into policy tab controls | `src/components/settings/settings-password-policy-tab.tsx` |
| PATCH | `/admin/settings/password-policy` | Persist policy changes from expiry/length/combination controls | `src/components/settings/settings-password-policy-tab.tsx` |

---

## 3) Supporting Mapping/Normalization Added

- `src/lib/admin-api/settings-api.ts`
  - `normalizePasswordResetRequestsList()` handles common list envelopes (`requests`, `items`, `data`, `results`) and normalizes row keys.
- `src/lib/admin-api/settings-policy-map.ts`
  - `policyDtoToUi()` and `uiStateToPolicyDto()` isolate password-policy API shape from UI state shape.
- `src/lib/admin-api/customers-api.ts`
  - `normalizeCustomerListResponse()` and related helpers unwrap variable list/total shapes from the backend.

---

## 4) Admin Customers + Customer Audit Log

Source module: `src/lib/admin-api/customers-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/customers/summary` | Stat cards on Customer Mgt list | `src/components/user-mgt/customers-view.tsx` |
| GET | `/admin/customers` | Paginated customer table, search, tab filters, advanced status filter | `src/components/user-mgt/customers-view.tsx` |
| GET | `/admin/customers/{accountId}` | Customer + account summary on detail “Customer Details” tab | `src/components/user-mgt/customers-details-view.tsx` |
| GET | `/admin/customers/{accountId}/kyc` | “KYC Details” tab | `src/components/user-mgt/customers-details-view.tsx` |
| GET | `/admin/customers/{accountId}/transactions` | “Transaction History” tab (server pagination) | `src/components/user-mgt/customers-details-view.tsx` |
| GET | `/admin/customers/{accountId}/wallets` | “Wallet” tab | `src/components/user-mgt/customers-details-view.tsx` |
| GET | `/admin/audit/customers/{accountId}/logs` | “Audit Log” tab on customer detail | `src/components/user-mgt/customers-details-view.tsx` |

---

## 5) Admin Transactions

Source module: `src/lib/admin-api/transactions-api.ts`

OpenAPI lists these routes but does not document query params or response schemas; list/detail parsing is normalized in `transactions-api.ts`.

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/transactions` | Product transaction list (Crypto, Giftcard, Utility, E-sim, E-trade tabs) | `src/components/transactions/transactions-view.tsx` |
| GET | `/admin/transactions/wallet` | Wallet transaction list (Deposit, Withdrawal tabs) | `src/components/transactions/transactions-view.tsx` |
| GET | `/admin/transactions/{reference}` | Transaction detail + log tab | `src/components/transactions/transaction-details-view.tsx` |

**Not wired in UI (optional later):** `POST /admin/transactions/export`, `POST /admin/transactions/{reference}/sensitive`.

---

## 6) Admin Referrals

Source module: `src/lib/admin-api/referrals-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/referrals` | Paginated referrer list, search, status filter | `src/components/user-mgt/referral-view.tsx` |
| GET | `/admin/referrals/summary` | Referral metrics (available for future stat cards) | `src/lib/admin-api/referrals-api.ts` |
| GET | `/admin/referrals/config` | Load active earning configuration in modal | `src/components/user-mgt/referral-view.tsx` |
| POST | `/admin/referrals/config` | Save earning configuration (super_admin) | `src/components/user-mgt/referral-view.tsx` |
| GET | `/admin/referrals/{accountId}` | Referrer profile, stats, referred users table | `src/components/user-mgt/referral-details-view.tsx` |

---

## 7) Role-aware Application Rules Implemented

- Settings tabs hide super-admin-only areas for non-super-admins:
  - Password Policy tab hidden unless `isLikelySuperAdminFromToken(getAccessToken())` is true.
  - Reset Requests sub-tab hidden unless super admin.
- Sidebar now reflects auth token user hints (name/role/email/initials) and uses a logout confirmation modal before clearing session.

---

## 8) Quick File Index

- Auth endpoints: `src/lib/admin-api/auth-api.ts`
- Settings endpoints: `src/lib/admin-api/settings-api.ts`
- Customers + customer audit log: `src/lib/admin-api/customers-api.ts`
- Transactions: `src/lib/admin-api/transactions-api.ts`
- Referrals: `src/lib/admin-api/referrals-api.ts`
- API client/refresh/error handling: `src/lib/admin-api/client.ts`
- Endpoint types: `src/lib/admin-api/types.ts`
- Settings policy mapping: `src/lib/admin-api/settings-policy-map.ts`
