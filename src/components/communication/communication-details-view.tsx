"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Edit2, Eye, TickCircle } from "iconsax-react";
import { CommunicationRichEditor } from "@/components/communication/communication-rich-editor";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  getAdminCampaign,
  createAdminCampaign,
  publishAdminCampaign,
  cancelAdminCampaign,
  deleteAdminCampaign,
  campaignApiErrorMessage,
} from "@/lib/admin-api/communications-api";
import type { AdminCampaign, AdminCampaignStatus } from "@/lib/admin-api/types";

const periodOptions = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Yearly"];
const targetAudienceOptions = [
  "All users",
  "Transaction level",
  "Last transaction type",
  "Activity status",
  "User type",
  "App version",
  "Onboarding date",
];
const campaignCategoryOptions = ["Transactional", "Educational", "Announcement", "Promo"];
const communicationCategoryOptions = ["Email", "In-app", "Pop up"];

type ScheduleMode = "Immediate" | "Scheduled" | "Recurring";

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-zinc-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-md border border-zinc-200 bg-white px-3 pr-8 text-sm text-primary-text outline-none disabled:bg-zinc-50 disabled:text-zinc-400"
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

type CommunicationDetailsViewProps = {
  id?: string;
};

function applyCampaignToForm(campaign: AdminCampaign, setters: {
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setCampaignCategory: (v: string) => void;
  setCampaignSubCategory: (v: string) => void;
  setTargetAudience: (v: string) => void;
  setTargetSubCategory: (v: string) => void;
  setCommunicationCategory: (v: string) => void;
  setEditorHtml: (v: string) => void;
  setUploadedImage: (v: string | null) => void;
  setScheduleMode: (v: ScheduleMode) => void;
  setPeriod: (v: string) => void;
  setCampaignStatus: (v: AdminCampaignStatus) => void;
}) {
  setters.setTitle(campaign.title);
  setters.setDescription(campaign.description);
  setters.setCampaignCategory(campaign.campaignCategory);
  setters.setCampaignSubCategory(campaign.campaignSubCategory);
  setters.setTargetAudience(campaign.targetAudience);
  setters.setTargetSubCategory(campaign.targetSubCategory);
  setters.setCommunicationCategory(campaign.communicationCategory);
  setters.setEditorHtml(campaign.content);
  setters.setUploadedImage(campaign.imageUrl ?? null);
  setters.setScheduleMode(campaign.scheduleMode);
  setters.setPeriod(campaign.period);
  setters.setCampaignStatus(campaign.status);
}

export function CommunicationDetailsView({ id }: CommunicationDetailsViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isExisting = Boolean(id && id !== "new");

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [campaignStatus, setCampaignStatus] = useState<AdminCampaignStatus | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("Immediate");
  const [title, setTitle] = useState("🎁 Your Summer Savings Bonus Awaits!");
  const [description, setDescription] = useState("Get 10% extra when you save with Bobble this summer");
  const [period, setPeriod] = useState("Daily");
  const [targetAudience, setTargetAudience] = useState("All users");
  const [targetSubCategory, setTargetSubCategory] = useState("Tech support");
  const [campaignCategory, setCampaignCategory] = useState("Transactional");
  const [campaignSubCategory, setCampaignSubCategory] = useState("Vouchers offers");
  const [communicationCategory, setCommunicationCategory] = useState("Email");
  const [editorHtml, setEditorHtml] = useState("<p>Write campaign content...</p>");
  const [isNotificationOpen, setIsNotificationOpen] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Communication has been successfully created.");
  const [saving, setSaving] = useState(false);

  const applyCampaign = (campaign: AdminCampaign) => {
    applyCampaignToForm(campaign, {
      setTitle,
      setDescription,
      setCampaignCategory,
      setCampaignSubCategory,
      setTargetAudience,
      setTargetSubCategory,
      setCommunicationCategory,
      setEditorHtml,
      setUploadedImage,
      setScheduleMode,
      setPeriod,
      setCampaignStatus,
    });
  };

  const reloadCampaign = async (campaignId: string) => {
    const campaign = await getAdminCampaign(campaignId);
    if (!campaign) throw new Error("Campaign not found.");
    applyCampaign(campaign);
    return campaign;
  };

  useEffect(() => {
    if (!isExisting || !id) return;

    const loadDetail = async () => {
      setLoadingDetail(true);
      setLoadError(null);
      try {
        const campaign = await getAdminCampaign(id);
        if (campaign) {
          applyCampaign(campaign);
        } else {
          setLoadError("Campaign not found.");
        }
      } catch (e) {
        setLoadError(campaignApiErrorMessage(e, "Failed to load campaign details."));
      } finally {
        setLoadingDetail(false);
      }
    };

    void loadDetail();
  }, [id, isExisting]);

  useEffect(
    () => () => {
      if (uploadedImage && uploadedImage.startsWith("blob:")) URL.revokeObjectURL(uploadedImage);
    },
    [uploadedImage],
  );

  const updateImageFromFile = (file: File | null) => {
    if (isExisting) return;
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
          : "bg-outline text-zinc-600 hover:bg-zinc-200",
      Scheduled:
        scheduleMode === "Scheduled"
          ? "bg-primary-green text-primary-text"
          : "bg-outline text-zinc-600 hover:bg-zinc-200",
      Recurring:
        scheduleMode === "Recurring"
          ? "bg-primary-green text-primary-text"
          : "bg-outline text-zinc-600 hover:bg-zinc-200",
    }),
    [scheduleMode],
  );

  const buildCampaignBody = () => ({
    title,
    description,
    campaignCategory,
    campaignSubCategory,
    targetAudience,
    targetSubCategory,
    communicationCategory,
    content: editorHtml,
    imageUrl: uploadedImage?.startsWith("blob:") ? undefined : uploadedImage ?? undefined,
    scheduleMode,
    period: scheduleMode !== "Immediate" ? period : undefined,
  });

  const publishOptions = () => ({
    scheduleMode,
    period: scheduleMode !== "Immediate" ? period : undefined,
  });

  const handleSave = async (publish: boolean) => {
    setLoadError(null);
    setSaving(true);
    try {
      const newCampaign = await createAdminCampaign(buildCampaignBody());

      if (publish) {
        await publishAdminCampaign(newCampaign.id, publishOptions());
        setSuccessMessage("Campaign is now live.");
      } else {
        setSuccessMessage("Campaign saved as draft.");
      }

      setShowSuccessModal(true);
      router.replace(`/dashboard/communication/${newCampaign.id}`);
    } catch (e) {
      setLoadError(campaignApiErrorMessage(e, publish ? "Failed to publish campaign." : "Failed to save campaign."));
    } finally {
      setSaving(false);
    }
  };

  const handlePublishAction = async () => {
    if (!id) return;
    setActionOpen(false);
    setLoadingDetail(true);
    setLoadError(null);
    try {
      await publishAdminCampaign(id, publishOptions());
      await reloadCampaign(id);
      setSuccessMessage("Campaign is now live.");
      setShowSuccessModal(true);
    } catch (e) {
      setLoadError(campaignApiErrorMessage(e, "Failed to publish campaign."));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancelAction = async () => {
    if (!id) return;
    setActionOpen(false);
    setLoadingDetail(true);
    setLoadError(null);
    try {
      await cancelAdminCampaign(id);
      await reloadCampaign(id);
      setSuccessMessage("Campaign schedule has been cancelled.");
      setShowSuccessModal(true);
    } catch (e) {
      setLoadError(campaignApiErrorMessage(e, "Failed to cancel campaign."));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!id) return;
    setActionOpen(false);
    const confirmed = window.confirm("Are you sure you want to delete this draft campaign?");
    if (!confirmed) return;
    setLoadingDetail(true);
    setLoadError(null);
    try {
      await deleteAdminCampaign(id);
      router.push("/dashboard/communication");
    } catch (e) {
      setLoadError(campaignApiErrorMessage(e, "Failed to delete campaign."));
      setLoadingDetail(false);
    }
  };

  if (loadingDetail) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {loadError && (
        <div className="mb-4">
          <ErrorAlert error={loadError} onRetry={() => router.push("/dashboard/communication")} />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between rounded-xl border border-outline bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/dashboard/communication" className="inline-flex items-center gap-1 text-primary-text">
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Communication
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Communication Details</span>
          {campaignStatus && (
            <span
              className={`ml-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                campaignStatus === "Publish"
                  ? "bg-green-100 text-green-700"
                  : campaignStatus === "Pending"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {campaignStatus}
            </span>
          )}
        </div>

        {isExisting && (
          <div className="flex items-center gap-2">
            {campaignStatus === "Unpublished" ? (
              <button
                type="button"
                disabled={loadingDetail || saving}
                onClick={() => void handlePublishAction()}
                className="inline-flex h-8 items-center rounded-full bg-primary-green px-4 text-xs font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Go live
              </button>
            ) : null}
            <div className="relative">
            <button
              type="button"
              onClick={() => setActionOpen(!actionOpen)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-3 text-xs font-semibold text-primary-text transition-colors hover:bg-surface-subtle"
            >
              Action
              <ArrowDown2 size={12} variant="Outline" color="currentColor" />
            </button>
            {actionOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActionOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-[12px] border border-zinc-200 bg-white p-1.5 shadow-lg">
                  {campaignStatus === "Unpublished" && (
                    <>
                      <button
                        type="button"
                        onClick={() => void handlePublishAction()}
                        className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-50"
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAction()}
                        className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-red-600 rounded-md hover:bg-red-50"
                      >
                        Delete draft
                      </button>
                    </>
                  )}
                  {campaignStatus === "Pending" && (
                    <button
                      type="button"
                      onClick={() => void handleCancelAction()}
                      className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-50"
                    >
                      Cancel scheduled
                    </button>
                  )}
                </div>
              </>
            )}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <section className="rounded-xl border border-outline bg-white p-3">
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

            {isNotificationOpen ? (
              <div className="space-y-2.5">
                <SelectField
                  label="Category"
                  value={communicationCategory}
                  options={communicationCategoryOptions}
                  onChange={setCommunicationCategory}
                  disabled={isExisting}
                />
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-zinc-500">Title</label>
                  <input
                    value={title}
                    disabled={isExisting}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm text-primary-text outline-none disabled:bg-zinc-50 disabled:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-zinc-500">Subject</label>
                  <textarea
                    value={description}
                    disabled={isExisting}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Email or notification subject line"
                    className="w-full resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm text-primary-text outline-none disabled:bg-zinc-50 disabled:text-zinc-400"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFilePick}
                  className="hidden"
                  disabled={isExisting}
                />
                {uploadedImage ? (
                  <button
                    type="button"
                    onClick={() => !isExisting && fileInputRef.current?.click()}
                    className="relative h-28 w-full overflow-hidden rounded-lg border border-zinc-200"
                    disabled={isExisting}
                  >
                    <img src={uploadedImage} alt="Notification preview" className="h-full w-full object-cover" />
                    {!isExisting && (
                      <>
                        <span className="absolute inset-0 bg-black/25" />
                        <span className="absolute inset-0 inline-flex items-center justify-center gap-1 text-xs font-semibold text-white">
                          <Edit2 size={12} variant="Outline" color="currentColor" />
                          Replace image
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => !isExisting && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={onDropImage}
                    disabled={isExisting}
                    className={`flex h-28 w-full flex-col items-center justify-center rounded-lg border border-dashed text-center text-xs text-zinc-500 transition-colors ${
                      isDragOver ? "border-primary-green bg-primary-green/5" : "border-zinc-200"
                    } disabled:bg-zinc-50`}
                  >
                    Click to upload notification image or drag and drop
                    <span className="mt-1 text-[10px]">SVG, PNG, JPG (max 2MB)</span>
                  </button>
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-outline bg-white p-3">
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
            {isCategoryOpen ? (
              <div className="grid grid-cols-2 gap-2.5">
                <SelectField
                  label="Category"
                  value={campaignCategory}
                  options={campaignCategoryOptions}
                  onChange={setCampaignCategory}
                  disabled={isExisting}
                />
                <SelectField
                  label="Sub-category"
                  value={campaignSubCategory}
                  options={["Vouchers offers", "Cashback", "Savings", "Bonus"]}
                  onChange={setCampaignSubCategory}
                  disabled={isExisting}
                />
                <SelectField
                  label="Target Audience"
                  value={targetAudience}
                  options={targetAudienceOptions}
                  onChange={setTargetAudience}
                  disabled={isExisting}
                />
                <SelectField
                  label="Sub-category"
                  value={targetSubCategory}
                  options={["Tech support", "Customer", "Admin", "General"]}
                  onChange={setTargetSubCategory}
                  disabled={isExisting}
                />
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-outline bg-white p-3">
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
            {isScheduleOpen ? (
              <>
                <div className="mb-2.5 grid grid-cols-3 gap-1.5">
                  {(["Immediate", "Scheduled", "Recurring"] as ScheduleMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={isExisting}
                      onClick={() => setScheduleMode(mode)}
                      className={`h-8 rounded-md text-xs font-semibold transition-colors ${scheduleButtonClass[mode]} disabled:opacity-50`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <SelectField
                  label="Period"
                  value={period}
                  options={periodOptions}
                  onChange={setPeriod}
                  disabled={isExisting}
                />
              </>
            ) : null}
          </section>
        </div>

        <section className="flex min-h-[80dvh] flex-col rounded-md border border-zinc-200 bg-white">
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-sm font-semibold text-zinc-500">Preview</h2>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-grey-100 px-2.5 text-[11px] font-medium text-zinc-600"
            >
              <Eye size={10} variant="Outline" color="currentColor" />
              Preview Campaign
            </button>
          </div>

          <CommunicationRichEditor
            value={editorHtml}
            onChange={setEditorHtml}
            className="min-h-0 flex-1"
            disabled={isExisting}
          />
        </section>
      </div>

      {!isExisting && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave(false)}
            className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 bg-white px-8 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save as draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave(true)}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary-green px-8 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Publishing…" : "Go live"}
          </button>
        </div>
      )}

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mt-2 h-1.5 w-20 rounded-full bg-zinc-200" />

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-22 w-22 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <TickCircle size={58} variant="Linear" color="var(--color-success)" />
              </div>
              <h3 className="mt-6 text-[32px] leading-none font-semibold text-primary-text">Successful</h3>
              <p className="mt-4 text-[24px] leading-tight text-zinc-500">{successMessage}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/dashboard/communication");
              }}
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
