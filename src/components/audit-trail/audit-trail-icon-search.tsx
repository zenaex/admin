import { InputHTMLAttributes } from "react";

import { SearchNormal1 } from "iconsax-react";

type AuditTrailIconSearchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  className?: string;
  wrapperClassName?: string;
  variant?: "header" | "toolbar";
};

const variantWrapper: Record<NonNullable<AuditTrailIconSearchProps["variant"]>, string> = {
  header: "bg-zinc-100",
  toolbar: "border border-zinc-200 bg-white",
};

const variantLayout: Record<NonNullable<AuditTrailIconSearchProps["variant"]>, string> = {
  header: "relative flex h-10 w-full min-w-0 items-center gap-2 rounded-lg px-3",
  toolbar:
    "relative flex h-9 w-full min-w-0 items-center gap-2 rounded-xl px-3 sm:px-3.5",
};

export function AuditTrailIconSearch({
  className = "",
  wrapperClassName = "",
  variant = "toolbar",
  ...props
}: AuditTrailIconSearchProps) {
  return (
    <div
      className={[
        variantLayout[variant],
        variantWrapper[variant],
        wrapperClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="inline-flex shrink-0 text-zinc-500">
        <SearchNormal1 size={18} variant="Outline" color="currentColor" />
      </span>
      <input
        type="search"
        className={[
          "text-primary-text min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </div>
  );
}
