"use client";

import Image from "next/image";
import { CloseCircle, Notification, Setting2 } from "iconsax-react";
import { useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  subtitle: string;
  timeMeta: string;
  ago: string;
};

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Customer Status Alert",
    subtitle: "Chiroma Ikechukwu's account has been marked as Inactive",
    timeMeta: "1:30 am, 21 Feb",
    ago: "1m ago",
  },
  {
    id: "n2",
    title: "Bulk Status Change",
    subtitle: "5 accounts moved to 'Blocked' status",
    timeMeta: "1:30 am, 21 Feb",
    ago: "1m ago",
  },
  {
    id: "n3",
    title: "Customer Milestone",
    subtitle: "Total customers reached ₦150,000!",
    timeMeta: "1:30 am, 21 Feb",
    ago: "1m ago",
  },
  {
    id: "n4",
    title: "Reactivation",
    subtitle: "Timothy Nasiru's account has been reactivated",
    timeMeta: "1:30 am, 21 Feb",
    ago: "1m ago",
  },
];

export function NotificationDrawerTrigger({
  notificationCount = 3,
  iconSize = 22,
}: {
  notificationCount?: number;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-outline hover:text-zinc-600"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
      >
        <Notification size={iconSize} variant="Outline" color="currentColor" />
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-semibold text-white">
          {notificationCount}
        </span>
      </button>

      <div
        className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/15 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
          aria-label="Close notifications"
        />
        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-[360px] border-l border-zinc-200 bg-[#F4F5F7] shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-zinc-400 transition-colors hover:text-zinc-600"
                >
                  <CloseCircle size={18} variant="Bold" color="currentColor" />
                </button>
                <h2 className="text-lg font-semibold text-primary-text">Notifications</h2>
              </div>
              <button type="button" aria-label="Notification settings" className="text-zinc-500">
                <Setting2 size={16} variant="Outline" color="currentColor" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4">
              {SAMPLE_NOTIFICATIONS.map((item) => (
                <article key={item.id} className="flex gap-2.5">
                  <Image
                    src="/logo/Logo-small.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="mt-0.5 h-6 w-6 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-black">
                      {item.title}
                      <span className="font-normal text-zinc-500"> | </span>
                      <span className="font-normal text-zinc-500">{item.timeMeta}</span>
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-zinc-600">{item.subtitle}</p>
                    <p className="mt-1 text-[11px] text-zinc-400">{item.ago}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

