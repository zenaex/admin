import type { HTMLAttributes } from "react";

const SIZE_CLASS = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

export type LoadingSpinnerSize = keyof typeof SIZE_CLASS;

export type LoadingSpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: LoadingSpinnerSize;
  /** Spinner track color (defaults to light gray). */
  trackClassName?: string;
  /** Spinner accent color (defaults to primary green). */
  accentClassName?: string;
};

export function LoadingSpinner({
  size = "md",
  trackClassName = "border-zinc-200",
  accentClassName = "border-t-primary-green",
  className = "",
  ...props
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block shrink-0 animate-spin rounded-full ${SIZE_CLASS[size]} ${trackClassName} ${accentClassName} ${className}`}
      {...props}
    />
  );
}
