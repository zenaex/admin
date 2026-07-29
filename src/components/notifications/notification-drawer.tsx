"use client";

import Image from "next/image";
import { CloseCircle, Notification } from "iconsax-react";
import { useEffect, useState } from "react";
import {
  getAdminNotifications,
  postMarkNotificationsRead,
  type AdminNotificationItem,
} from "@/lib/admin-api/notifications-api";

export function NotificationDrawerTrigger({
  notificationCount,
  iconSize = 22,
}: {
  notificationCount?: number;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const liveItems = await getAdminNotifications();
        if (active) {
          setItems(liveItems);
          setFetched(true);
        }
      } catch (e) {
        console.error("Failed to load live notifications:", e);
        if (active) {
          setItems([]);
          setFetched(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (open || !fetched) {
      void fetchNotifications();
    }

    return () => {
      active = false;
    };
  }, [open, fetched]);

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await postMarkNotificationsRead([]); // Empty array = mark all read per backend spec
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await postMarkNotificationsRead([id]);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (e) {
      console.error(`Failed to mark notification ${id} as read:`, e);
    }
  };

  const unreadItems = items.filter((item) => !item.read);
  const displayCount = notificationCount ?? (fetched ? unreadItems.length : 0);

  return (
    <>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-outline hover:text-zinc-600"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
      >
        <Notification size={iconSize} variant="Outline" color="currentColor" />
        {displayCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-semibold text-white">
            {displayCount}
          </span>
        ) : null}
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
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  disabled={markingRead}
                  className="text-xs text-primary-text font-medium hover:underline disabled:opacity-50"
                >
                  {markingRead ? "Marking..." : "Mark all read"}
                </button>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto px-4 py-4 flex-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-zinc-400">Loading notifications...</div>
              ) : items.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">No notifications available</div>
              ) : (
                items.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => {
                      if (!item.read) void handleMarkSingleRead(item.id);
                    }}
                    className={`flex gap-2.5 ${
                      item.read ? "opacity-60" : "cursor-pointer transition-opacity hover:opacity-80"
                    }`}
                  >
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
                        {item.timeMeta ? (
                          <>
                            <span className="font-normal text-zinc-500"> | </span>
                            <span className="font-normal text-zinc-500">{item.timeMeta}</span>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-zinc-600">{item.subtitle}</p>
                      <p className="mt-1 text-[11px] text-zinc-400">{item.ago}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
