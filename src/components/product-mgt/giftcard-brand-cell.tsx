"use client";

import Image from "next/image";
import { getGiftcardBrandIcon } from "@/components/product-mgt/exchange-rate-fixtures";

export type GiftcardBrandCellProps = {
  brandName: string;
  brandType: "E-code" | "Physical";
  country: string;
  iconUrl?: string;
  size?: number;
};

export function GiftcardBrandCell({
  brandName,
  brandType,
  country,
  iconUrl,
  size = 32,
}: GiftcardBrandCellProps) {
  const src = iconUrl ?? getGiftcardBrandIcon(brandName);
  const label = `${brandName} | ${brandType}`;

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
          {brandName.charAt(0) || "?"}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary-text">
          {brandName} | {brandType}
        </p>
        <p className="truncate text-xs text-zinc-500">{country}</p>
      </div>
    </div>
  );
}
