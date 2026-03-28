"use client";

import Link from "next/link";
import { ArrowDown2, ArrowLeft2, ArrowRight2 } from "iconsax-react";

type ActivityItem = {
  time: string;
  message: string;
  userAgent: string;
  ip: string;
};

const userDetails = {
  name: "Shakur Waisu",
  role: "Tech Support",
  phoneNumber: "080778567878",
  emailAddress: "Shakurwaisu@gmail.com",
  dateAdded: "Jan 6, 2025 | 9:32AM",
};

const todayActivities: ActivityItem[] = Array.from({ length: 4 }, () => ({
  time: "2022-01-19 03:14:07",
  message: "User Logged in with fingerprint successfully",
  userAgent: "Mozilla/5.0 (Windows 11; Win 64; x64)",
  ip: "192.160.1.1",
}));

const yesterdayActivities: ActivityItem[] = Array.from({ length: 4 }, () => ({
  time: "2022-01-19 03:14:07",
  message: "User Logged in with fingerprint successfully",
  userAgent: "Mozilla/5.0 (Windows 11; Win 64; x64)",
  ip: "192.160.1.1",
}));

function ActivityGroup({ title, items }: { title: string; items: ActivityItem[] }) {
  return (
    <section className="mt-6">
      <h3 className="text-[18px] font-semibold text-primary-text">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, idx) => (
          <div
            key={`${title}-${idx}`}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-xl border border-[#E8EBEE] bg-white px-4 py-4 text-sm"
          >
            <span className="rounded-md bg-[#E8EBEE] px-2 py-1 text-[#001928]">{item.time}</span>
            <span className="text-[#001928]">{item.message}</span>
            <span className="text-[#001928]">{item.userAgent}</span>
            <span className="text-[#001928]">{item.ip}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AuditTrailDetailsView() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[#E8EBEE] bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/audit-trail" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Audit Trail
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Audit Trail Details</span>
        </div>

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 bg-[#F7F7F7] px-3 text-xs font-semibold text-primary-text"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold text-primary-text">User Details</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#E8EBEE] bg-white">
          <table className="w-full min-w-200 border-collapse text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Name</th>
                <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Role</th>
                <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Phone Number</th>
                <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Email Address</th>
                <th className="border-b border-[#E8EBEE] px-4 py-3 font-medium">Date Added</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 text-primary-text">{userDetails.name}</td>
                <td className="px-4 py-4 text-zinc-500">{userDetails.role}</td>
                <td className="px-4 py-4 text-zinc-500">{userDetails.phoneNumber}</td>
                <td className="px-4 py-4 text-zinc-500">{userDetails.emailAddress}</td>
                <td className="px-4 py-4 text-zinc-500">{userDetails.dateAdded}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <ActivityGroup title="Today - 10th March, 2026" items={todayActivities} />
      <ActivityGroup title="Yesterday - 9th March, 2026" items={yesterdayActivities} />
    </div>
  );
}
