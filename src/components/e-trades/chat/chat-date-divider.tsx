type ChatDateDividerProps = {
  label: string;
};

export function ChatDateDivider({ label }: ChatDateDividerProps) {
  return (
    <div className="flex justify-center py-4">
      <span className="rounded-full bg-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600">
        {label}
      </span>
    </div>
  );
}
