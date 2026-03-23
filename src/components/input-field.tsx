import { InputHTMLAttributes, ReactNode } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
};

export function InputField({
  id,
  label,
  error,
  endAdornment,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-medium text-gray-500"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={[
            "text-primary-text h-10 w-full rounded-md border border-secondary-green/25 bg-white px-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-secondary-green",
            endAdornment ? "pr-12" : "",
            error ? "border-red-600 focus:border-red-600" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {endAdornment ? (
          <div className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center text-zinc-400">
            {endAdornment}
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
