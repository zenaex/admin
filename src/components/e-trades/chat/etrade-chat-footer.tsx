"use client";

import { useRef } from "react";
import { Document, Send2 } from "iconsax-react";

type EtradeChatFooterProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onEndTrade: () => void;
};

export function EtradeChatFooter({ value, onChange, onSend, onEndTrade }: EtradeChatFooterProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 border-t border-zinc-100 bg-background pt-4">
      <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden />
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-2 sm:px-4">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Continue the chat"
          className="min-w-0 flex-1 bg-transparent text-sm text-primary-text outline-none placeholder:text-zinc-400"
          aria-label="Message"
        />
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
            aria-label="Attach file"
          >
            <Document size={20} variant="Outline" color="currentColor" />
          </button>
          <button
            type="button"
            onClick={onSend}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
            aria-label="Send"
          >
            <Send2 size={20} variant="Outline" color="currentColor" />
          </button>
          <button
            type="button"
            onClick={onEndTrade}
            className="rounded-full bg-primary-text px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            End Trade
          </button>
        </div>
      </div>
    </div>
  );
}
