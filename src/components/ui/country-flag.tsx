import type { ComponentType, CSSProperties } from "react";
import GB from "country-flag-icons/react/3x2/GB";
import GH from "country-flag-icons/react/3x2/GH";
import KE from "country-flag-icons/react/3x2/KE";
import NG from "country-flag-icons/react/3x2/NG";
import SN from "country-flag-icons/react/3x2/SN";
import US from "country-flag-icons/react/3x2/US";
import ZA from "country-flag-icons/react/3x2/ZA";
import { Globe } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FLAG_BY_ISO: Record<string, ComponentType<any>> = {
  US,
  GB,
  GH,
  KE,
  ZA,
  SN,
  NG,
};

export type CountryFlagProps = {
  code: string | null | undefined;
  size?: number;
  className?: string;
  title?: string;
  /** round = circle crop (default for product UI); rect = 3:2 */
  shape?: "round" | "rect";
};

export function CountryFlag({
  code,
  size = 24,
  className = "",
  title,
  shape = "round",
}: CountryFlagProps) {
  const iso = code?.trim().toUpperCase() ?? "";
  const Flag = iso ? FLAG_BY_ISO[iso] : undefined;
  const label = title ?? (iso || "Unknown region");

  const roundStyle: CSSProperties = { width: size, height: size };
  const rectStyle: CSSProperties = { width: size * 1.33, height: size };

  if (!Flag) {
    const boxStyle = shape === "round" ? roundStyle : rectStyle;
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-zinc-100 text-zinc-400 ${
          shape === "round" ? "rounded-full" : "rounded-sm"
        } ${className}`}
        style={boxStyle}
        title={label}
        aria-label={label}
      >
        <Globe size={Math.max(12, size * 0.55)} strokeWidth={1.5} />
      </span>
    );
  }

  if (shape === "rect") {
    return (
      <span
        className={`inline-flex shrink-0 overflow-hidden rounded-sm ${className}`}
        title={label}
        aria-label={label}
      >
        <Flag className="h-full w-full" style={rectStyle} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full ${className}`}
      style={roundStyle}
      title={label}
      aria-label={label}
    >
      <Flag className="h-full w-full object-cover" style={{ width: size, height: size }} />
    </span>
  );
}
