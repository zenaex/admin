# Zenaex Admin — project documentation

This document describes the **admin** web app in this repository: stack, routing, UI structure, theming, and conventions implemented so far.

---

## 1. Stack

| Area | Choice |
|------|--------|
| Framework | **Next.js** (App Router) — `src/app/` |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"`, `@theme inline` in `src/app/globals.css`) |
| Icons | **iconsax-react** (`iconsax-react`) |
| React | **19.x** (see `package.json`) |
| Next | **16.2.1** (see `package.json`) |

Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

---

## 2. Brand & global UI

- **Fonts (root layout)**  
  - Primary UI font: **Schibsted Grotesk** via `next/font/google` (`Schibsted_Grotesk`), exposed as `--font-schibsted-grotesk`.  
  - Monospace: **Geist Mono** (`Geist_Mono`), `--font-geist-mono`.

- **CSS variables** (`src/app/globals.css`)  
  - `--primary-green`: `#BCEB0F`  
  - `--primary-text`: `#0A0A0A`  
  - `--secondary-green`: `#013220`  
  - Mapped into Tailwind theme as `--color-primary-green`, `--color-primary-text`, `--color-secondary-green`.

- **Metadata** (`src/app/layout.tsx`)  
  - Title: `Zenaex-Admin`  
  - Favicon / shortcut / apple icons: `/logo/Logo-small.svg`

- **Dark mode**  
  - `prefers-color-scheme: dark` adjusts `--background` / `--foreground` in `globals.css` (pages may still use light-specific dashboard colors where hard-coded).

---

## 3. Routing (App Router)

All routes live under **`src/app/`**. The home route redirects to login.

| URL | Role |
|-----|------|
| `/` | Redirects to `/login` (`src/app/page.tsx`) |
| `/login` | Login screen |
| `/login/otp` | OTP step after login |
| `/onboarding` | Invite / create-password style onboarding |
| `/forgot-password` | Multi-step forgot-password UI (mock) |
| `/dashboard` | Dashboard home (stub content per page file) |
| `/dashboard/transactions` | Stub |
| `/dashboard/e-trades` | Stub |
| `/dashboard/product-mgt` | Stub |
| `/dashboard/biller-management` | Stub |
| `/dashboard/communication` | Stub |
| `/dashboard/audit-trail` | Stub |
| `/dashboard/settings` | Stub |
| `/dashboard/user-mgt` | Redirects to `/dashboard/user-mgt/customers` |
| `/dashboard/user-mgt/customers` | User Mgt — customers (default under user-mgt) |
| `/dashboard/user-mgt/admin-management` | User Mgt — admin management |
| `/dashboard/user-mgt/referral` | User Mgt — referral |

---

## 4. Page components vs `src/pages/`

- **App Router pages** are the small files in `src/app/**/page.tsx`. They mostly **import** larger screen components.
- Screen-level UI for auth is grouped under **`src/pages/auth/`**:
  - `login-page.tsx`
  - `otp-page.tsx`
  - `onboarding-page.tsx`
  - `forgot-password-page.tsx`

**Important:** The folder name `src/pages` is **not** the Next.js Pages Router. Routes are **only** defined by `src/app/`. Duplicates of auth screens used to exist at `src/pages/*.tsx` root; those were **removed** so stray files are not mistaken for Pages Router routes and to avoid duplicate `/login-page`-style routes during build.

Imports use the `@/` alias, e.g. `@/pages/auth/login-page`.

---

## 5. Auth flows (mock / client-side)

These flows are implemented for UX and navigation; **credentials and OTP are not validated against a real backend** in the described setup.

- **Login → OTP → Dashboard**  
  Any input can proceed: login navigates to `/login/otp`, OTP proceeds to `/dashboard`.

- **Onboarding**  
  Password creation UI then mock redirect to `/login`.

- **Forgot password**  
  Multi-step UI and modals; success path returns user toward login (mock).

Exact behavior is in the `*-page.tsx` files under `src/pages/auth/`.

---

## 6. Dashboard layout & sidebar

- **`src/app/dashboard/layout.tsx`** wraps all `/dashboard/*` routes in **`DashboardShell`**.

- **`DashboardShell`** (`src/components/dashboard-shell.tsx`)  
  - Full viewport height (`h-dvh`), horizontal layout: sidebar + main.  
  - **Sidebar** sits in a hover zone: mouse enter expands, mouse leave collapses after a short timeout (collapsed by default in code).  
  - **Only the main column scrolls** (`main` has `overflow-y-auto`); sidebar column does not scroll with page content.

- **`DashboardSidebar`** (`src/components/dashboard-sidebar.tsx`)  
  - **Expanded:** logo `public/logo/logo-green.svg`.  
  - **Collapsed:** compact logo `public/logo/Logo-small.svg` (matches favicon asset).  
  - **Icons:** Iconsax; inactive uses outline-style icons, active uses bold variants where implemented.  
  - **User Mgt** is an expandable section with links to **Customers**, **Admin Management**, **Referral**.  
  - Active subsection logic: under `/dashboard/user-mgt`, **customers** is the default active item unless path matches admin-management or referral.

---

## 7. Shared components (`src/components/`)

Reusable building blocks used across auth and dashboard:

- `button.tsx`
- `input-field.tsx`
- `password-field.tsx`
- `otp-field.tsx`
- `dashboard-shell.tsx`
- `dashboard-sidebar.tsx`
- `admin-starter-badge.tsx` (if present in tree)

---

## 8. Deployment / Vercel

- **`vercel.json`** defines a **rewrite** rule sending all paths `/(.*)` to `/`. Treat this as intentional for your hosting setup (e.g. SPA-style hosting); if client-side routing misbehaves in production, validate that this matches how Next.js expects to serve App Router routes.

- **Build:** Run `npm run build` locally before deploy. Past issues included type/build errors when files under `src/pages/` were interpreted as Pages Router pages without proper exports; consolidating auth views under `src/pages/auth/` and removing duplicate root `src/pages/*.tsx` files addresses that class of problem.

---

## 9. Repository layout (high level)

```
src/
  app/                 # App Router: layouts, pages, globals
  components/          # Shared UI
  pages/auth/          # Auth screen components (imported by app routes)
public/
  logo/                # SVG logos (including Logo-small.svg, logo-green.svg)
docs/
  PROJECT.md           # This file
```

---

## 10. Maintenance notes

- Prefer **`src/app/`** for new routes; put large page UIs in **`src/components/`** or a dedicated folder (e.g. `src/pages/auth/` for auth) to avoid mixing with Next’s optional **`pages/`** directory at the project root (this project uses `src/app` only for routing).  
- After structural moves, run **`npm run lint`** and **`npm run build`**.

---

*Generated to reflect the state of the codebase; adjust this file when behavior or structure changes.*
