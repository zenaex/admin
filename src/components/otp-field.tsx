"use client";

import { ChangeEvent, ClipboardEvent, KeyboardEvent, useRef } from "react";

type OtpFieldProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
};

export function OtpField({ length = 6, value, onChange }: OtpFieldProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const focusInput = (index: number) => {
    const input = inputRefs.current[index];
    if (input) input.focus();
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const nextChar = event.target.value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextChar;
    const nextValue = nextDigits.join("");
    onChange(nextValue);

    if (nextChar && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>, startIndex: number) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text");
    const cleanedDigits = pastedText.replace(/\D/g, "");
    if (!cleanedDigits) return;

    const nextDigits = [...digits];
    for (let i = 0; i < cleanedDigits.length && startIndex + i < length; i++) {
      nextDigits[startIndex + i] = cleanedDigits[i];
    }
    const nextValue = nextDigits.join("");
    onChange(nextValue);

    const targetIndex = Math.min(startIndex + cleanedDigits.length, length - 1);
    focusInput(targetIndex);
  };

  return (
    <div className="flex items-center justify-center gap-[16px]">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(event, index)}
          className="h-[56px] w-[56px] rounded-md border border-zinc-300 bg-white text-center text-sm text-primary-text outline-none focus:border-secondary-green"
        />
      ))}
    </div>
  );
}

