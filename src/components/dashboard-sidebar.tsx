"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  ArrowDown2,
  DirectboxNotif,
  Element,
  I3Dcube,
  Moneys,
  NotificationStatus,
  People,
  Activity,
  Setting2,
  LogoutCurve,
  MoneySend,
  User,
} from "iconsax-react";

import { ConfirmModal } from "@/components/provider/provider-modals";
import { useAuth } from "@/lib/auth/auth-context";

type SidebarItemProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  trailing?: ReactNode;
  collapsed?: boolean;
};

function SidebarItem({
  href,
  label,
  icon,
  active = false,
  trailing,
  collapsed = false,
}: SidebarItemProps) {
  const className = `relative flex h-10 w-full items-center rounded-lg text-left transition-colors ${
    active
      ? "bg-secondary-green text-white"
      : "text-input-disabled-text hover:bg-secondary-green hover:text-white"
  } ${collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"}`;

  const content = (
    <>
      {active ? (
        <span className="absolute -left-4 top-1/2 h-6 w-3 -translate-y-1/2 rounded-r-full bg-primary-green" />
      ) : null}
      <span className={active ? "text-white" : "text-input-disabled-text"}>{icon}</span>
      {!collapsed ? <span className="text-[14px] font-medium">{label}</span> : null}
      {!collapsed && trailing ? (
        <span className="ml-auto text-input-disabled-text">{trailing}</span>
      ) : null}
    </>
  );

  if (active) {
    return (
      <div className={className} aria-label={label} aria-current="page">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-label={label}
    >
      {content}
    </Link>
  );
}

type DashboardSidebarProps = {
  collapsed?: boolean;
};

function isCustomerMgtPath(path: string) {
  return (
    path.startsWith("/dashboard/user-mgt/customers") ||
    path.startsWith("/dashboard/user-mgt/referral")
  );
}

export function DashboardSidebar({ collapsed = false }: DashboardSidebarProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { logout, displayName, displayRole, displayEmail, userInitials } = useAuth();

  const [activeOverrideHref, setActiveOverrideHref] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const sidebarTitle = displayName?.trim() || displayEmail?.trim() || "Admin";
  const sidebarSubtitle = displayRole?.trim() || "Administrator";

  const isCustomerMgtRoute = isCustomerMgtPath(pathname);
  const activeCustomerMgtItem = pathname.startsWith("/dashboard/user-mgt/referral") ? "referral" : "customers";

  const [isCustomerMgtOpen, setIsCustomerMgtOpen] = useState(isCustomerMgtRoute);

  useEffect(() => {
    // Clear manual highlight and collapse expandable sections when the route changes.
    setActiveOverrideHref(null);
    if (isCustomerMgtPath(pathname)) {
      setIsCustomerMgtOpen(true);
    } else {
      setIsCustomerMgtOpen(false);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (activeOverrideHref) return href === activeOverrideHref;
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={`flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[12px] bg-secondary-green text-white transition-[width] duration-200 ease-in-out will-change-[width] ${
        collapsed ? "w-[82px]" : "w-[232px]"
      }`}
    >
      <div
        className={`flex items-center justify-between pb-4 pt-6 ${
          collapsed ? "px-3" : "px-5"
        }`}
      >
        {collapsed ? (
          <Link href="/dashboard" className="flex w-full justify-center" aria-label="Dashboard home">
            <Image
              src="/logo/Logo-small.svg"
              alt="Zenaex compact logo"
              width={28}
              height={28}
            />
          </Link>
        ) : (
          <Link href="/dashboard" aria-label="Dashboard home">
            <Image
              src="/logo/logo-green.svg"
              alt="Zenaex logo"
              width={116}
              height={18}
            />
          </Link>
        )}
        {!collapsed ? <span className="inline-flex h-8 w-8" aria-hidden /> : null}
      </div>

      <div className="h-px bg-secondary-green" />

      <div className={`flex-1 overflow-y-auto py-5 ${collapsed ? "px-3" : "px-3"}`}>
        {!collapsed ? (
          <p className="px-2 text-[14px] font-medium uppercase text-grey-400">
            Main Menu
          </p>
        ) : null}

        <div className="mt-4 space-y-1">
          <SidebarItem
            href="/dashboard"
            label="Dashboard"
            icon={
              <Element
                size="24"
                color="currentColor"
                variant={isActive("/dashboard") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard")}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/dashboard/transactions"
            label="Transactions"
            icon={
              <Moneys
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/transactions") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/transactions")}
            collapsed={collapsed}
          />
          {collapsed ? (
            <SidebarItem
              href="/dashboard/user-mgt/customers"
              label="Customer Mgt"
              icon={
                <People
                  size="24px"
                  color="currentColor"
                  variant={isCustomerMgtRoute ? "Bold" : "Outline"}
                />
              }
              active={isCustomerMgtRoute}
              collapsed={collapsed}
            />
          ) : (
            <button
              type="button"
              className={`relative flex h-10 w-full items-center rounded-lg text-left transition-colors ${
                isCustomerMgtRoute
                  ? "bg-secondary-green text-white"
                  : "text-input-disabled-text hover:bg-secondary-green hover:text-white"
              } ${collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"}`}
              aria-label="Customer Mgt"
              aria-expanded={isCustomerMgtOpen}
              onClick={() => {
                let nextOpen = false;
                setIsCustomerMgtOpen((prev) => {
                  nextOpen = !prev;
                  return nextOpen;
                });
                setActiveOverrideHref(nextOpen ? "/dashboard/user-mgt/customers" : null);
                if (nextOpen && !isCustomerMgtPath(pathname)) {
                  router.push("/dashboard/user-mgt/customers");
                }
              }}
            >
              {isCustomerMgtOpen ? (
                <span className="absolute -left-4 top-1/2 h-6 w-3 -translate-y-1/2 rounded-r-full bg-primary-green" />
              ) : null}
              <span className={isCustomerMgtOpen ? "text-white" : "text-input-disabled-text"}>
                <People
                  size="24px"
                  color="currentColor"
                  variant={isCustomerMgtOpen ? "Bold" : "Outline"}
                />
              </span>
              <span className="text-[14px] font-medium">Customer Mgt</span>
              <span
                className={`ml-auto text-input-disabled-text transition-transform ${
                  isCustomerMgtOpen ? "rotate-180" : ""
                }`}
              >
                <ArrowDown2 size="24" color="currentColor" variant="Outline" />
              </span>
            </button>
          )}

          {!collapsed && isCustomerMgtOpen ? (
            <div className="relative mt-1 ml-5 pl-3 rounded-[6px] w-[96px]">
              {/* Connector line that passes through the submenu dots */}
              <div className="absolute left-5 -top-2 bottom-4 w-px bg-input-disabled-text" />

              <div className="space-y-3">
                <Link
                  href="/dashboard/user-mgt/customers"
                  className={`relative flex flex-nowrap items-center pl-6 whitespace-nowrap text-[14px] font-medium ${
                    activeCustomerMgtItem === "customers"
                      ? "text-white"
                      : "text-input-disabled-text hover:text-white"
                  }`}
                  aria-label="Customers"
                  onClick={(e) => {
                    if (activeCustomerMgtItem === "customers") e.preventDefault();
                  }}
                >
                  <span
                    className={`absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                      activeCustomerMgtItem === "customers"
                        ? "bg-white"
                        : "bg-input-disabled-text"
                    } z-10`}
                  />
                  Customers
                </Link>

                <Link
                  href="/dashboard/user-mgt/referral"
                  className={`relative flex flex-nowrap items-center pl-6 whitespace-nowrap text-[14px] font-medium ${
                    activeCustomerMgtItem === "referral"
                      ? "text-white"
                      : "text-input-disabled-text hover:text-white"
                  }`}
                  aria-label="Referral"
                  onClick={(e) => {
                    if (activeCustomerMgtItem === "referral") e.preventDefault();
                  }}
                >
                  <span
                    className={`absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                      activeCustomerMgtItem === "referral"
                        ? "bg-white"
                        : "bg-input-disabled-text"
                    } z-10`}
                  />
                  Referral
                </Link>
              </div>
            </div>
          ) : null}
          <SidebarItem
            href="/dashboard/product-mgt"
            label="Product & Rate Mgt"
            icon={
              <I3Dcube
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/product-mgt") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/product-mgt")}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/dashboard/e-trades"
            label="E-trades"
            icon={
              <MoneySend
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/e-trades") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/e-trades")}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/dashboard/provider"
            label="Provider"
            icon={
              <NotificationStatus
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/provider") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/provider")}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/dashboard/audit-trail"
            label="Audit Trail"
            icon={
              <Activity
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/audit-trail") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/audit-trail")}
            collapsed={collapsed}
          />
        </div>

        {!collapsed ? (
          <p className="mt-7 px-2 text-[13px] font-medium uppercase text-sidebar-label">
            Account Management
          </p>
        ) : null}
        <div className="mt-4 space-y-1">
          <SidebarItem
            href="/dashboard/communication"
            label="Communication"
            icon={
              <DirectboxNotif
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/communication") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/communication")}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/dashboard/user-mgt/admin-management"
            label="User Management"
            icon={
              <User
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/user-mgt/admin-management") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/user-mgt/admin-management")}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/dashboard/settings"
            label="Settings"
            icon={
              <Setting2
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/settings") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/settings")}
            collapsed={collapsed}
          />
        </div>
      </div>

      <div className="h-px bg-secondary-green" />

      <div className={`pb-6 pt-4 ${collapsed ? "px-3" : "px-4"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-secondary-green"
            aria-hidden
          >
            {userInitials}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-white">{sidebarTitle}</p>
              <p className="truncate text-[11px] text-label">{sidebarSubtitle}</p>
              {displayEmail && sidebarTitle !== displayEmail ? (
                <p className="mt-0.5 truncate text-[10px] text-sidebar-label">{displayEmail}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        {collapsed ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-label transition-colors hover:bg-white/10"
              aria-label="Log out"
              onClick={() => setLogoutOpen(true)}
            >
              <LogoutCurve size="22" color="var(--color-coral-red)" variant="Outline" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 text-[13px] text-sidebar-label transition-colors hover:text-white"
            onClick={() => setLogoutOpen(true)}
          >
            <LogoutCurve size="24" color="var(--color-coral-red)" variant="Outline" />
            <span>Log out</span>
          </button>
        )}
      </div>

      {logoutOpen ? (
        <ConfirmModal
          variant="danger"
          title="Log out?"
          message="You will need to sign in again to access the admin dashboard."
          confirmLabel="Log out"
          cancelLabel="Cancel"
          onConfirm={() => {
            logout();
            router.replace("/login");
            setLogoutOpen(false);
          }}
          onCancel={() => setLogoutOpen(false)}
        />
      ) : null}
    </aside>
  );
}
