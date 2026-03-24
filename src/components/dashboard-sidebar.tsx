"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
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
} from "iconsax-react";

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
  return (
    <Link
      href={href}
      className={`relative flex h-10 w-full items-center rounded-lg text-left transition-colors ${
        active
          ? "bg-secondary-green text-white"
          : "text-[#C9D8CE] hover:bg-secondary-green hover:text-white"
      } ${collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"}`}
      aria-label={label}
    >
      {active ? (
        <span className="absolute -left-4 top-1/2 h-6 w-3 -translate-y-1/2 rounded-r-full bg-[#BCEB0F]" />
      ) : null}
      <span className={active ? "text-white" : "text-[#B7C7BE]"}>{icon}</span>
      {!collapsed ? <span className="text-[14px] font-medium">{label}</span> : null}
      {!collapsed && trailing ? (
        <span className="ml-auto text-[#9DB0A4]">{trailing}</span>
      ) : null}
    </Link>
  );
}

type DashboardSidebarProps = {
  collapsed?: boolean;
};

export function DashboardSidebar({ collapsed = false }: DashboardSidebarProps) {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const isUserMgtOpen = isActive("/dashboard/user-mgt");
  const activeUserMgtItem = pathname.startsWith("/dashboard/user-mgt/admin-management")
    ? "admin-management"
    : pathname.startsWith("/dashboard/user-mgt/referral")
      ? "referral"
      : "customers";

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
          <p className="px-2 text-[12px] font-medium uppercase tracking-wide text-[#D6E2DA]">
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
          <Link
            href="/dashboard/user-mgt"
            className={`relative flex h-10 w-full items-center rounded-lg text-left transition-colors ${
              isUserMgtOpen
                ? "bg-secondary-green text-white"
                : "text-[#C9D8CE] hover:bg-secondary-green hover:text-white"
            } ${collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"}`}
            aria-label="User Mgt"
          >
            {isUserMgtOpen ? (
              <span className="absolute -left-4 top-1/2 h-6 w-3 -translate-y-1/2 rounded-r-full bg-[#BCEB0F]" />
            ) : null}
            <span className={isUserMgtOpen ? "text-white" : "text-[#B7C7BE]"}>
              <People
                size="24px"
                color="currentColor"
                variant={isUserMgtOpen ? "Bold" : "Outline"}
              />
            </span>
            {!collapsed ? (
              <span className="text-[14px] font-medium">User Mgt</span>
            ) : null}
            {!collapsed ? (
              <span
                className={`ml-auto text-[#9DB0A4] transition-transform ${
                  isUserMgtOpen ? "rotate-180" : ""
                }`}
              >
                <ArrowDown2 size="24" color="currentColor" variant="Outline" />
              </span>
            ) : null}
          </Link>

          {!collapsed && isUserMgtOpen ? (
            <div className="relative mt-1 ml-5 pl-3 rounded-[6px] w-[82px]">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-secondary-green" />

              <div className="space-y-3">
                <Link
                  href="/dashboard/user-mgt/customers"
                  className={`relative flex items-center pl-6 text-[14px] font-medium ${
                    activeUserMgtItem === "customers"
                      ? "text-white"
                      : "text-[#9DB0A4] hover:text-white"
                  }`}
                  aria-label="Customers"
                >
                  <span
                    className={`absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                      activeUserMgtItem === "customers"
                        ? "bg-[#BCEB0F]"
                        : "bg-[#C9D8CE]"
                    }`}
                  />
                  Customers
                </Link>

                <Link
                  href="/dashboard/user-mgt/admin-management"
                  className={`relative flex items-center pl-6 text-[14px] font-medium ${
                    activeUserMgtItem === "admin-management"
                      ? "text-white"
                      : "text-[#9DB0A4] hover:text-white"
                  }`}
                  aria-label="Admin Management"
                >
                  <span
                    className={`absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                      activeUserMgtItem === "admin-management"
                        ? "bg-[#BCEB0F]"
                        : "bg-[#C9D8CE]"
                    }`}
                  />
                  Admin Management
                </Link>

                <Link
                  href="/dashboard/user-mgt/referral"
                  className={`relative flex items-center pl-6 text-[14px] font-medium ${
                    activeUserMgtItem === "referral"
                      ? "text-white"
                      : "text-[#9DB0A4] hover:text-white"
                  }`}
                  aria-label="Referral"
                >
                  <span
                    className={`absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                      activeUserMgtItem === "referral"
                        ? "bg-[#BCEB0F]"
                        : "bg-[#C9D8CE]"
                    }`}
                  />
                  Referral
                </Link>
              </div>
            </div>
          ) : null}
          <SidebarItem
            href="/dashboard/product-mgt"
            label="Product Mgt"
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
              <I3Dcube
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/e-trades") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/e-trades")}
            collapsed={collapsed}
          />
          <SidebarItem
            href="/dashboard/biller-management"
            label="Biller Management"
            icon={
              <NotificationStatus
                size="24"
                color="currentColor"
                variant={isActive("/dashboard/biller-management") ? "Bold" : "Outline"}
              />
            }
            active={isActive("/dashboard/biller-management")}
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
          <p className="mt-7 px-2 text-[12px] font-medium text-[#D6E2DA]">
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
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[14px] font-medium text-secondary-green">
            RJ
          </div>
          {!collapsed ? (
            <div>
              <p className="text-[12px] font-semibold leading-tight">Roscoly Jibola</p>
              <p className="text-[11px] text-[#9FB4A8]">Superadmin</p>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 text-[13px] text-[#D6E2DA]"
          >
            <LogoutCurve size="24" color="#FF3B30" variant="Outline" />
            <span>Log out</span>
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
