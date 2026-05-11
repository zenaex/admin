"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Profile2User, UserAdd } from "iconsax-react";
import { CalendarDays } from "lucide-react";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { UnderlineTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";
import { ProviderHeader } from "@/components/provider/provider-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  TableFilterApplyClear,
  TableFilterDropdownCard,
  TableFilterModeBar,
  TableFilterOptionsList,
  TableFilterPanelTitle,
  TableFilterPill,
  TableFilterTrailingIconButton,
  useTableFilterBarAnchor,
} from "@/components/ui/table-filter-bar";

/* ── Tab config ── */
type CustomerTab = "All" | "Active" | "Blocked" | "PND" | "Lien";
const TABS: CustomerTab[] = ["All", "Active", "Blocked", "PND", "Lien"];

/* ── Types ── */
type CustomerStatus = "Active" | "Inactive" | "Deactivated" | "Blocked" | "PND" | "Lien" | "Blocked | Lien" | "PND | Lien";

type Customer = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  dateOnboarded: string;
};

/* ── Seed data ── */
const BASE_CUSTOMERS: Omit<Customer, "id">[] = [
  { name: "Adekunle Timothy",  username: "@kunletin",    email: "Adekunle@gmail.com",      phone: "08077657878", status: "Deactivated",    dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Timothy Nasiru",    username: "@Timo",        email: "Nastimo@gmail.com",        phone: "08077657878", status: "Active",         dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Babangida Tunde",   username: "@Bangi",       email: "Babangida@yahoo.com",      phone: "08077657878", status: "Active",         dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiamaka Ngozi",    username: "@maxxxxxx",    email: "Maxngigozi@gmail.com",     phone: "08077657878", status: "Blocked | Lien", dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Chiroma Ikechukwu", username: "@CN1boy",      email: "Ikechukwe@gmail.com",      phone: "08077657878", status: "Inactive",       dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Chizoba Adekunle",  username: "@Cngirl",      email: "Chizoba@gmail.com",        phone: "08077657878", status: "Active",         dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Lala Jibola",       username: "@Ogala",       email: "Lalajibola@gmail.com",     phone: "08077657878", status: "Blocked",        dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Pelumi Fetuga",     username: "@Fat",         email: "Pelumifetuga@gmail.com",   phone: "08077657878", status: "Active",         dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Precious Ikotun",   username: "@biotunegbeda",email: "Precioudikotun@gmail.com", phone: "08077657878", status: "PND | Lien",     dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Poco Lee",          username: "@pocojoe",     email: "Poco.lee@yahoo.com",       phone: "08077657878", status: "PND",            dateOnboarded: "Jan 6, 2026 | 9:32AM" },
  { name: "Shakur Wasiu",      username: "@2pacshakur",  email: "Shakurrwasiu@gmail.com",   phone: "08077657878", status: "Lien",           dateOnboarded: "Jan 6, 2026 | 9:32AM" },
];

const ALL_CUSTOMERS: Customer[] = Array.from({ length: 180 }, (_, i) => ({
  ...BASE_CUSTOMERS[i % BASE_CUSTOMERS.length],
  id: `customer-${i}`,
  name:
    i < BASE_CUSTOMERS.length
      ? BASE_CUSTOMERS[i].name
      : `${BASE_CUSTOMERS[i % BASE_CUSTOMERS.length].name} (${i + 1})`,
}));

const CUSTOMER_STATUS_FILTER_OPTIONS: CustomerStatus[] = Array.from(
  new Set(BASE_CUSTOMERS.map((c) => c.status)),
);

function matchesCustomerTab(c: Customer, tab: CustomerTab): boolean {
  if (tab === "All") return true;
  if (tab === "Active") return c.status === "Active";
  if (tab === "Blocked") return c.status.includes("Blocked");
  if (tab === "PND") return c.status.includes("PND");
  if (tab === "Lien") return c.status.includes("Lien");
  return true;
}

/* ── Avatar initials ── */
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-profile-picture text-xs font-semibold text-blue-grey">
      {initials}
    </span>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: CustomerStatus }) {
  const styles: Record<CustomerStatus, string> = {
    Active:           "bg-green-50 text-green-600",
    Inactive:         "bg-zinc-100 text-zinc-500",
    Deactivated:      "bg-red-50 text-red-500",
    Blocked:          "bg-red-50 text-red-500",
    PND:              "bg-red-50 text-red-500",
    Lien:             "bg-red-50 text-red-500",
    "Blocked | Lien": "bg-red-50 text-red-500",
    "PND | Lien":     "bg-red-50 text-red-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

/* ── Main view ── */
export function CustomersView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CustomerTab>("All");
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<null | "status" | "date">(null);
  const { filterBarRef, filterScrollRef, dropdownLeft, registerPillRef, syncDropdownLeft } =
    useTableFilterBarAnchor<"status" | "date">(openFilter, filterMode);

  const [draftStatus, setDraftStatus] = useState<CustomerStatus>(CUSTOMER_STATUS_FILTER_OPTIONS[0] ?? "Active");
  const [draftDateLabel, setDraftDateLabel] = useState("From Jan 6, 2026 - To Jan 6, 2026");
  const [appliedStatus, setAppliedStatus] = useState<CustomerStatus | null>(null);
  const [appliedDateLabel, setAppliedDateLabel] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  useEffect(() => {
    if (!filterMode) setOpenFilter(null);
  }, [filterMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_CUSTOMERS.filter((c) => {
      if (!matchesCustomerTab(c, activeTab)) return false;
      if (appliedStatus && c.status !== appliedStatus) return false;
      if (appliedDateLabel && !c.dateOnboarded.includes("Jan 6, 2026")) return false;
      if (
        q &&
        !(
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [search, activeTab, appliedStatus, appliedDateLabel]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginatedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const allChecked = paginatedRows.length > 0 && paginatedRows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) paginatedRows.forEach((r) => next.delete(r.id));
      else paginatedRows.forEach((r) => next.add(r.id));
      return next;
    });
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <ProviderHeader title="Customers" />

      {/* Stat cards */}
      <div className="mt-6 flex min-w-0 gap-3">
        <StatCard label="Total Customers"    value="₦ 150,000" accentColor="#BCEB0F" icon={<Profile2User size={20} variant="Outline" color="#0B294F" />} />
        <StatCard label="Active Customers"   value="100,000"   accentColor="#3B82F6" icon={<img src="/metrics/green.svg" alt="Active customers" className="h-5 w-5 object-contain" width={20} height={20} />} />
        <StatCard label="Inactive Customers" value="50,000"    accentColor="#EF4444" icon={<img src="/metrics/red.svg" alt="Inactive customers" className="h-5 w-5 object-contain" width={20} height={20} />} />
        <StatCard label="New Sign ups"       value="50,000"    accentColor="#013220" icon={<UserAdd size={20} variant="Outline" color="#0B294F" />} />
      </div>

      {/* Tab bar */}
      <div className="mt-6">
        <UnderlineTabs
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          active={activeTab}
          onChange={(id) => { setActiveTab(id as CustomerTab); setPage(1); }}
        />
      </div>

      {filterMode ? (
        <TableFilterModeBar
          filterBarRef={filterBarRef}
          filterScrollRef={filterScrollRef}
          showBackdrop={Boolean(openFilter)}
          onBackdropClick={() => setOpenFilter(null)}
          onPillsScroll={() => {
            if (openFilter) syncDropdownLeft(openFilter);
          }}
          pills={
            <>
              <TableFilterPill
                label="Status"
                summary={draftStatus}
                pillRef={registerPillRef("status")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "status" ? null : "status";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
              <TableFilterPill
                label="Date onboarded"
                summary={draftDateLabel}
                pillRef={registerPillRef("date")}
                onClick={() =>
                  setOpenFilter((v) => {
                    const next = v === "date" ? null : "date";
                    syncDropdownLeft(next);
                    return next;
                  })
                }
              />
            </>
          }
          pillsTrailing={
            <TableFilterTrailingIconButton
              ariaLabel="Calendar"
              onClick={() =>
                setOpenFilter((v) => {
                  const next = v === "date" ? null : "date";
                  syncDropdownLeft(next);
                  return next;
                })
              }
            >
              <CalendarDays size={14} />
            </TableFilterTrailingIconButton>
          }
          dropdownLayer={
            <>
              {openFilter === "status" ? (
                <TableFilterDropdownCard left={dropdownLeft} widthClass="w-[220px]">
                  <TableFilterPanelTitle />
                  <TableFilterOptionsList
                    options={CUSTOMER_STATUS_FILTER_OPTIONS}
                    onSelect={(opt) => {
                      setDraftStatus(opt as CustomerStatus);
                      setOpenFilter(null);
                    }}
                  />
                </TableFilterDropdownCard>
              ) : null}
              {openFilter === "date" ? (
                <TableFilterDropdownCard left={dropdownLeft}>
                  <TableFilterPanelTitle />
                  <button
                    type="button"
                    className="mt-2 flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-[13px] text-primary-text hover:bg-zinc-50"
                    onClick={() => {
                      setDraftDateLabel("From Jan 6, 2026 - To Jan 6, 2026");
                      setOpenFilter(null);
                    }}
                  >
                    Jan 6, 2026 - Jan 6, 2026
                    <CalendarDays size={16} />
                  </button>
                </TableFilterDropdownCard>
              ) : null}
            </>
          }
          actions={
            <TableFilterApplyClear
              onApply={() => {
                setAppliedStatus(draftStatus);
                setAppliedDateLabel(draftDateLabel);
                setOpenFilter(null);
                setPage(1);
              }}
              onClear={() => {
                setSearch("");
                setAppliedStatus(null);
                setAppliedDateLabel(null);
                setDraftStatus(CUSTOMER_STATUS_FILTER_OPTIONS[0] ?? "Active");
                setDraftDateLabel("From Jan 6, 2026 - To Jan 6, 2026");
                setOpenFilter(null);
                setFilterMode(false);
                setPage(1);
              }}
            />
          }
        />
      ) : (
        <AuditTrailToolbar
          tableSearch={search}
          onTableSearchChange={setSearch}
          onFilterClick={() => {
            setSearch("");
            setFilterMode(true);
          }}
        />
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[8px]">
        <table className="w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-xs text-zinc-400">
              <th className="h-11 w-10 border-b border-zinc-200 px-4 py-0 align-middle">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                />
              </th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Customer Name</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Email Address</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Phone Number</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Status</th>
              <th className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">Date Onboarded</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => (
              <tr key={row.id} onClick={() => router.push(`/dashboard/user-mgt/customers/${row.id}`)} className="cursor-pointer transition-colors hover:bg-zinc-50">
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-secondary-green"
                  />
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.name} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary-text">{row.name}</span>
                      <span className="text-xs text-zinc-400">{row.username}</span>
                    </div>
                  </div>
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.email}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 text-zinc-500 align-middle">{row.phone}</td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 align-middle">
                  <StatusBadge status={row.status} />
                </td>
                <td className="h-16 border-b border-zinc-100 px-4 py-0 whitespace-nowrap text-zinc-500 align-middle">{row.dateOnboarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
}
