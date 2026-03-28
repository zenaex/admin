"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Edit2, Eye, TickCircle } from "iconsax-react";
import { CommunicationRichEditor } from "@/components/communication/communication-rich-editor";

const periodOptions = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"];
const targetAudienceOptions = [
  "Transaction level",
  "Last transaction type",
  "Activity status",
  "User type",
  "App version",
  "Onboarding date",
];
const campaignCategoryOptions = ["Transactional", "Educational", "Announcement", "Promo"];
const communicationCategoryOptions = ["In-app", "Pop up"];

type ScheduleMode = "Immediate" | "Scheduled" | "Recurring";

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-zinc-200 bg-white px-3 pr-8 text-sm text-primary-text outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </span>
      </div>
    </div>
  );
}

export function CommunicationDetailsView() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("Recurring");
  const [title, setTitle] = useState("🎁 Your Summer Savings Bonus Awaits!");
  const [description, setDescription] = useState("Get 10% extra when you save with Bobble this summer");
  const [period, setPeriod] = useState("Daily");
  const [targetAudience, setTargetAudience] = useState("Transaction level");
  const [targetSubCategory, setTargetSubCategory] = useState("Tech support");
  const [campaignCategory, setCampaignCategory] = useState("Transactional");
  const [campaignSubCategory, setCampaignSubCategory] = useState("Vouchers offers");
  const [communicationCategory, setCommunicationCategory] = useState("In-app");
  const [editorHtml, setEditorHtml] = useState("<p>Write campaign content...</p>");
  const [isNotificationOpen, setIsNotificationOpen] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(
    () => () => {
      if (uploadedImage && uploadedImage.startsWith("blob:")) URL.revokeObjectURL(uploadedImage);
    },
    [uploadedImage],
  );

  const updateImageFromFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const next = URL.createObjectURL(file);
    setUploadedImage((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return next;
    });
  };

  const onFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    updateImageFromFile(e.target.files?.[0] ?? null);
  };

  const onDropImage = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    updateImageFromFile(e.dataTransfer.files?.[0] ?? null);
  };

  const scheduleButtonClass = useMemo(
    () => ({
      Immediate:
        scheduleMode === "Immediate"
          ? "bg-primary-green text-primary-text"
          : "bg-[#E8EBEE] text-zinc-600 hover:bg-zinc-200",
      Scheduled:
        scheduleMode === "Scheduled"
          ? "bg-primary-green text-primary-text"
          : "bg-[#E8EBEE] text-zinc-600 hover:bg-zinc-200",
      Recurring:
        scheduleMode === "Recurring"
          ? "bg-primary-green text-primary-text"
          : "bg-[#E8EBEE] text-zinc-600 hover:bg-zinc-200",
    }),
    [scheduleMode],
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-[#E8EBEE] bg-white px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/communication" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Communication
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Communication Details</span>
        </div>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-[#F7F7F7] px-3 text-xs font-semibold text-primary-text"
        >
          Action
          <ArrowDown2 size={12} variant="Outline" color="currentColor" />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <section className="rounded-xl border border-[#E8EBEE] bg-white p-3">
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
            >
              <h2 className="text-sm font-semibold text-primary-text">Notification</h2>
              <span
                className={`inline-flex text-zinc-500 transition-transform ${
                  isNotificationOpen ? "" : "-rotate-90"
                }`}
              >
                <ArrowDown2 size={12} variant="Outline" color="currentColor" />
              </span>
            </button>

            {isNotificationOpen ? <div className="space-y-2.5">
              <SelectField
                label="Category"
                value={communicationCategory}
                options={communicationCategoryOptions}
                onChange={setCommunicationCategory}
              />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm text-primary-text outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm text-primary-text outline-none"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFilePick}
                className="hidden"
              />
              {uploadedImage ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-28 w-full overflow-hidden rounded-lg border border-zinc-200"
                >
                  <img src={uploadedImage} alt="Notification preview" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 bg-black/25" />
                  <span className="absolute inset-0 inline-flex items-center justify-center gap-1 text-xs font-semibold text-white">
                    <Edit2 size={12} variant="Outline" color="currentColor" />
                    Replace image
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={onDropImage}
                  className={`flex h-28 w-full flex-col items-center justify-center rounded-lg border border-dashed text-center text-xs text-zinc-500 transition-colors ${
                    isDragOver ? "border-primary-green bg-primary-green/5" : "border-zinc-200"
                  }`}
                >
                  Click to upload notification image or drag and drop
                  <span className="mt-1 text-[10px]">SVG, PNG, JPG (max 2MB)</span>
                </button>
              )}
            </div> : null}
          </section>

          <section className="rounded-xl border border-[#E8EBEE] bg-white p-3">
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
            >
              <h2 className="text-sm font-semibold text-primary-text">Category and Target</h2>
              <span
                className={`inline-flex text-zinc-500 transition-transform ${
                  isCategoryOpen ? "" : "-rotate-90"
                }`}
              >
                <ArrowDown2 size={12} variant="Outline" color="currentColor" />
              </span>
            </button>
            {isCategoryOpen ? <div className="grid grid-cols-2 gap-2.5">
              <SelectField
                label="Category"
                value={campaignCategory}
                options={campaignCategoryOptions}
                onChange={setCampaignCategory}
              />
              <SelectField
                label="Sub-category"
                value={campaignSubCategory}
                options={["Vouchers offers", "Cashback", "Savings", "Bonus"]}
                onChange={setCampaignSubCategory}
              />
              <SelectField
                label="Target Audience"
                value={targetAudience}
                options={targetAudienceOptions}
                onChange={setTargetAudience}
              />
              <SelectField
                label="Sub-category"
                value={targetSubCategory}
                options={["Tech support", "Customer", "Admin", "General"]}
                onChange={setTargetSubCategory}
              />
            </div> : null}
          </section>

          <section className="rounded-xl border border-[#E8EBEE] bg-white p-3">
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between"
              onClick={() => setIsScheduleOpen((prev) => !prev)}
            >
              <h2 className="text-sm font-semibold text-primary-text">Schedule</h2>
              <span
                className={`inline-flex text-zinc-500 transition-transform ${
                  isScheduleOpen ? "" : "-rotate-90"
                }`}
              >
                <ArrowDown2 size={12} variant="Outline" color="currentColor" />
              </span>
            </button>
            {isScheduleOpen ? <>
            <div className="mb-2.5 grid grid-cols-3 gap-1.5">
              {(["Immediate", "Scheduled", "Recurring"] as ScheduleMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setScheduleMode(mode)}
                  className={`h-8 rounded-md text-xs font-semibold transition-colors ${scheduleButtonClass[mode]}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <SelectField label="Period" value={period} options={periodOptions} onChange={setPeriod} />
            </> : null}
          </section>
        </div>

        <section className="flex min-h-[80dvh] flex-col rounded-md border border-zinc-200 bg-white">
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-sm font-semibold text-zinc-500">Preview</h2>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-[#F7F7F7] px-2.5 text-[11px] font-medium text-zinc-600"
            >
              <Eye size={10} variant="Outline" color="currentColor" />
              Preview Campaign
            </button>
          </div>

          <CommunicationRichEditor
            value={editorHtml}
            onChange={setEditorHtml}
            className="min-h-0 flex-1"
          />
        </section>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 text-sm font-semibold text-primary-text"
        >
          Save as draft
        </button>
        <button
          type="button"
          onClick={() => setShowSuccessModal(true)}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary-green px-8 text-sm font-semibold text-primary-text"
        >
          Publish Campaign
        </button>
      </div>

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mt-2 h-1.5 w-20 rounded-full bg-zinc-200" />

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-22 w-22 items-center justify-center rounded-full bg-[#F9FAFB]">
                <TickCircle size={58} variant="Linear" color="#2f8f46" />
              </div>
              <h3 className="mt-6 text-[32px] leading-none font-semibold text-primary-text">Successful</h3>
              <p className="mt-4 text-[24px] leading-tight text-zinc-500">
                Communication has been usefully created
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-primary-green text-base font-semibold text-primary-text"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
