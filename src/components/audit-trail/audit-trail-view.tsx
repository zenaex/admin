"use client";

import { useMemo, useState } from "react";

import { AuditTrailHeader } from "@/components/audit-trail/audit-trail-header";
import { AuditTrailPagination } from "@/components/audit-trail/audit-trail-pagination";
import { AuditTrailRow, AuditTrailTable } from "@/components/audit-trail/audit-trail-table";
import { AuditTrailTabId, AuditTrailTabs } from "@/components/audit-trail/audit-trail-tabs";
import { AuditTrailToolbar } from "@/components/audit-trail/audit-trail-toolbar";

const INTERNAL_BASE_ROWS: Omit<AuditTrailRow, "id">[] = [
  {
    name: "Adeboye Temidayo",
    email: "Adeboye.temidayo@zaneax.com",
    role: "Superadmin",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chioma N.",
    email: "chioma.n@zaneax.com",
    role: "Admin",
    action: "Added a user",
    sessionIn: "Jan 6, 2026 | 10:15AM",
    sessionOut: "Jan 6, 2026 | 11:02AM",
  },
  {
    name: "Ibrahim Sule",
    email: "ibrahim.s@zaneax.com",
    role: "Tech Support",
    action: "Deactivated a user",
    sessionIn: "Jan 5, 2026 | 2:40PM",
    sessionOut: "Jan 5, 2026 | 4:12PM",
  },
  {
    name: "Grace Okoro",
    email: "grace.o@zaneax.com",
    role: "Admin",
    action: "Approved wallet transaction",
    sessionIn: "Jan 5, 2026 | 8:10AM",
    sessionOut: "Jan 5, 2026 | 9:45AM",
  },
  {
    name: "Tunde Bakare",
    email: "tunde.b@zaneax.com",
    role: "Superadmin",
    action: "Updated role permissions",
    sessionIn: "Jan 4, 2026 | 3:22PM",
    sessionOut: "Jan 4, 2026 | 3:55PM",
  },
  {
    name: "Amaka Eze",
    email: "amaka.e@zaneax.com",
    role: "Tech Support",
    action: "Reset MFA device",
    sessionIn: "Jan 4, 2026 | 11:05AM",
    sessionOut: "Jan 4, 2026 | 11:30AM",
  },
  {
    name: "Kingsley O.",
    email: "kingsley.o@zaneax.com",
    role: "Admin",
    action: "Exported audit report",
    sessionIn: "Jan 3, 2026 | 4:50PM",
    sessionOut: "Jan 3, 2026 | 5:10PM",
  },
  {
    name: "Yewande A.",
    email: "yewande.a@zaneax.com",
    role: "Superadmin",
    action: "Approved wallet transaction",
    sessionIn: "Jan 3, 2026 | 9:00AM",
    sessionOut: "Jan 3, 2026 | 10:12AM",
  },
];

const CUSTOMER_BASE_ROWS: Omit<AuditTrailRow, "id">[] = [
  {
    name: "Adeboye Temidayo",
    email: "Adeboye.temidayo@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Azuka Adefemi",
    email: "Azuka.adefemi@zaneax.com",
    role: "@Kashmadupe",
    action: "Added a user",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Babangida Tunde",
    email: "Babangida.tunde@zaneax.com",
    role: "@Kashmadupe",
    action: "Deactivated a user",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chiamaka Ngozi",
    email: "Chiamaka.ngozi@zaneax.com",
    role: "@Kashmadupe",
    action: "Added a user",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chiroma Ikechukwu",
    email: "Chiroma.ikechukwu@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Chizoba Adekunle",
    email: "Chizoba.adekunle@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Lala Jibola",
    email: "Lala.jibola@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
  {
    name: "Lala Serubawon",
    email: "Lala.serubawon@zaneax.com",
    role: "@Kashmadupe",
    action: "Approved wallet transaction",
    sessionIn: "Jan 6, 2026 | 9:32AM",
    sessionOut: "Jan 6, 2026 | 9:32AM",
  },
];

function buildMockRows(
  count: number,
  baseRows: Omit<AuditTrailRow, "id">[],
  idPrefix: string,
): AuditTrailRow[] {
  return Array.from({ length: count }, (_, i) => {
    const base = baseRows[i % baseRows.length];
    return {
      ...base,
      id: `${idPrefix}-row-${i}`,
      name: i < baseRows.length ? base.name : `${base.name} (${i + 1})`,
    };
  });
}

const INTERNAL_ROWS = buildMockRows(180, INTERNAL_BASE_ROWS, "internal");
const CUSTOMER_ROWS = buildMockRows(180, CUSTOMER_BASE_ROWS, "customer");

export function AuditTrailView() {
  const [tab, setTab] = useState<AuditTrailTabId>("internal");
  const [tableSearch, setTableSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);

  const activeRows = tab === "customers" ? CUSTOMER_ROWS : INTERNAL_ROWS;

  const filteredRows = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    const source = activeRows;
    if (!q) return source;
    return source.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }, [tableSearch, activeRows]);

  const totalItems = filteredRows.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  return (
    <div>
      <AuditTrailHeader />
      <AuditTrailTabs
        active={tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          setPage(1);
        }}
      />
      <AuditTrailToolbar tableSearch={tableSearch} onTableSearchChange={setTableSearch} />
      <AuditTrailTable rows={paginatedRows} />
      <AuditTrailPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </div>
  );
}
