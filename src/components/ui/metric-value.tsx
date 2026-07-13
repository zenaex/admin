import type { ReactNode } from "react";

import { LoadingSpinner, type LoadingSpinnerSize } from "@/components/ui/loading-spinner";

export type MetricValueProps = {
  loading?: boolean;
  value: ReactNode;
  spinnerSize?: LoadingSpinnerSize;
  className?: string;
};

/** Inline metric text with a shared loading spinner — use in stat cards, hero metrics, etc. */
export function MetricValue({
  loading = false,
  value,
  spinnerSize = "md",
  className = "",
}: MetricValueProps) {
  if (loading) {
    return (
      <span className={`inline-flex min-h-[1em] items-center ${className}`}>
        <LoadingSpinner size={spinnerSize} />
      </span>
    );
  }

  return <span className={className}>{value}</span>;
}
