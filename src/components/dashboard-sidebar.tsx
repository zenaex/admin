"use client";

import Image from "next/image";
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
  label: string;
  icon: ReactNode;
  active?: boolean;
  trailing?: ReactNode;
  collapsed?: boolean;
};

function SidebarItem({
  label,
  icon,
  active = false,
  trailing,
  collapsed = false,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      className={`relative flex h-10 w-full items-center rounded-lg text-left transition-colors ${
        active
          ? "bg-[#013E2A] text-white"
          : "text-[#C9D8CE] hover:bg-[#013E2A] hover:text-white"
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
    </button>
  );
}

type DashboardSidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export function DashboardSidebar({
  collapsed = false,
  onToggle,
}: DashboardSidebarProps) {
  return (
    <aside
      className={`flex h-screen w-full flex-col overflow-hidden rounded-[22px] bg-[#003E2A] text-white transition-[max-width] duration-200 ease-out will-change-[max-width] ${
        collapsed ? "max-w-19" : "max-w-55"
      }`}
    >
      <div
        className={`flex items-center justify-between pb-4 pt-6 ${
          collapsed ? "px-3" : "px-5"
        }`}
      >
        {collapsed ? (
          <div className="flex w-full justify-center">
            <Image
              src="/logo/Logo-small.svg"
              alt="Zenaex compact logo"
            width={28}
            height={28}
            />
          </div>
        ) : (
          <Image
            src="/logo/logo-green.svg"
            alt="Zenaex logo"
            width={116}
            height={18}
          />
        )}
        {!collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#013E2A] text-[#C9D8CE]"
            aria-label="Collapse sidebar"
          >
            {/* placeholder; interaction is hover-driven */}
          </button>
        ) : null}
      </div>

      <div className="h-px bg-[#155241]" />

      <div className={`flex-1 overflow-y-auto py-5 ${collapsed ? "px-3" : "px-3"}`}>
        {!collapsed ? (
          <p className="px-2 text-[12px] font-medium uppercase tracking-wide text-[#D6E2DA]">
            Main Menu
          </p>
        ) : null}

        <div className="mt-4 space-y-1">
          <SidebarItem
            label="Dashboard"
            icon={<Element size="20" color="currentColor" variant="Bold" />}
            active
            collapsed={collapsed}
          />
          <SidebarItem
            label="Transactions"
            icon={<Moneys size="20" color="currentColor" variant="Outline" />}
            collapsed={collapsed}
          />
          <SidebarItem
            label="User Mgt"
            icon={<People size="20" color="currentColor" variant="Outline" />}
            trailing={
              collapsed ? null : (
                <ArrowDown2 size="14" color="currentColor" variant="Outline" />
              )
            }
            collapsed={collapsed}
          />
          <SidebarItem
            label="Product Mgt"
            icon={<I3Dcube size="20" color="currentColor" variant="Outline" />}
            collapsed={collapsed}
          />
          <SidebarItem
            label="E-trades"
            icon={<I3Dcube size="20" color="currentColor" variant="Outline" />}
            collapsed={collapsed}
          />
          <SidebarItem
            label="Biller Management"
            icon={<NotificationStatus size="20" color="currentColor" variant="Outline" />}
            collapsed={collapsed}
          />
          <SidebarItem
            label="Audit Trail"
            icon={<Activity size="20" color="currentColor" variant="Outline" />}
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
            label="Communication"
            icon={<DirectboxNotif size="20" color="currentColor" variant="Outline" />}
            collapsed={collapsed}
          />
          <SidebarItem
            label="Settings"
            icon={<Setting2 size="20" color="currentColor" variant="Outline" />}
            collapsed={collapsed}
          />
        </div>
      </div>

      <div className="h-px bg-[#155241]" />

      <div className={`pb-6 pt-4 ${collapsed ? "px-3" : "px-4"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[14px] font-medium text-[#003E2A]">
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
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 text-[13px] text-[#D6E2DA]"
          >
            <LogoutCurve size="20" color="#FF3B30" variant="Outline" />
            <span>Log out</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
