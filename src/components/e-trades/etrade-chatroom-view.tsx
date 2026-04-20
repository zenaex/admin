"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown2, Cpu } from "iconsax-react";

import { ChatDateDivider } from "@/components/e-trades/chat/chat-date-divider";
import { ChatLeftBubble, ChatRightBubble } from "@/components/e-trades/chat/chat-bubbles";
import { EtradeChatFooter } from "@/components/e-trades/chat/etrade-chat-footer";
import { EtradeTransactionReceiptModal } from "@/components/e-trades/chat/etrade-transaction-receipt-modal";
import { MoneySentCard } from "@/components/e-trades/chat/money-sent-card";
import { WalletAddressCard } from "@/components/e-trades/chat/wallet-address-card";
import {
  ETRADE_DEMO_CHAT,
  type EtradeChatItem,
  getEtradeChatTitle,
} from "@/components/e-trades/etrade-chat-messages";
import { SuccessModal } from "@/components/provider/provider-modals";

type EtradeChatroomViewProps = {
  requestId: string;
};

export function EtradeChatroomView({ requestId }: EtradeChatroomViewProps) {
  const router = useRouter();
  const title = getEtradeChatTitle(requestId);
  const [messages, setMessages] = useState<EtradeChatItem[]>(() => [...ETRADE_DEMO_CHAT]);
  const [draft, setDraft] = useState("");
  const [actionOpen, setActionOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(() => {
    const body = draft.trim();
    if (!body) return;
    const time = format(new Date(), "h:mma").toLowerCase();
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, kind: "text-right", body, time },
    ]);
    setDraft("");
  }, [draft]);

  const openReceipt = () => setReceiptOpen(true);
  const closeReceipt = () => setReceiptOpen(false);
  const finishFromReceipt = () => {
    setReceiptOpen(false);
    setSuccessOpen(true);
  };
  const goHome = () => {
    setSuccessOpen(false);
    router.push("/dashboard/e-trades");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 bg-background pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link href="/dashboard/e-trades" className="font-medium text-secondary-green hover:underline">
              Etrade
            </Link>
            <span aria-hidden className="text-zinc-400">
              /
            </span>
            <span className="text-primary-text">Chatroom</span>
          </nav>

          <div className="relative">
            <button
              type="button"
              onClick={() => setActionOpen((o) => !o)}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-primary-text transition-colors hover:bg-surface-subtle"
              aria-expanded={actionOpen}
            >
              Action
              <ArrowDown2 size={16} variant="Outline" color="currentColor" />
            </button>
            {actionOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActionOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="flex w-full px-4 py-2.5 text-left text-sm text-primary-text hover:bg-zinc-50"
                    onClick={() => setActionOpen(false)}
                  >
                    Export chat
                  </button>
                  <button
                    type="button"
                    className="flex w-full px-4 py-2.5 text-left text-sm text-primary-text hover:bg-zinc-50"
                    onClick={() => setActionOpen(false)}
                  >
                    Report issue
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-b border-zinc-100 pb-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <Cpu size={26} variant="Outline" color="currentColor" />
          </span>
          <h1 className="text-xl font-semibold text-primary-text">{title}</h1>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain py-4 pr-1 [-webkit-overflow-scrolling:touch]"
          tabIndex={0}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((item) => {
            if (item.kind === "date") {
              return <ChatDateDivider key={item.id} label={item.label} />;
            }
            if (item.kind === "text-left") {
              return (
                <div key={item.id} className="flex w-full justify-start">
                  <ChatLeftBubble sender={item.sender} body={item.body} />
                </div>
              );
            }
            if (item.kind === "text-right") {
              return (
                <div key={item.id} className="flex w-full justify-end">
                  <ChatRightBubble body={item.body} time={item.time} />
                </div>
              );
            }
            if (item.kind === "wallet") {
              return (
                <div key={item.id} className="flex w-full justify-start">
                  <WalletAddressCard
                    cryptoLabel={item.cryptoLabel}
                    address={item.address}
                    rateLabel={item.rateLabel}
                  />
                </div>
              );
            }
            if (item.kind === "money-sent") {
              return (
                <div key={item.id} className="flex w-full justify-start">
                  <MoneySentCard amount={item.amount} />
                </div>
              );
            }
            return null;
          })}
        </div>

        <EtradeChatFooter
          value={draft}
          onChange={setDraft}
          onSend={sendMessage}
          onEndTrade={openReceipt}
        />
      </div>

      <EtradeTransactionReceiptModal
        open={receiptOpen}
        onClose={closeReceipt}
        onEndTrade={finishFromReceipt}
      />

      {successOpen ? (
        <SuccessModal
          message="Etrade Transaction Success"
          confirmLabel="Go Back Home"
          onContinue={goHome}
        />
      ) : null}
    </div>
  );
}
