"use client";

import { useState } from "react";
import {
  CloseCircle,
  Send2,
  Paperclip,
  SearchNormal1,
  Headphone,
  ShieldSecurity,
} from "iconsax-react";
import ZohoSalesIQ from "@/components/zoho/ZohoSalesIQ";

type WidgetTab = "chat" | "faq" | "status";

interface ChatMsg {
  id: string;
  sender: "user" | "support";
  text: string;
  time: string;
}

const FAQ_ITEMS = [
  {
    q: "How do I process a manual rate override?",
    a: "Navigate to Product & Rate Mgt > Exchange Rates, select the rate pair, click Edit Rate, update the margin percentage, and save changes.",
  },
  {
    q: "Why is a giftcard trade stuck in 'Under Review'?",
    a: "Trades stay under review when the provider API takes longer than 180s to return card balance confirmation. Check Provider Mgt status panel.",
  },
  {
    q: "How to suspend a user account for compliance check?",
    a: "Go to Customer Mgt > Customers, search for the user ID, click the actions dropdown and select 'Flag Account' or 'Suspend'.",
  },
  {
    q: "Where can I view administrative system audit logs?",
    a: "Go to Audit Trail in the main sidebar menu to filter logs by admin role, action type, IP address, and date range.",
  },
];

export function SupportFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WidgetTab>("chat");
  const [inputMessage, setInputMessage] = useState("");
  const [faqSearch, setFaqSearch] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "w-1",
      sender: "support",
      text: "👋 Welcome to Zenaex Admin Live Support! How can we assist you with system operations today?",
      time: "Just now",
    },
  ]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMsg: ChatMsg = {
      id: `w-${Date.now()}`,
      sender: "user",
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = inputMessage.trim();
    setInputMessage("");

    // Automated response after 800ms
    setTimeout(() => {
      let botText =
        "Thank you for contacting admin support! A senior platform engineer has been notified and will respond shortly.";
      if (currentQuery.toLowerCase().includes("rate") || currentQuery.toLowerCase().includes("fiat")) {
        botText =
          "Regarding rate management: You can check real-time provider FX feeds under Product & Rate Mgt > Exchange Rates.";
      } else if (currentQuery.toLowerCase().includes("trade") || currentQuery.toLowerCase().includes("card")) {
        botText =
          "For card trade issues: Check the E-trades section or review provider health in Provider Mgt.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `w-${Date.now() + 1}`,
          sender: "support",
          text: botText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 800);
  };

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <>
      {/* Include Zoho SalesIQ Script Integration when configured */}
      <ZohoSalesIQ />

      {/* Backdrop Overlay with Background Blur & Click-to-Close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-all duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Trigger Button & Popover Card */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex h-12 w-12 hover:w-36 items-center justify-start overflow-hidden rounded-full bg-secondary-green p-3 text-white shadow-xl ring-2 ring-primary-green/40 transition-all duration-300 ease-in-out hover:bg-dark-green hover:shadow-2xl"
            aria-label="Open Admin Support Widget"
          >
            <div className="relative flex shrink-0 items-center justify-center">
              <Headphone size="22" color="currentColor" variant="Bold" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-green" />
              </span>
            </div>
            <span className="ml-2.5 whitespace-nowrap text-sm font-semibold tracking-wide text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Support
            </span>
          </button>
        ) : (
          /* Expanded Floating Widget Card */
          <div className="flex h-[530px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all duration-200">
            {/* Dark Green Header */}
            <div className="flex items-center justify-between bg-secondary-green px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary-green text-secondary-green shadow-md font-bold">
                  <Headphone size="20" color="currentColor" variant="Bold" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-secondary-green" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Admin Desk Support</h3>
                  <div className="flex items-center gap-1.5 text-xs text-sidebar-label">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-green" />
                    <span>Engineers Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close Support Widget"
              >
                <CloseCircle size="22" color="currentColor" variant="Bold" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-200 bg-zinc-50 px-3 py-1.5">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "chat"
                    ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Instant Chat
              </button>
              <button
                onClick={() => setActiveTab("faq")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "faq"
                    ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Knowledge Base
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "status"
                    ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                System Status
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-zinc-50/50 p-4 no-scrollbar">
              {activeTab === "chat" && (
                <div className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[85%] ${
                        m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          m.sender === "user"
                            ? "bg-secondary-green text-white rounded-br-none shadow-sm"
                            : "bg-white text-zinc-800 rounded-bl-none border border-zinc-200 shadow-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="mt-1 text-[10px] text-zinc-400">{m.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "faq" && (
                <div className="space-y-3">
                  <div className="relative">
                    <SearchNormal1
                      size="16"
                      color="currentColor"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="text"
                      placeholder="Search admin guides & FAQs..."
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-primary-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 mt-3">
                    {filteredFaqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs"
                      >
                        <h4 className="text-xs font-semibold text-zinc-900">{faq.q}</h4>
                        <p className="mt-1.5 text-[11px] leading-normal text-zinc-500">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "status" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-800">
                    <div className="flex items-center gap-2">
                      <ShieldSecurity size="18" color="currentColor" variant="Bold" className="text-emerald-600" />
                      <span className="text-xs font-bold">All Systems Operational</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      99.98% Uptime
                    </span>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2.5 text-xs shadow-xs">
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>API Core Switch</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>Giftcard Provider Gateways</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>TRC20 / ERC20 Blockchain Indexer</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-700">
                      <span>NIBSS Instant Payout Bridge</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            {activeTab === "chat" && (
              <div className="border-t border-zinc-200 bg-white p-3">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 focus-within:border-primary-green focus-within:bg-white">
                  <button
                    type="button"
                    className="text-zinc-400 hover:text-zinc-700 transition-colors"
                    title="Attach file"
                  >
                    <Paperclip size="18" color="currentColor" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    className="w-full bg-transparent text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary-green text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Send2 size="14" color="currentColor" variant="Bold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
