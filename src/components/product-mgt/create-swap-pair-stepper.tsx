"use client";

type CreateSwapPairStep = "amount" | "confirm";

type CreateSwapPairStepperProps = {
  step: CreateSwapPairStep;
};

export function CreateSwapPairStepper({ step }: CreateSwapPairStepperProps) {
  const steps: { id: CreateSwapPairStep; label: string }[] = [
    { id: "amount", label: "Amount" },
    { id: "confirm", label: "Confirm" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 px-4">
      {steps.map((s, index) => {
        const isActive = step === s.id;
        const isPast = step === "confirm" && s.id === "amount";
        const filled = isActive || isPast;

        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  filled ? "bg-primary-text" : "bg-zinc-300",
                ].join(" ")}
                aria-hidden
              />
              <span
                className={[
                  "text-xs font-medium",
                  filled ? "text-primary-text" : "text-zinc-400",
                ].join(" ")}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div className="mx-6 mb-5 h-px w-24 bg-zinc-200 sm:w-32" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
