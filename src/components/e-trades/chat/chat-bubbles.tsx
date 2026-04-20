"use client";

import { CheckCheck } from "lucide-react";
import { Cpu } from "iconsax-react";

type ChatLeftBubbleProps = {
  body: string;
  sender: "chatbot" | "agent";
};

export function ChatLeftBubble({ body, sender }: ChatLeftBubbleProps) {
  const label = sender === "chatbot" ? "Chatbot" : "Agent";
  return (
    <div className="flex max-w-[90%] flex-col gap-1.5 sm:max-w-[75%]">
      <div className="rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-sm text-primary-text">
        {body}
      </div>
      <div className="flex items-center gap-1.5 pl-1 text-[11px] text-zinc-500">
        <Cpu size={14} variant="Outline" color="currentColor" />
        <span>{label}</span>
      </div>
    </div>
  );
}

type ChatRightBubbleProps = {
  body: string;
  time: string;
};

export function ChatRightBubble({ body, time }: ChatRightBubbleProps) {
  return (
    <div className="flex max-w-[90%] flex-col items-end gap-1.5 sm:max-w-[75%]">
      <div className="rounded-2xl rounded-br-md bg-zinc-200 px-4 py-3 text-sm text-primary-text">
        {body}
      </div>
      <div className="flex items-center gap-1 pr-1 text-[11px] text-zinc-500">
        <span>{time}</span>
        <CheckCheck size={14} strokeWidth={2} className="shrink-0 text-secondary-green" aria-hidden />
      </div>
    </div>
  );
}
