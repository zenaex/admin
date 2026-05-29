"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { Upload, Check, Search, ChevronDown } from "lucide-react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { InputField } from "@/components/input-field";
import { SuccessModal } from "@/components/provider/provider-modals";
import type { EtradeRequestRow } from "@/components/e-trades/etrade-types";
import { getAdminCustomersList } from "@/lib/admin-api/customers-api";

type EtradeLogFlowProps = {
  onBack: () => void;
  onSuccess: (newTrade: EtradeRequestRow) => void;
};

type CustomerOption = {
  name: string;
  username: string;
};

const CUSTOMER_OPTIONS: CustomerOption[] = [
  { name: "Adekunle Timothy", username: "kunletim" },
  { name: "Timothy Nasiru", username: "Timo" },
  { name: "Babangida Tunde", username: "Bangi" },
  { name: "Chiamaka Ngozi", username: "maxxxxxx" },
  { name: "Lala Jibola", username: "Oglala" },
  { name: "Mustapha Fetuga", username: "Musty100" },
  { name: "Okunola Roscoly", username: "badmanrosco1" },
];

const TRADE_TYPE_OPTIONS = ["Exchange Rate", "Giftcard", "Crypto"];

export function EtradeLogFlow({ onBack, onSuccess }: EtradeLogFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [tradeType, setTradeType] = useState(TRADE_TYPE_OPTIONS[0]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption>(CUSTOMER_OPTIONS[6]); // Default to Okunola Roscoly as in mockup
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const [requestType, setRequestType] = useState("Bank of America");
  const [tradeAmount, setTradeAmount] = useState("$100,000.00");
  const [vendorRate, setVendorRate] = useState("$1/₦1200");
  const [markupRate, setMarkupRate] = useState("₦50");

  // Calculated states
  const [customerRate, setCustomerRate] = useState("");
  const [amountEquivalent, setAmountEquivalent] = useState("");
  const [profitMarkup, setProfitMarkup] = useState("");

  // Upload image state
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Submit flow states
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [initialCustomers, setInitialCustomers] = useState<CustomerOption[]>(CUSTOMER_OPTIONS);
  const [customers, setCustomers] = useState<CustomerOption[]>(CUSTOMER_OPTIONS);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Handle click outside for customer dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCustomerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch initial list on mount
  useEffect(() => {
    let active = true;
    const fetchInitial = async () => {
      setLoadingCustomers(true);
      try {
        const res = await getAdminCustomersList({ page: 1, pageSize: 50 });
        if (active && res.items.length > 0) {
          const mapped = res.items.map((item) => ({
            name: item.name,
            username: item.username.startsWith("@") ? item.username.slice(1) : item.username,
          }));
          setInitialCustomers(mapped);
          setCustomers(mapped);

          const foundDefault = mapped.find((c) => c.name.toLowerCase().includes("okunola"));
          if (foundDefault) {
            setSelectedCustomer(foundDefault);
          } else if (mapped.length > 0) {
            setSelectedCustomer(mapped[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load customer list from API", err);
      } finally {
        if (active) setLoadingCustomers(false);
      }
    };
    void fetchInitial();
    return () => {
      active = false;
    };
  }, []);

  // Debounced search fetch
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomers(initialCustomers);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const res = await getAdminCustomersList({ search: customerSearch.trim(), page: 1, pageSize: 20 });
        if (active) {
          const mapped = res.items.map((item) => ({
            name: item.name,
            username: item.username.startsWith("@") ? item.username.slice(1) : item.username,
          }));
          setCustomers(mapped);
        }
      } catch (err) {
        console.error("Search API failed", err);
      } finally {
        if (active) setLoadingCustomers(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerSearch, initialCustomers]);

  // Run live calculations based on inputs
  useEffect(() => {
    // Parse tradeAmount: extract digits (allow decimals)
    const amountVal = parseFloat(tradeAmount.replace(/[^0-9.]/g, "")) || 0;

    // Parse vendorRate: extract last digits (after the slash, or general digits)
    const vendorRateVal = (() => {
      const parts = vendorRate.split("/");
      const ratePart = parts.length > 1 ? parts[1] : vendorRate;
      return parseFloat(ratePart.replace(/[^0-9.]/g, "")) || 0;
    })();

    // Parse markupRate: extract digits
    const markupVal = parseFloat(markupRate.replace(/[^0-9.]/g, "")) || 0;

    // Calculations
    const custRateVal = Math.max(0, vendorRateVal - markupVal);
    const equivalentVal = amountVal * custRateVal;
    const profitVal = amountVal * markupVal;

    // Set formatted values
    setCustomerRate(custRateVal > 0 ? `$1/₦${custRateVal}` : "$1/₦0");
    setAmountEquivalent(`₦${equivalentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setProfitMarkup(`₦${profitVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }, [tradeAmount, vendorRate, markupRate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageName(file.name);
      setImageFile(file);
    }
  };

  const handleContinue = (e: FormEvent) => {
    e.preventDefault();
    if (!requestType.trim() || !tradeAmount.trim() || !vendorRate.trim() || !markupRate.trim()) {
      return;
    }
    setStep(2);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    // Mock API call latency
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);

    // Map form to EtradeRequestRow schema
    const newTrade: EtradeRequestRow = {
      id: `etrade-req-logged-${Date.now()}`,
      title: requestType.trim(),
      subtitle: "Etrade • 9:32AM",
      status: "Pending", // Awaiting Approval
      etradeType: tradeType,
      tradeId: `Trade-WVA_S${Math.floor(100 + Math.random() * 900)}OOOPN`,
      customer: selectedCustomer.name,
      dateCreated: "Jan 6, 2026 | 9:32AM",
      tradeValue: tradeAmount,
      opsInCharge: "Tech Support",
    };

    onSuccess(newTrade);
    setShowSuccess(true);
  };

  return (
    <div className="w-full">
      {/* Top Bar / Header */}
      <div className="mb-6 flex items-center rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-primary-text hover:underline"
          >
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Etrades
          </button>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Log a Trade</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto mb-10 w-full max-w-sm relative flex items-center justify-between px-12">
        {/* Thin connector line */}
        <div className="absolute top-[13px] left-[62px] right-[67px] h-[1.5px] bg-[#E8EDF2] z-0" />
        
        {/* Step 1: Trade */}
        <div className="flex flex-col items-center z-10 select-none">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${
            step === 2 ? "bg-zinc-950" : "bg-[#E8EDF2]"
          }`}>
            {step === 2 ? (
              <Check className="w-3.5 h-3.5 text-[#C1FF00] stroke-[3]" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
            )}
          </div>
          <span className="mt-2 text-[12px] font-medium text-[#718096] min-w-[50px] text-center">
            Trade
          </span>
        </div>

        {/* Step 2: Confirm */}
        <div className="flex flex-col items-center z-10 select-none">
          <div className="w-7 h-7 flex items-center justify-center">
            {step === 2 ? (
              <div className="w-7 h-7 rounded-full bg-[#E8EDF2] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
              </div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-[#E8EDF2]" />
            )}
          </div>
          <span className={`mt-2 text-[12px] font-medium min-w-[50px] text-center ${
            step === 2 ? "text-[#718096]" : "text-[#A0AEC0]"
          }`}>
            Confirm
          </span>
        </div>
      </div>

      {/* Form Container */}
      <div className="mx-auto max-w-[620px] rounded-3xl border border-zinc-100 bg-white px-8 pb-10 pt-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {step === 1 ? (
          <form onSubmit={handleContinue} className="grid gap-4.5">
            <h2 className="text-center text-[19px] font-bold text-brand-navy mb-2">
              Log an E-Trade Transaction
            </h2>

            {/* Trade Type */}
            <div>
              <label htmlFor="log-trade-type" className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Trade Type
              </label>
              <div className="relative">
                <select
                  id="log-trade-type"
                  value={tradeType}
                  onChange={(e) => setTradeType(e.target.value)}
                  className="text-primary-text h-10 w-full appearance-none rounded-md border border-secondary-green/25 bg-white px-3 pr-10 text-sm outline-none focus:border-secondary-green"
                >
                  {TRADE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 5l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* Customer's Name (Searchable Custom Dropdown) */}
            <div className="relative" ref={customerDropdownRef}>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Customer's Name
              </label>
              
              {/* Dropdown Toggle Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCustomerOpen(!isCustomerOpen)}
                className="flex items-center justify-between text-primary-text h-10 w-full rounded-md border border-secondary-green/25 bg-white px-3 text-sm outline-none focus:border-secondary-green text-left shadow-sm transition-colors"
              >
                <span>{selectedCustomer.name}</span>
                <ChevronDown size={16} className="text-zinc-400 shrink-0" />
              </button>

              {/* Floating Dropdown Panel */}
              {isCustomerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-zinc-150 rounded-2xl shadow-xl p-3 grid gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Search Bar Input */}
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full h-10 px-3.5 pr-10 border border-[#E8EDF2] rounded-xl text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                      placeholder="Search"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      autoFocus
                    />
                    {loadingCustomers ? (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                    ) : (
                      <Search
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                    )}
                  </div>

                  {/* Customer Scroll List */}
                  <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-1">
                    {customers.length > 0 ? (
                      customers.map((c) => {
                        const initials = c.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);

                        return (
                          <button
                            key={c.username}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsCustomerOpen(false);
                              setCustomerSearch("");
                            }}
                            className="flex items-center gap-3 w-full px-2 py-2 hover:bg-zinc-50 rounded-xl cursor-pointer text-left transition-colors"
                          >
                            {/* Avatar Circle */}
                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-semibold text-zinc-500 shrink-0 select-none">
                              {initials}
                            </div>
                            {/* Metadata */}
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] font-semibold text-zinc-950 leading-tight truncate">
                                {c.name}
                              </span>
                              <span className="text-[11px] text-zinc-400 leading-tight truncate">
                                @{c.username}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs text-zinc-400 select-none">
                        No customers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Request Type */}
            <InputField
              id="log-request-type"
              label="Request Type"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              placeholder="e.g. Bank of America"
              required
            />

            {/* Trade Amount */}
            <InputField
              id="log-trade-amount"
              label="Trade Amount"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="$0.00"
              required
            />

            {/* Vendor's Rate */}
            <InputField
              id="log-vendor-rate"
              label="Vendor's Rate"
              value={vendorRate}
              onChange={(e) => setVendorRate(e.target.value)}
              placeholder="$1/₦0"
              required
            />

            {/* Our Markup Rate */}
            <InputField
              id="log-markup-rate"
              label="Our Markup Rate"
              value={markupRate}
              onChange={(e) => setMarkupRate(e.target.value)}
              placeholder="₦0"
              required
            />

            {/* Customer's rate (Calculated) */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
                Customer's rate
              </label>
              <input
                type="text"
                disabled
                className="h-10 w-full rounded-md border border-zinc-100 bg-zinc-50 px-3 text-sm outline-none text-zinc-400 cursor-not-allowed"
                value={customerRate}
              />
            </div>

            {/* Amount Equivalent (Calculated) */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
                Amount Equivalent
              </label>
              <input
                type="text"
                disabled
                className="h-10 w-full rounded-md border border-zinc-100 bg-zinc-50 px-3 text-sm outline-none text-zinc-400 cursor-not-allowed"
                value={amountEquivalent}
              />
            </div>

            {/* Our Profit Markup (Calculated) */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">
                Our Profit Markup
              </label>
              <input
                type="text"
                disabled
                className="h-10 w-full rounded-md border border-zinc-100 bg-zinc-50 px-3 text-sm outline-none text-zinc-400 cursor-not-allowed"
                value={profitMarkup}
              />
            </div>

            {/* Upload Image */}
            <div>
              <span className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Transaction Receipt (Image)
              </span>
              <label
                htmlFor="receipt-upload"
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-zinc-200 border-dashed rounded-xl bg-zinc-50/50 cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                  <p className="text-xs text-zinc-500 font-semibold">
                    {imageName ? imageName : "Upload Image"}
                  </p>
                </div>
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 shadow-sm"
            >
              Continue
            </button>
          </form>
        ) : (
          <div className="grid gap-5">
            <h2 className="text-center text-[19px] font-bold text-brand-navy">
              Confirm Transaction Details
            </h2>
            <p className="text-center text-xs text-zinc-400 -mt-2 mb-2">
              Please review your logged trade parameters below.
            </p>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 grid gap-3 text-sm text-zinc-600">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Trade Type</span>
                <span className="font-semibold text-primary-text">{tradeType}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Customer</span>
                <span className="font-semibold text-primary-text">{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Request Type</span>
                <span className="font-semibold text-primary-text">{requestType}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Trade Amount</span>
                <span className="font-semibold text-primary-text">{tradeAmount}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Vendor's Rate</span>
                <span className="font-semibold text-primary-text">{vendorRate}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Our Markup Rate</span>
                <span className="font-semibold text-primary-text">{markupRate}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Customer's Rate</span>
                <span className="font-semibold text-primary-text">{customerRate}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-400 font-medium">Amount Equivalent</span>
                <span className="font-semibold text-zinc-950 font-bold">{amountEquivalent}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-zinc-400 font-medium">Our Profit Markup</span>
                <span className="font-semibold text-green-600 font-bold">{profitMarkup}</span>
              </div>
              {imageName && (
                <div className="flex justify-between border-t border-zinc-100 pt-2 text-xs">
                  <span className="text-zinc-400">Attached Receipt</span>
                  <span className="font-medium truncate max-w-[200px] text-zinc-500">{imageName}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(1)}
                className="flex-1 rounded-full bg-outline py-3.5 text-sm font-semibold text-primary-text hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmSubmit}
                className="flex-1 rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Logging Trade…" : "Confirm & Log Trade"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showSuccess && (
        <SuccessModal
          message="E-Trade logged successfully!"
          confirmLabel="Done"
          onContinue={() => {
            setShowSuccess(false);
            onBack();
          }}
        />
      )}
    </div>
  );
}
