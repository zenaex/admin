import { CountryFlag } from "@/components/ui/country-flag";
import { resolveCountryCode } from "@/lib/country/resolve-country-code";

export type CurrencyCellProps = {
  currencyCode: string;
  currencyName: string;
  countryCode?: string | null;
};

export function CurrencyCell({ currencyCode, currencyName, countryCode }: CurrencyCellProps) {
  const iso = countryCode ?? resolveCountryCode(currencyCode, currencyName);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <CountryFlag code={iso} size={22} title={`${currencyCode} ${currencyName}`} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary-text">{currencyCode}</p>
        <p className="truncate text-xs text-zinc-500">{currencyName}</p>
      </div>
    </div>
  );
}
