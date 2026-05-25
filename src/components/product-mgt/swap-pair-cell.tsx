"use client";

import Image from "next/image";
import type { SwapPairMeta } from "@/components/product-mgt/product-mgt-types";
import { getCryptoIconUrl } from "@/lib/product-mgt/crypto-icons";

const SWAP_SYMBOL = "⇆";

type SwapPairCellProps = {
  pair: SwapPairMeta;
  pairLabel?: string;
  pairSubtitle?: string;
  iconSize?: number;
};

function PairIcon({ code, size }: { code: string; size: number }) {
  const src = getCryptoIconUrl(code);
  const label = code;

  if (!src) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[10px] font-semibold text-zinc-500"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {code.charAt(0)}
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full border-2 border-white bg-zinc-100"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={src}
        alt={label}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        unoptimized
      />
    </span>
  );
}

export function SwapPairCell({
  pair,
  pairLabel,
  pairSubtitle,
  iconSize = 28,
}: SwapPairCellProps) {
  const label =
    pairLabel ?? `${pair.baseCode} ${SWAP_SYMBOL} ${pair.quoteCode}`;
  const subtitle =
    pairSubtitle ?? `${pair.baseName} & ${pair.quoteName}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex shrink-0 items-center" style={{ width: iconSize + iconSize * 0.45 }}>
        <PairIcon code={pair.baseCode} size={iconSize} />
        <span className="-ml-3">
          <PairIcon code={pair.quoteCode} size={iconSize} />
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary-text">{label}</p>
        <p className="truncate text-xs text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

export { SWAP_SYMBOL };
