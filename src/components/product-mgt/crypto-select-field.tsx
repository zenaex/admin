"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown2 } from "iconsax-react";
import { AuditTrailIconSearch } from "@/components/audit-trail/audit-trail-icon-search";
import type { CryptoOption } from "@/lib/product-mgt/crypto-options";
import { CRYPTO_OPTIONS } from "@/lib/product-mgt/crypto-options";
import { getCryptoIconUrl } from "@/lib/product-mgt/crypto-icons";

type CryptoSelectFieldProps = {
  label: string;
  value: CryptoOption | null;
  onChange: (option: CryptoOption) => void;
  excludeCode?: string | null;
  options?: CryptoOption[];
};

function CryptoOptionIcon({ code, size = 24 }: { code: string; size?: number }) {
  const src = getCryptoIconUrl(code);
  if (!src) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500"
        style={{ width: size, height: size }}
      >
        {code.charAt(0)}
      </span>
    );
  }
  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full bg-zinc-100"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={code} width={size} height={size} className="h-full w-full object-cover" unoptimized />
    </span>
  );
}

export function CryptoSelectField({
  label,
  value,
  onChange,
  excludeCode,
  options = CRYPTO_OPTIONS,
}: CryptoSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.filter((o) => {
      if (excludeCode && o.code === excludeCode) return false;
      if (!q) return true;
      return o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q);
    });
  }, [options, excludeCode, search]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-primary-text">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-left text-sm text-primary-text outline-none focus:border-zinc-400"
      >
        {value ? (
          <>
            <CryptoOptionIcon code={value.code} size={26} />
            <span className="min-w-0 flex-1 truncate font-medium">
              {value.name} | {value.code}
            </span>
          </>
        ) : (
          <span className="text-zinc-400">Select cryptocurrency</span>
        )}
        <ArrowDown2
          size={14}
          variant="Outline"
          color="currentColor"
          className={`ml-auto shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 p-2">
            <AuditTrailIconSearch
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-zinc-500">No results</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.code}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-subtle"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <CryptoOptionIcon code={opt.code} size={28} />
                    <div>
                      <p className="text-sm font-semibold text-primary-text">{opt.code}</p>
                      <p className="text-xs text-zinc-500">{opt.name}</p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
