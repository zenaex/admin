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
| GET | `/admin/settings/profile` | Fetch current admin profile for Settings > Profile tab (normalized via `settings-profile-map.ts`; missing fields blank) | `src/components/settings/settings-profile-tab.tsx` |
| PATCH | `/admin/settings/profile` | Update profile fields (`firstName`, `lastName`, `phoneNumber`, `department`) | `src/components/settings/settings-profile-tab.tsx` |
| POST | `/admin/settings/change-password` | Change own password from Settings > Password | `src/components/settings/settings-password-reset.tsx` |
| GET | `/admin/settings/password-reset-requests` | Fetch pending reset requests (super admin) | `src/components/settings/settings-reset-requests.tsx`, `src/components/user-mgt/admin-management-view.tsx` (Password resets tab) |
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
| GET | `/admin/customers/{accountId}/kyc` | “KYC Details” tab — Tier 1/2 tables via `normalizeCustomerKycResponse` | `customer-kyc-details-tab.tsx`, `customers-api.ts` |
| GET | `/admin/customers/{accountId}/transactions` | “Transaction History” tab (server pagination) | `src/components/user-mgt/customers-details-view.tsx` |
| GET | `/admin/customers/{accountId}/wallets` | “Wallet” tab | `src/components/user-mgt/customers-details-view.tsx` |
| GET | `/admin/audit/customers/{accountId}/logs` | “Audit Log” tab on customer detail | `src/components/user-mgt/customers-details-view.tsx` |

---

## 4b) Admin user actions (customer + admin accounts)

Source module: `src/lib/admin-api/users-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| POST | `/admin/users/admin/{adminId}/role` | Change admin role (`{ newRole }` body); super_admin | `admin-management-view.tsx` (Team row menu — enabled when `adminId` is a real UUID) |
| POST | `/admin/users/admin/{adminId}/deactivate` | Deactivate admin; super_admin | `admin-management-view.tsx` |
| POST | `/admin/users/customer/{accountId}/deactivate` | Block/deactivate customer (no body); super_admin | `customers-details-view.tsx` Action menu |
| POST | `/admin/users/customer/{accountId}/suspend` | Suspend customer; body `{ reason, notes }` required; ops_manager or super_admin | `customers-details-view.tsx` |
| POST | `/admin/users/customer/{accountId}/reactivate` | Reactivate customer; body `{ reason }` required; ops_manager or super_admin | `customers-details-view.tsx` |
| POST | `/admin/users/customer/{accountId}/pnd` | Place customer on Post No Debit; body `{ reason }` required | `customer-pnd-flow.tsx` (Customer detail Action menu) |
| POST | `/admin/users/customer/{accountId}/remove-pnd` | Remove Post No Debit (no body) | `customer-pnd-flow.tsx` |
| POST | `/admin/users/customer/{accountId}/lien` | Place wallet lien; body `{ amount, lienType, reason, walletId? }` | `customer-lien-flow.tsx` |
| POST | `/admin/users/customer/{accountId}/remove-lien` | Release lien; optional body `{ walletId }` | `customer-lien-flow.tsx` |

Role gating uses JWT hints in `src/lib/auth/jwt.ts` (`canDeactivateCustomer`, `canSuspendOrReactivateCustomer`). PND and Lien actions use the same visibility as suspend/reactivate. Team table still uses demo `member-*` ids — Change role / Deactivate stay disabled until a real admin list API provides UUIDs.

---

## 5) Admin Transactions

Source module: `src/lib/admin-api/transactions-api.ts`

OpenAPI lists these routes but does not document query params or response schemas; list/detail parsing is normalized in `transactions-api.ts`.

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/transactions/summary` | Stat cards. OpenAPI fields: `totalDepositedCents`, `totalWithdrawnCents` (÷100 for ₦ display), `totalTransactions`, `totalUsers`. Fallbacks: nested `deposits`/`withdrawals`, legacy flat amount keys. | `src/components/transactions/transactions-view.tsx` |
| GET | `/admin/transactions` | All transaction tabs. Query `tab` (`all`, `deposit`, `withdrawal`, `crypto`, `gift-card`, `utility`, `esim`, `e-trade`), plus `page`, `limit`, `search`, `status`, `dateFrom`, `dateTo`. Rows include `categorySlug` for display. | `src/components/transactions/transactions-view.tsx` |
| GET | `/admin/transactions/{reference}` | Transaction detail: API → `mapApiDetailToTransactionModel` → existing channel layouts (Giftcard, Crypto, Utility, E-sim, Withdrawal, E-trade) | `transaction-detail-mapper.ts`, `transaction-details-view.tsx` |
| POST | `/admin/transactions/gift-cards/submissions/{id}/approve` | Giftcard pending → approve (no body); `{id}` = submission UUID from detail (`submissionId` or top-level `id`) | `giftcard-submissions-api.ts`, `transaction-details-view.tsx` |
| POST | `/admin/transactions/gift-cards/submissions/{id}/decline` | Giftcard pending → reject; body `{ "reason": "string" }` (required) | `giftcard-submissions-api.ts`, `transaction-details-view.tsx` |
| POST | `/admin/transactions/gift-cards/submissions/{id}/e-code` | Super admin: reveal decrypted e-code (no body) | `giftcard-submissions-api.ts`, `giftcard-details.tsx` |

| POST | `/admin/transactions/export` | CSV/PDF/JSON export (API with client fallback) | `transactions-view.tsx`, `src/lib/admin-api/export-api.ts` |

| GET | `/admin/transactions/{reference}/logs` | Transaction Log tab timeline | `transaction-details-view.tsx` |

**Detail UI:** [`transaction-details-view.tsx`](src/components/transactions/transaction-details-view.tsx) fetches detail from the API and maps into `TransactionDetailModel` via [`transaction-detail-mapper.ts`](src/lib/admin-api/transaction-detail-mapper.ts). Log tab prefers `GET .../logs`; falls back to embedded log arrays on the detail payload. Giftcard submission id is stored on `giftcardSubmissionId` (never the route `reference`).

**Deprecated (removed from UI):** `GET /admin/transactions/wallet` — use `GET /admin/transactions?tab=deposit|withdrawal`.

**Export:** `POST /admin/transactions/export` body: `productSlug`, `statuses`, `dateFrom`, `dateTo`, `search`, `userId`.

**Not wired in UI (optional later):** `POST /admin/transactions/{reference}/sensitive`.

---

## 5b) Admin Providers

Source module: `src/lib/admin-api/providers-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/providers` | List: `{ providers[], total, totalActive, totalInactive }`. Rows use `categorySlug`, `productCount`, `isActive`, `createdAt`. Stat cards map `total` / `totalActive` / `totalInactive`. Client-side pagination on full list. | `src/components/provider/provider-view.tsx` |
| GET | `/admin/providers/{id}` | Detail: `{ provider, products[], totalProducts }`. Products: `slug`, `name`, `categorySlug`, `chargeType`, `chargeValue` (kobo for flat), `chargeCap`, `isActive`. | `src/components/provider/provider-details-view.tsx` |
| PATCH | `/admin/providers/{providerId}` | Update provider email `{ email }` | `provider-details-view.tsx` |
| PATCH | `/admin/providers/{providerId}/toggle` | Provider active/inactive `{ isActive }` | `provider-details-view.tsx` |
| PATCH | `/admin/providers/{providerId}/products/{productSlug}/commission` | Product commission `{ chargeType, chargeValue, chargeCap }` | `provider-details-view.tsx`, `provider-modals.tsx` |
| PATCH | `/admin/providers/{providerId}/products/{productSlug}/toggle` | Product active/inactive `{ isActive }` | `provider-details-view.tsx` |

---

## 6) Admin Referrals

Source module: `src/lib/admin-api/referrals-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/referrals` | Paginated referrer list, search, status filter | `src/components/user-mgt/referral-view.tsx` |
| GET | `/admin/referrals/summary` | Referral metrics (available for future stat cards) | `src/lib/admin-api/referrals-api.ts` |
| GET | `/admin/referrals/config` | Load active earning configuration in modal (404 → create flow) | `referral-config-modal.tsx` |
| POST | `/admin/referrals/config` | Create first referral configuration (super_admin) | `referral-config-modal.tsx` |
| PUT | `/admin/referrals/config` | Update active referral configuration (super_admin) | `referral-config-modal.tsx` |
| GET | `/admin/referrals/{accountId}` | Referrer profile, stats, referred users table | `src/components/user-mgt/referral-details-view.tsx` |

---

## 7) Admin Audit Trail

Source module: `src/lib/admin-api/audit-api.ts`

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/audit/internal-users` | Internal Users tab — session list | `src/components/audit-trail/audit-trail-view.tsx` |
| GET | `/admin/audit/customers` | Customers tab — session list (email/action from nested `customer` + session fields) | `src/components/audit-trail/audit-trail-view.tsx` |
| GET | `/admin/audit/internal-users/{adminId}/logs` | Internal user activity detail | `src/components/audit-trail/audit-trail-details-view.tsx` |
| GET | `/admin/audit/customers/{accountId}/logs` | Customer activity detail + customer detail Audit Log tab | `audit-trail-details-view.tsx`, `customers-details-view.tsx` |

| POST | `/admin/audit/export` | CSV/PDF/JSON export for audit list and detail logs | `audit-trail-view.tsx`, `audit-trail-details-view.tsx`, `export-api.ts` |

**Not wired in UI (optional later):** per-log `GET .../logs/{logId}`.

**Client-side table export (no dedicated API):** Customers, Referrals, Communication, Admin Management, Provider/Product details, Settings authentication users, Dashboard summary — via `src/lib/export/table-export.ts` and `TableExportMenu`.

OpenAPI does not document list query params; search/role/action filters are client-side on loaded rows. Date pill is UI-only until a picker sends ISO `fromDate`/`toDate`.

---

## 8) Admin Roles & Permissions

Source module: `src/lib/admin-api/roles-api.ts` (re-exported from `team-api.ts` for invite/change-role dropdowns)

| Method | Endpoint | Application in product | Main usage locations |
|---|---|---|---|
| GET | `/admin/permissions` | Permission catalog grouped by module (create/edit role checkboxes) | `admin-role-modals.tsx` |
| GET | `/admin/roles` | Role cards grid + team invite / change-role options | `admin-roles-tab.tsx`, `admin-management-view.tsx` |
| POST | `/admin/roles` | Create role (super admin) | `admin-role-modals.tsx` |
| GET | `/admin/roles/{id}` | Role detail for edit / permissions modal | `admin-role-modals.tsx` |
| PUT | `/admin/roles/{id}` | Update role (400 duplicate/invalid keys, 403 system name) | `admin-role-modals.tsx` |
| DELETE | `/admin/roles/{id}` | Delete role (blocked for system roles or active members) | `admin-role-modals.tsx` |
| GET | `/admin/roles/{id}/permissions` | Assigned permission keys (fallback if detail omits keys) | `admin-role-modals.tsx` |
| GET | `/admin/roles/{id}/members` | Member avatars + count on role cards | `admin-roles-tab.tsx` |

---

## 9) Role-aware Application Rules Implemented

- Settings tabs hide super-admin-only areas for non-super-admins:
  - Password Policy tab hidden unless `isLikelySuperAdminFromToken(getAccessToken())` is true.
  - Reset Requests sub-tab hidden unless super admin.
- Sidebar now reflects auth token user hints (name/role/email/initials) and uses a logout confirmation modal before clearing session.

---

## 10) Quick File Index

- Auth endpoints: `src/lib/admin-api/auth-api.ts`
- Settings endpoints: `src/lib/admin-api/settings-api.ts`
- Customers + customer audit log: `src/lib/admin-api/customers-api.ts`
- Transactions: `src/lib/admin-api/transactions-api.ts`
- Providers: `src/lib/admin-api/providers-api.ts`
- Referrals: `src/lib/admin-api/referrals-api.ts`
- Audit trail: `src/lib/admin-api/audit-api.ts`
- Roles & permissions: `src/lib/admin-api/roles-api.ts`
- API client/refresh/error handling: `src/lib/admin-api/client.ts`
- Endpoint types: `src/lib/admin-api/types.ts`
- Settings policy mapping: `src/lib/admin-api/settings-policy-map.ts`
