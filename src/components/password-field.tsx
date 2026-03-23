"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "iconsax-react";

import { InputField } from "@/components/input-field";

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function PasswordField({
  id,
  label,
  placeholder = "Password",
  value,
  onChange,
  error,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputField
      id={id}
      label={label}
      type={showPassword ? "text" : "password"}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      endAdornment={
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center text-zinc-400"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeSlash size="16" color="currentColor" variant="Outline" />
          ) : (
            <Eye size="16" color="currentColor" variant="Outline" />
          )}
        </button>
      }
    />
  );
}
