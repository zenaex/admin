"use client";

import Image from "next/image";
import { getCryptoIconUrl } from "@/lib/product-mgt/crypto-icons";

export type CryptoCurrencyCellProps = {
  currencyCode: string;
  currencyName: string;
  iconUrl?: string | null;
  size?: number;
};

export function CryptoCurrencyCell({
  currencyCode,
  currencyName,
  iconUrl,
  size = 28,
}: CryptoCurrencyCellProps) {
  const src = iconUrl ?? getCryptoIconUrl(currencyCode);
  const label = `${currencyCode} ${currencyName}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      {src ? (
        <span
          className="relative inline-flex shrink-0 overflow-hidden rounded-full bg-zinc-100"
          style={{ width: size, height: size }}
          title={label}
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
      ) : (
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500"
          style={{ width: size, height: size }}
          title={label}
          aria-label={label}
        >
          {currencyCode.charAt(0) || "?"}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary-text">{currencyCode}</p>
        <p className="truncate text-xs text-zinc-500">{currencyName}</p>
      </div>
    </div>
  );
}
