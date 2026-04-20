import { TickCircle } from "iconsax-react";

type MoneySentCardProps = {
  amount: string;
};

export function MoneySentCard({ amount }: MoneySentCardProps) {
  return (
    <div className="max-w-[95%] self-start rounded-2xl border border-zinc-100 bg-zinc-50 px-6 py-8 text-center sm:max-w-[360px]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <TickCircle size={40} variant="Bold" color="var(--color-success)" />
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-600">Money Sent</p>
      <p className="mt-1 text-2xl font-bold text-primary-text">{amount}</p>
    </div>
  );
}
