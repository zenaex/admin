"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Upload, Check } from "lucide-react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { InputField } from "@/components/input-field";
import { SuccessModal } from "@/components/provider/provider-modals";
import type { EtradeRequestRow } from "@/components/e-trades/etrade-types";

type EtradeLogFlowProps = {
  onBack: () => void;
  onSuccess: (newTrade: EtradeRequestRow) => void;
};

const CUSTOMER_OPTIONS = [
  { label: "Okunola Roscoly | @badmanrosco1", name: "Okunola Roscoly" },
  { label: "Nsomi Salisu | @nsomi_salisu", name: "Nsomi Salisu" },
  { label: "Job Awolowo | @job_awo", name: "Job Awolowo" },
  { label: "Martha Kalio | @martha_k", name: "Martha Kalio" },
  { label: "Victoria Salisu | @victoria_s", name: "Victoria Salisu" },
];

const TRADE_TYPE_OPTIONS = ["Exchange Rate", "Giftcard", "Crypto"];

export function EtradeLogFlow({ onBack, onSuccess }: EtradeLogFlowProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [tradeType, setTradeType] = useState(TRADE_TYPE_OPTIONS[0]);
  const [customerRaw, setCustomerRaw] = useState(CUSTOMER_OPTIONS[0].label);
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
    const selectedCustomer = CUSTOMER_OPTIONS.find((c) => c.label === customerRaw) || CUSTOMER_OPTIONS[0];
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
        <div className="absolute top-[13px] left-[62px] right-[62px] h-[1.5px] bg-[#E8EDF2] z-0" />
        
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

            {/* Customer's Name */}
            <div>
              <label htmlFor="log-customer" className="mb-1.5 block text-[11px] font-medium text-gray-500">
                Customer's Name
              </label>
              <div className="relative">
                <select
                  id="log-customer"
                  value={customerRaw}
                  onChange={(e) => setCustomerRaw(e.target.value)}
                  className="text-primary-text h-10 w-full appearance-none rounded-md border border-secondary-green/25 bg-white px-3 pr-10 text-sm outline-none focus:border-secondary-green"
                >
                  {CUSTOMER_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.label}>
                      {opt.label}
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
                <span className="font-semibold text-primary-text">{customerRaw}</span>
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
