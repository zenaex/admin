"use client";

import { useState } from "react";
import { Copy } from "iconsax-react";

type WalletAddressCardProps = {
  cryptoLabel: string;
  address: string;
  rateLabel: string;
};

export function WalletAddressCard({ cryptoLabel, address, rateLabel }: WalletAddressCardProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-[95%] self-start rounded-2xl border border-zinc-100 bg-zinc-50 p-4 sm:max-w-[420px]">
      <div className="flex aspect-square max-h-48 w-full max-w-48 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-xs font-medium text-zinc-400">
        QR
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-primary-text">{cryptoLabel}</span>
        <span className="rounded-md bg-amber-yellow/30 px-2 py-0.5 text-[11px] font-medium text-zinc-800">
          {rateLabel}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate text-xs text-zinc-600">{address}</code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800"
          aria-label="Copy address"
        >
          <Copy size={18} variant="Outline" color="currentColor" />
        </button>
      </div>
      {copied ? <p className="mt-1 text-[11px] text-green-600">Copied</p> : null}
    </div>
  );
}
