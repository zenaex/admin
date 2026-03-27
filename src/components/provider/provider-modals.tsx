"use client";

import { TickCircle } from "iconsax-react";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white px-6 pb-8 pt-4 shadow-xl mx-4">
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-zinc-200" />

        {/* Warning icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-red-600">
            <span className="text-[22px] font-bold leading-none text-red-600">!</span>
          </div>
        </div>

        {/* Text */}
        <h2 className="mb-2 text-center text-[20px] font-bold text-primary-text">{title}</h2>
        <p className="mb-7 text-center text-sm text-zinc-400">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full bg-zinc-100 py-3.5 text-sm font-semibold text-primary-text transition-colors hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type SuccessModalProps = {
  message: string;
  onContinue: () => void;
};

export function SuccessModal({ message, onContinue }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onContinue} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white px-6 pb-8 pt-4 shadow-xl mx-4">
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-zinc-200" />

        {/* Success icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
          <TickCircle size={56} variant="Outline" color="#013220" />
        </div>

        {/* Text */}
        <h2 className="mb-2 text-center text-[20px] font-bold text-primary-text">Successful</h2>
        <p className="mb-7 text-center text-sm text-zinc-400">{message}</p>

        {/* Button */}
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
