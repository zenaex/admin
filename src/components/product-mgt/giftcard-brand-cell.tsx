"use client";
// Displays the brand logo icon alongside its name and origin country

import Image from "next/image";

export type GiftcardBrandCellProps = {
  brandName: string;
  brandType: "E-code" | "Physical";
  country: string;
  currency?: string;
  cardType?: string;
  iconUrl?: string;
  size?: number;
};

function humanizeCardTypeSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function GiftcardBrandCell({
  brandName,
  brandType,
  country,
  currency,
  cardType,
  iconUrl,
  size = 32,
}: GiftcardBrandCellProps) {
  const src = iconUrl?.trim() || null;
  const typeLabel = cardType ? humanizeCardTypeSlug(cardType) : brandType;
  const label = `${brandName} | ${typeLabel}`;
  const locationLine = [country, currency].filter(Boolean).join(" · ");

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
          {brandName} | {typeLabel}
        </p>
        <p className="truncate text-xs text-zinc-500">{locationLine || country}</p>
      </div>
    </div>
  );
}
