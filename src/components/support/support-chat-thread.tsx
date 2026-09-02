"use client";

import { useState } from "react";
import { Send2, Paperclip, Lock, MessageText1, DocumentDownload } from "iconsax-react";
import type { SupportTicket } from "./types";

interface SupportChatThreadProps {
  ticket: SupportTicket | null;
  onSendMessage: (ticketId: string, content: string, isInternalNote: boolean) => void;
}

export function SupportChatThread({
  ticket,
  onSendMessage,
}: SupportChatThreadProps) {
  const [inputText, setInputText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  if (!ticket) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400">
        <MessageText1 size="40" variant="Outline" color="currentColor" className="mb-2 opacity-30 text-zinc-400" />
        <h3 className="text-sm font-semibold text-primary-text">No Ticket Selected</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Select a ticket from the list to view conversation history.
        </p>
      </div>
    );
  }

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(ticket.id, inputText.trim(), isInternalNote);
    setInputText("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Thread Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 p-3.5 bg-white">
        <h3 className="text-sm font-semibold text-primary-text">{ticket.subject}</h3>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/50 no-scrollbar">
        {ticket.messages.map((m) => {
          if (m.senderType === "note") {
            // Internal Note
            return (
              <div
                key={m.id}
                className="mx-auto my-2 max-w-[92%] rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-amber-900"
              >
                <div className="flex items-center justify-between text-xs mb-1 font-semibold text-amber-800">
                  <div className="flex items-center gap-1.5">
                    <Lock size="13" variant="Outline" color="currentColor" />
                    <span>{m.senderName}</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-normal">{m.timestamp}</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-900/90">{m.content}</p>
              </div>
            );
          }

          const isAdmin = m.senderType === "admin";
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[82%] ${
                isAdmin ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1">
                <span className="font-semibold text-zinc-600">{m.senderName}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isAdmin
                    ? "bg-secondary-green text-white rounded-tr-none"
                    : "bg-white text-zinc-800 rounded-tl-none border border-zinc-200/80 shadow-2xs"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

                {/* Attachments */}
                {m.attachments && m.attachments.length > 0 ? (
                  <div className={`mt-2.5 space-y-1 border-t pt-2 ${isAdmin ? "border-white/20" : "border-zinc-100"}`}>
                    {m.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-md px-2 py-1 text-[11px] ${
                          isAdmin ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <DocumentDownload size="13" variant="Outline" color="currentColor" />
                          <span className="truncate">{att.name}</span>
                        </div>
                        <span className={`ml-2 font-mono text-[10px] ${isAdmin ? "text-zinc-300" : "text-zinc-400"}`}>
                          {att.size}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Input Box */}
      <div className="border-t border-zinc-100 bg-white p-3 space-y-2.5">
        {/* Toggle Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-md bg-zinc-100 p-0.5 border border-zinc-200/60">
            <button
              type="button"
              onClick={() => setIsInternalNote(false)}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                !isInternalNote
                  ? "bg-white text-primary-text shadow-2xs font-semibold"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Public Reply
            </button>
            <button
              type="button"
              onClick={() => setIsInternalNote(true)}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isInternalNote
                  ? "bg-amber-500 text-black font-semibold"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Lock size="11" variant="Outline" color="currentColor" />
              <span>Internal Note</span>
            </button>
          </div>
        </div>

        {/* Input Textarea & Send Button */}
        <div
          className={`flex flex-col rounded-lg border p-2.5 transition-colors ${
            isInternalNote
              ? "border-amber-300 bg-amber-50/40 focus-within:border-amber-500"
              : "border-secondary-green/25 bg-white focus-within:border-secondary-green"
          }`}
        >
          <textarea
            rows={2}
            placeholder={
              isInternalNote
                ? "Write an internal note (only visible to admins)..."
                : "Type your reply here..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSend();
              }
            }}
            className="w-full bg-transparent text-xs text-primary-text placeholder:text-zinc-400 outline-none resize-none"
          />

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Attach File"
            >
              <Paperclip size="16" variant="Outline" color="currentColor" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 hidden sm:inline">⌘+Enter</span>
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-opacity disabled:opacity-50 ${
                  isInternalNote
                    ? "bg-amber-500 text-black hover:opacity-90"
                    : "bg-primary-green text-primary-text hover:opacity-90"
                }`}
              >
                <span>{isInternalNote ? "Save Note" : "Send Reply"}</span>
                <Send2 size="13" variant="Bold" color="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
