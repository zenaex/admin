import type { HTMLAttributes } from "react";

import { LoadingSpinner, type LoadingSpinnerSize } from "@/components/ui/loading-spinner";

export type DataLoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  spinnerSize?: LoadingSpinnerSize;
};

/** Shared inline loading row — use for tabs, panels, and other async content. */
export function DataLoadingState({
  label = "Loading…",
  spinnerSize = "sm",
  className = "",
  ...props
}: DataLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-6 inline-flex items-center gap-2 text-sm text-zinc-500 ${className}`}
      {...props}
    >
      <LoadingSpinner size={spinnerSize} />
      <span>{label}</span>
    </div>
  );
}
